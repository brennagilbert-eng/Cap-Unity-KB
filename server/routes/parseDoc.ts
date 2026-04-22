import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
// @ts-ignore — pdf-parse has no bundled types
import pdfParse from 'pdf-parse';

export const parseDocRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|md|pdf|docx|doc)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a PDF, Word doc, or text file.'));
    }
  },
});

parseDocRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { buffer, mimetype, originalname } = req.file;

  try {
    let text = '';

    if (mimetype === 'application/pdf' || originalname.match(/\.pdf$/i)) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.match(/\.docx$/i)
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      // Plain text / markdown
      text = buffer.toString('utf8');
    }

    // Clean up whitespace
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (text.length < 20) {
      return res.status(422).json({ error: 'Could not extract text from this file.' });
    }

    // Truncate to ~12,000 chars to stay within token budget alongside the RAG context
    const truncated = text.length > 12000;
    const content = truncated ? text.slice(0, 12000) + '\n\n[Document truncated for length]' : text;

    return res.json({
      filename: originalname,
      content,
      truncated,
      charCount: text.length,
    });
  } catch (err) {
    console.error('[parse-doc]', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});
