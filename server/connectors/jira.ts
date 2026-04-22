import axios from 'axios';
import { upsertDocument } from '../lib/embeddings.js';

interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string | { content?: Array<{ content?: Array<{ text?: string }> }> };
    status: { name: string };
    issuetype: { name: string };
    assignee?: { displayName: string };
    priority?: { name: string };
  };
}

function extractJiraText(
  desc: JiraIssue['fields']['description'],
): string {
  if (!desc) return '';
  if (typeof desc === 'string') return desc.slice(0, 3000);
  // Atlassian Document Format (ADF)
  const texts: string[] = [];
  for (const block of desc.content ?? []) {
    for (const inline of block.content ?? []) {
      if (inline.text) texts.push(inline.text);
    }
  }
  return texts.join(' ').slice(0, 3000);
}

export async function runJira(): Promise<number> {
  const base = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const projectKeys = (process.env.JIRA_PROJECT_KEYS ?? '').split(',').filter(Boolean);

  if (!base || !email || !token) {
    console.warn('[jira] Missing env vars — skipping.');
    return 0;
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };

  const projectFilter =
    projectKeys.length > 0
      ? `project in (${projectKeys.map((k) => `"${k}"`).join(',')})`
      : 'project is not EMPTY';

  let indexed = 0;
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const { data } = await axios.get<{
      issues: JiraIssue[];
      total: number;
      startAt: number;
      maxResults: number;
    }>(
      `${base}/rest/api/3/search?jql=${encodeURIComponent(projectFilter + ' ORDER BY updated DESC')}&startAt=${startAt}&maxResults=${maxResults}&fields=summary,description,status,issuetype,assignee,priority`,
      { headers },
    );

    for (const issue of data.issues) {
      const descText = extractJiraText(issue.fields.description);
      const content = [
        `Type: ${issue.fields.issuetype.name}`,
        `Status: ${issue.fields.status.name}`,
        issue.fields.priority ? `Priority: ${issue.fields.priority.name}` : '',
        descText,
      ]
        .filter(Boolean)
        .join('\n');

      await upsertDocument({
        source: 'jira',
        source_id: `jira_${issue.key}`,
        title: `[${issue.key}] ${issue.fields.summary}`,
        content,
        url: `${base}/browse/${issue.key}`,
        author: issue.fields.assignee?.displayName,
      });
      indexed++;
    }

    if (startAt + data.issues.length >= data.total) break;
    startAt += maxResults;
  }

  return indexed;
}
