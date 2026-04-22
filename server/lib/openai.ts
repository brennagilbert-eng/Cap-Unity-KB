import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY must be set in .env');

export const openai = new OpenAI({ apiKey });

export const CHAT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';
export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
