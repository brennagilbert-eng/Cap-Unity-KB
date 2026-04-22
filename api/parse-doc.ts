import type { VercelRequest, VercelResponse } from '@vercel/node';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, type, data } = req.body as {
    name?: string;
    type?: string;
    data?: string; // base64-encoded file content
  };

  if (!data || !name) {
    return res.status(400).json({ error: 'name and data are required' });
  }

  try {
    const buffer = Buffer.from(data, 'base64');
    let text = '';

    if (type === 'application/pdf' || name.match(/\.pdf$/i)) {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.match(/\.docx$/i)
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString('utf8');
    }

    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (text.length < 20) {
      return res.status(422).json({ error: 'Could not extract text from this file.' });
    }

    const truncated = text.length > 12000;
    const content = truncated ? text.slice(0, 12000) + '\n\n[Document truncated for length]' : text;

    return res.json({
      filename: name,
      content,
      truncated,
      charCount: text.length,
    });
  } catch (err) {
    console.error('[parse-doc]', err);
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    return res.status(500).json({ error: msg });
  }
}
