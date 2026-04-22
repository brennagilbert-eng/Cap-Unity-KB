import axios from 'axios';
import { upsertDocument } from '../lib/embeddings.js';

interface SlackMessage {
  ts: string;
  text: string;
  user?: string;
  username?: string;
  thread_ts?: string;
  reply_count?: number;
}

interface SlackChannel {
  id: string;
  name: string;
}

export async function runSlack(): Promise<number> {
  const token = process.env.SLACK_BOT_TOKEN;
  const channelIds = (process.env.SLACK_CHANNEL_IDS ?? '').split(',').filter(Boolean);

  if (!token) {
    console.warn('[slack] Missing SLACK_BOT_TOKEN — skipping.');
    return 0;
  }

  const headers = { Authorization: `Bearer ${token}` };
  let indexed = 0;

  // If no channel IDs provided, fetch all public channels
  let targets = channelIds;
  if (!targets.length) {
    const { data } = await axios.get<{ channels: SlackChannel[] }>(
      'https://slack.com/api/conversations.list?limit=200&types=public_channel',
      { headers },
    );
    targets = (data.channels ?? []).map((c) => c.id);
  }

  // Only index messages from the last 90 days to keep context fresh
  const oldest = String(Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60);

  for (const channelId of targets) {
    let cursor: string | undefined;

    do {
      const params = new URLSearchParams({ channel: channelId, oldest, limit: '200' });
      if (cursor) params.set('cursor', cursor);

      const { data } = await axios.get<{
        messages: SlackMessage[];
        response_metadata?: { next_cursor?: string };
        ok: boolean;
        error?: string;
      }>(`https://slack.com/api/conversations.history?${params.toString()}`, { headers });

      if (!data.ok) {
        console.warn(`[slack] channel ${channelId}: ${data.error}`);
        break;
      }

      // Bundle thread starters + their replies into single chunks
      const threads = data.messages.filter(
        (m) => m.thread_ts === m.ts && (m.reply_count ?? 0) > 0,
      );
      const standalones = data.messages.filter(
        (m) => !m.thread_ts && m.text?.trim(),
      );

      // Index standalone messages (group into batches of 10 for context)
      for (let i = 0; i < standalones.length; i += 10) {
        const batch = standalones.slice(i, i + 10);
        const content = batch.map((m) => m.text).join('\n');
        await upsertDocument({
          source: 'slack',
          source_id: `slack_${channelId}_${batch[0].ts}`,
          title: `#${channelId} messages`,
          content: content.slice(0, 3000),
          url: `https://slack.com/app_redirect?channel=${channelId}`,
        });
        indexed++;
      }

      // Index threads
      for (const thread of threads) {
        const { data: threadData } = await axios.get<{ messages: SlackMessage[] }>(
          `https://slack.com/api/conversations.replies?channel=${channelId}&ts=${thread.ts}&limit=50`,
          { headers },
        );
        const content = (threadData.messages ?? []).map((m) => m.text).join('\n');
        await upsertDocument({
          source: 'slack',
          source_id: `slack_thread_${channelId}_${thread.ts}`,
          title: `Thread: ${thread.text?.slice(0, 80) ?? 'Slack thread'}`,
          content: content.slice(0, 3000),
          url: `https://slack.com/app_redirect?channel=${channelId}`,
          author: thread.username ?? thread.user,
        });
        indexed++;
      }

      cursor = data.response_metadata?.next_cursor;
    } while (cursor);
  }

  return indexed;
}
