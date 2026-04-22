import axios from 'axios';
import { upsertDocument } from '../lib/embeddings.js';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  owners?: Array<{ displayName: string }>;
}

type GoogleAuthToken = { access_token: string; expires_in: number };

async function getGoogleAccessToken(): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');

  const sa = JSON.parse(raw) as {
    client_email: string;
    private_key: string;
    token_uri: string;
  };

  // Build a JWT assertion for the service account
  const { SignJWT, importPKCS8 } = await import('jose');
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(sa.private_key, 'RS256');
  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(sa.client_email)
    .setAudience(sa.token_uri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const { data } = await axios.post<GoogleAuthToken>(
    sa.token_uri,
    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  return data.access_token;
}

const INDEXABLE_MIME_TYPES = [
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'text/plain',
  'text/markdown',
];

export async function runDrive(): Promise<number> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.warn('[drive] Missing GOOGLE_SERVICE_ACCOUNT_JSON — skipping.');
    return 0;
  }

  const token = await getGoogleAccessToken();
  const headers = { Authorization: `Bearer ${token}` };
  let indexed = 0;

  // List files in the target folder (or all if no folder specified)
  const query = folderId
    ? `'${folderId}' in parents and trashed = false`
    : 'trashed = false';

  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: query,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, owners)',
      pageSize: '100',
      ...(pageToken ? { pageToken } : {}),
    });

    const { data } = await axios.get<{
      files: DriveFile[];
      nextPageToken?: string;
    }>(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, { headers });

    for (const file of data.files) {
      if (!INDEXABLE_MIME_TYPES.includes(file.mimeType)) continue;

      try {
        let content = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
          // Export Google Doc as plain text
          const { data: text } = await axios.get<string>(
            `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
            { headers, responseType: 'text' },
          );
          content = text;
        } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
          // Export as plain text
          const { data: text } = await axios.get<string>(
            `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
            { headers, responseType: 'text' },
          );
          content = text;
        } else {
          // Download raw text file
          const { data: text } = await axios.get<string>(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            { headers, responseType: 'text' },
          );
          content = text;
        }

        if (!content.trim()) continue;

        await upsertDocument({
          source: 'drive',
          source_id: `drive_${file.id}`,
          title: file.name,
          content: content.slice(0, 4000),
          url: file.webViewLink,
          author: file.owners?.[0]?.displayName,
        });
        indexed++;
      } catch (err) {
        console.warn(`[drive] Could not index ${file.name}: ${(err as Error).message}`);
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return indexed;
}
