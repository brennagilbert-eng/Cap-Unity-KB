import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

export type Source = 'confluence' | 'jira' | 'slack' | 'drive' | 'web';

export const ALL_SOURCES: Source[] = ['confluence', 'jira', 'slack', 'drive', 'web'];

export interface Citation {
  id: string;
  source: Source;
  title: string;
  url: string;
  author?: string;
  similarity: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  sources?: Source[];
  timestamp: Date;
  loading?: boolean;
}

export default function App() {
  const [activeSources, setActiveSources] = useState<Source[]>([...ALL_SOURCES]);
  const [messages, setMessages] = useState<Message[]>([]);

  function toggleSource(source: Source) {
    setActiveSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeSources={activeSources} onToggleSource={toggleSource} />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          activeSources={activeSources}
        />
      </main>
    </div>
  );
}
