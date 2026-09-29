import type { ChatMessageItem } from './AIAssistantPage';

export const CHAT_STORAGE_KEY = 'vietgo_chat_history_v1';

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessageItem[];
}

export interface ChatHistory {
  sessions: ChatSession[];
  activeSessionId: string;
}

export function createChatSession(): ChatSession {
  return {
    id: `session-${crypto.randomUUID()}`,
    title: 'Cuộc trò chuyện mới',
    updatedAt: new Date().toISOString(),
    messages: [{
      id: `welcome-${crypto.randomUUID()}`,
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Du lịch VietGo. Bạn muốn tìm hiểu điểm đến, ẩm thực hay lập lịch trình cho chuyến đi nào tại Việt Nam?',
      timestamp: 'Bây giờ',
    }],
  };
}

export function loadChatHistory(): ChatHistory {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const ids = new Set<string>();
      const sessions = Array.isArray(saved?.sessions) ? saved.sessions.filter((session: any) => {
        if (!session || typeof session.id !== 'string' || ids.has(session.id) ||
          typeof session.title !== 'string' || typeof session.updatedAt !== 'string' ||
          !Array.isArray(session.messages) || !session.messages.every((message: any) =>
            message && typeof message.id === 'string' && typeof message.text === 'string' &&
            typeof message.timestamp === 'string' && ['user', 'ai'].includes(message.sender))) return false;
        ids.add(session.id);
        return true;
      }) : [];
      if (sessions.length) return {
        sessions,
        activeSessionId: ids.has(saved.activeSessionId) ? saved.activeSessionId : sessions[0].id,
      };
    }
  } catch {
    // Corrupt or unavailable storage must not prevent opening the assistant.
  }
  const session = createChatSession();
  return { sessions: [session], activeSessionId: session.id };
}

export function appendChatMessage(history: ChatHistory, sessionId: string, message: ChatMessageItem): ChatHistory {
  return {
    ...history,
    sessions: history.sessions.map(session => session.id !== sessionId ? session : {
      ...session,
      title: message.sender === 'user' && !session.messages.some(item => item.sender === 'user')
        ? message.text.trim().replace(/\s+/g, ' ').slice(0, 60) : session.title,
      updatedAt: new Date().toISOString(),
      messages: [...session.messages, message],
    }),
  };
}

export function deleteChatSession(history: ChatHistory, sessionId: string): ChatHistory {
  const remaining = history.sessions.filter(session => session.id !== sessionId);
  const sessions = remaining.length ? remaining : [createChatSession()];
  return {
    sessions,
    activeSessionId: sessions.some(session => session.id === history.activeSessionId)
      ? history.activeSessionId : sessions[0].id,
  };
}
