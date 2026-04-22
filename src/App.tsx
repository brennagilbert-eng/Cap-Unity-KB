import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';
import { useAuth } from './hooks/useAuth';

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
  const { session, loading } = useAuth();
  const [activeSources, setActiveSources] = useState<Source[]>([...ALL_SOURCES]);
  const [messages, setMessages] = useState<Message[]>([]);

  function toggleSource(source: Source) {
    setActiveSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-earth" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Not signed in
  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <main className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          activeSources={activeSources}
          onToggleSource={toggleSource}
          user={session.user}
        />
      </main>
    </div>
  );
}
