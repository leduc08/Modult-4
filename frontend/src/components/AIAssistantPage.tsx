import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  Sparkles, 
  Compass, 
  Utensils, 
  ShieldAlert, 
  Calendar, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeft, 
  PlusCircle, 
  Star, 
  MapPin, 
  MessageSquare,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { POI, FoodSpot, TravelTip } from '../types';
import { DetailItem } from './ItemDetailModal';
import { CHAT_STORAGE_KEY, loadChatHistory, createChatSession, appendChatMessage, deleteChatSession } from './chatHistory';
import type { ChatActionName, ChatActionContext } from '../../../database/chatActionTypes';
import { AIReplyText } from './AIReplyText';
import { AIImageInput } from './AIImageInput';
import { getSuggestedChatActions } from '../../../ai/suggestedChatActions';
import { normalizeAIReceipt, type AIReceiptDraft, type AIReceiptImport } from '../../../database/aiReceiptTypes';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imageThumbnail?: string;
  actionsUnavailable?: boolean;
  verifiedActions?: string[];
  actionContextText?: string;
  receiptDraft?: AIReceiptDraft;
  receiptThumbnail?: string;
  knowledgeSources?: { id: string; title: string; sourceUrl: string }[];
  richData?: {
    pois?: POI[];
    foods?: FoodSpot[];
    tips?: TravelTip[];
    tripPreview?: ChatActionContext;
    tripPreviewUserId?: string;
    extractedTrip?: {
      destination: string;
      days: number;
      guests: number;
      budget?: number;
      style?: string;
    };
  };
  suggestedActions?: {
    label: string;
    action: string;
    payload?: any;
  }[];
}

interface AIAssistantPageProps {
  initialQuery?: string;
  onInitialQueryConsumed?: () => void;
  onSelectItem: (item: DetailItem) => void;
  onAddToItinerary: (item: DetailItem) => void;
  onProceedToItinerary: (params: { destination: string; days: number; guests: number; style?: string }) => void;
  onExecuteChatAction: (action: ChatActionName, context: ChatActionContext) => Promise<void>;
  onImportReceipt: (receipt: AIReceiptImport) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  initialQuery,
  onInitialQueryConsumed,
  onSelectItem,
  onAddToItinerary,
  onProceedToItinerary,
  onExecuteChatAction,
  onImportReceipt,
}) => {
  // Keep the document scrollbar gutter while this viewport-sized tab is open.
  // Reset document scrolling before paint; only the chat panels should scroll.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = {
      overflowY: root.style.overflowY,
      scrollbarGutter: root.style.scrollbarGutter,
      scrollBehavior: root.style.scrollBehavior,
    };
    root.style.scrollbarGutter = 'stable';
    root.style.overflowY = 'hidden';
    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return () => {
      root.style.overflowY = previous.overflowY;
      root.style.scrollbarGutter = previous.scrollbarGutter;
      root.style.scrollBehavior = previous.scrollBehavior;
    };
  }, []);

  // Chat sidebar toggle on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const [aiStatus, setAiStatus] = useState<{ hasDeepSeekKey: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Health check failed')))
      .then(data => {
        if (data.aiProvider === 'deepseek') setAiStatus({ hasDeepSeekKey: data.hasDeepSeekKey === true });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  
  // Chat sessions
  const [history, setHistory] = useState(loadChatHistory);
  const { sessions, activeSessionId } = history;
  const messages = sessions.find(session => session.id === activeSessionId)!.messages;
  const [storageError, setStorageError] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<string[]>([]);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const finishTyping = useCallback(() => setTypingMessageId(null), []);
  const actionBusy = useRef(false);
  const [actionError, setActionError] = useState<{ messageId: string; text: string } | null>(null);
  const requests = useRef(new Map<string, AbortController>());
  const consumedQuery = useRef('');

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [history]);

  useEffect(() => () => {
    requests.current.forEach(controller => controller.abort());
  }, []);

  const [inputMessage, setInputMessage] = useState('');
  const isLoading = pendingSessions.includes(activeSessionId);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const followChatRef = useRef(true);
  const manualScrollRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Observe rendered height, including the child typewriter animation. Scroll
  // only this panel; repeated smooth scrolling would lag behind the reply.
  const scrollToBottom = useCallback(() => {
    const panel = chatScrollRef.current;
    if (!panel || !followChatRef.current) return;
    panel.scrollTop = panel.scrollHeight;
    lastScrollTopRef.current = panel.scrollTop;
  }, []);

  useEffect(() => {
    followChatRef.current = true;
    manualScrollRef.current = false;
    lastScrollTopRef.current = 0;
    scrollToBottom();
  }, [activeSessionId, scrollToBottom]);

  useEffect(() => {
    const content = chatContentRef.current;
    const panel = chatScrollRef.current;
    if (!content || !panel) return;
    const observer = new ResizeObserver(scrollToBottom);
    observer.observe(content);
    observer.observe(panel);
    return () => {
      observer.disconnect();
    };
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // If initialQuery provided, send it automatically
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      if (consumedQuery.current === initialQuery || requests.current.has(activeSessionId)) return;
      consumedQuery.current = initialQuery;
      handleSendMessage(initialQuery);
      onInitialQueryConsumed?.();
    } else {
      consumedQuery.current = '';
    }
  }, [initialQuery, activeSessionId, pendingSessions]);

  // Topic prompt chips for quick discovery
  const topicChips = [
    { label: '🏛️ Văn hóa & Danh thắng', prompt: 'Top 3 di tích lịch sử và văn hóa ngàn năm đặc sắc nhất ở Huế và Hội An?' },
    { label: '🍲 Ẩm thực chuẩn vị', prompt: 'Gợi ý các quán ăn gia truyền tại Đà Nẵng giá chuẩn, không phụ thu?' },
    { label: '✈️ Quy định hàng không', prompt: 'Quy định đóng thùng xốp mang nước mắm và sầu riêng lên máy bay Vietnam Airlines và Vietjet?' },
    { label: '🛡️ Tránh bẫy du lịch', prompt: 'Mẹo tránh bẫy taxi dù tại sân bay Nội Bài và Tân Sơn Nhất?' },
    { label: '📅 Lập lịch trình', prompt: 'Lập lịch trình du lịch Đà Lạt 3 ngày 2 đêm cho cặp đôi ngân sách 5 triệu' }
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || requests.current.has(activeSessionId)) return;
    followChatRef.current = true;
    const sessionId = activeSessionId;
    const controller = new AbortController();
    requests.current.set(sessionId, controller);

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => appendChatMessage(prev, sessionId, userMessage));
    setInputMessage('');
    setPendingSessions(prev => [...prev, sessionId]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Không thể kết nối máy chủ');
      }

      const data = await response.json();

      const aiMsg: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text || 'VietGo AI sẵn sàng hỗ trợ bạn!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        knowledgeSources: Array.isArray(data.knowledgeSources) ? data.knowledgeSources : [],
        actionsUnavailable: data.actionsUnavailable === true,
        actionContextText: typeof data.actionContextText === 'string' ? data.actionContextText.slice(0, 6000) : undefined,
        richData: {
          pois: data.richData?.pois || [],
          foods: data.richData?.foods || [],
          tips: data.richData?.tips || [],
        },
        suggestedActions: data.suggestedActions || [],
        verifiedActions: Array.isArray(data.verifiedActions) ? data.verifiedActions : [],
      };

      if (!controller.signal.aborted) {
        setTypingMessageId(aiMsg.id);
        setHistory(prev => appendChatMessage(prev, sessionId, aiMsg));
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error(err);
      const fallbackMsg: ChatMessageItem = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Chưa nhận được phản hồi AI: ${err.message || 'Không thể kết nối máy chủ'}. Bạn có thể thử gửi lại câu hỏi.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => appendChatMessage(prev, sessionId, fallbackMsg));
    } finally {
      requests.current.delete(sessionId);
      setPendingSessions(prev => prev.filter(id => id !== sessionId));
    }
  };

  const handleAnalyzeImage = async (imageDataUrl: string, thumbnail: string) => {
    if (requests.current.has(activeSessionId) || actionBusy.current) throw new Error('Hãy chờ thao tác hiện tại hoàn tất.');
    const sessionId = activeSessionId;
    const question = inputMessage.trim();
    const controller = new AbortController();
    requests.current.set(sessionId, controller);
    setPendingSessions(prev => [...prev, sessionId]);
    setInputMessage('');
    setHistory(prev => appendChatMessage(prev, sessionId, {
      id: `user-image-${crypto.randomUUID()}`, sender: 'user', text: question || 'Phân tích ảnh này giúp mình.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageThumbnail: thumbnail,
    }));
    try {
      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ imageDataUrl, question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không phân tích được ảnh.');
      const id = `ai-image-${crypto.randomUUID()}`;
      if (!controller.signal.aborted) {
        setTypingMessageId(id);
        setHistory(prev => appendChatMessage(prev, sessionId, { id, sender: 'ai', text: data.text,
          ...(data.category === 'receipt' ? {
            receiptDraft: normalizeAIReceipt({ ...data.receiptDraft, store: data.receiptDraft?.title, totalAmount: data.receiptDraft?.amount }),
            receiptThumbnail: thumbnail,
          } : {}),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          knowledgeSources: Array.isArray(data.knowledgeSources) ? data.knowledgeSources : [],
          richData: {
            pois: Array.isArray(data.richData?.pois) ? data.richData.pois : [],
            foods: Array.isArray(data.richData?.foods) ? data.richData.foods : [],
            tips: [],
          } }));
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setHistory(prev => appendChatMessage(prev, sessionId, {
          id: `ai-image-error-${crypto.randomUUID()}`, sender: 'ai',
          text: `Chưa phân tích được ảnh: ${e instanceof Error ? e.message : 'Lỗi kết nối.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
      }
      throw e;
    } finally {
      requests.current.delete(sessionId);
      setPendingSessions(prev => prev.filter(id => id !== sessionId));
    }
  };

  const handleChatAction = async (action: ChatActionName, messageId: string) => {
    if (actionBusy.current || isLoading) return;
    const sessionId = activeSessionId;
    actionBusy.current = true;
    setRunningAction(`${messageId}:${action}`);
    setActionError(null);
    try {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const response = await fetch('/api/chat-action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, messages: (action === 'open_planner' ? messages : messages.slice(0, messageIndex + 1))
          .filter(m => !m.richData?.tripPreview).map(m => ({ sender: m.sender, text: `${m.text}${m.actionContextText ? `\n${m.actionContextText}` : ''}` })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể xác định yêu cầu trong cuộc chat.');
      if (action === 'open_planner') {
        setHistory(prev => appendChatMessage(prev, sessionId, {
          id: `trip-preview-${crypto.randomUUID()}`, sender: 'ai',
          text: 'Đây là thông tin chuyến đi tổng hợp từ cuộc chat, ưu tiên các cập nhật mới nhất của bạn. Kiểm tra trước khi tiếp tục nhé.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          richData: { tripPreview: data, tripPreviewUserId: messages.filter(m => m.sender === 'user').at(-1)?.id },
        }));
      } else {
        await onExecuteChatAction(action, data);
      }
    } catch (error) {
      setActionError({ messageId, text: error instanceof Error ? error.message : 'Không thể thực hiện thao tác. Hãy thử lại.' });
    } finally {
      actionBusy.current = false;
      setRunningAction(null);
    }
  };

  const handleConfirmTrip = async (message: ChatMessageItem) => {
    if (actionBusy.current || isLoading || !message.richData?.tripPreview) return;
    if (message.richData.tripPreviewUserId !== messages.filter(m => m.sender === 'user').at(-1)?.id) {
      // A new user request must be reviewed before generating a plan.
      await handleChatAction('open_planner', message.id);
      return;
    }
    actionBusy.current = true;
    setRunningAction(`${message.id}:confirm_planner`);
    setActionError(null);
    try {
      await onExecuteChatAction('open_planner', message.richData.tripPreview);
    } catch (error) {
      setActionError({ messageId: message.id, text: error instanceof Error ? error.message : 'Không thể tạo lịch trình. Hãy thử lại.' });
    } finally {
      actionBusy.current = false;
      setRunningAction(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    const session = createChatSession();
    setHistory(prev => ({ sessions: [session, ...prev.sessions], activeSessionId: session.id }));
    setTypingMessageId(null);
    setInputMessage('');
  };

  const handleDeleteChat = (sessionId: string) => {
    if (!window.confirm('Xoá cuộc trò chuyện này? Nội dung đã xoá không thể khôi phục.')) return;
    requests.current.get(sessionId)?.abort();
    setHistory(prev => deleteChatSession(prev, sessionId));
    if (sessionId === activeSessionId) setInputMessage('');
  };

  return (
    <div className="relative flex h-full min-h-0 w-full bg-white text-[#222222] overflow-hidden">
      {/* 1. Desktop Collapsible Sidebar (Chat History) */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } ${sidebarOpen ? 'flex' : 'hidden md:flex'} absolute inset-y-0 left-0 z-30 md:relative max-w-[80vw] min-h-0 flex-col border-r border-[#E5E5E5] bg-[#F7F7F7] transition-all duration-300 overflow-hidden shrink-0`}
      >
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] hover:border-[#222222] text-xs font-bold text-[#222222] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF385C]" />
            <span>Đoạn chat mới</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} aria-label="Đóng lịch sử chat" className="md:hidden ml-2 p-2 rounded-lg hover:bg-white">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[11px] font-bold text-[#717171] px-3 py-2 uppercase tracking-wider">
            Lịch sử trò chuyện
          </div>
          {sessions.map((sess) => (
            <div key={sess.id} className="flex items-center gap-1">
            <button
              key={sess.id}
              onClick={() => {
                setHistory(prev => ({ ...prev, activeSessionId: sess.id }));
                setInputMessage('');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              title={sess.title}
              aria-current={activeSessionId === sess.id ? 'true' : undefined}
              className={`min-w-0 flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer truncate ${
                activeSessionId === sess.id 
                  ? 'bg-white text-[#222222] shadow-2xs font-bold border border-[#E5E5E5]'
                  : 'text-[#717171] hover:bg-white/60 hover:text-[#222222]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />
              <span className="min-w-0 truncate">{sess.title}</span>
            </button>
            <button
              onClick={() => handleDeleteChat(sess.id)}
              aria-label={`Xoá cuộc trò chuyện: ${sess.title}`}
              title="Xoá cuộc trò chuyện"
              className="shrink-0 p-2 rounded-lg text-[#717171] hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            </div>
          ))}
        </div>

        {/* Info footnote */}
        <div className="p-3 border-t border-[#E5E5E5] text-[11px] text-[#717171] text-center">
          VietGo AI • Trợ lý du lịch số 1 Việt Nam
        </div>
      </aside>

      {/* 2. Main Chat Canvas */}
      <div className="min-w-0 min-h-0 flex-1 flex flex-col h-full bg-white relative">
        {/* Top Chat Header */}
        <div className="h-14 px-4 sm:px-6 border-b border-[#E5E5E5] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex p-1.5 rounded-lg hover:bg-[#F7F7F7] text-[#717171] hover:text-[#222222] cursor-pointer"
              aria-label={sidebarOpen ? 'Thu gọn lịch sử chat' : 'Mở lịch sử chat'}
              title={sidebarOpen ? 'Thu gọn sidebar' : 'Mở sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <div className="w-7 h-7 rounded-full bg-[#FF385C] text-white flex items-center justify-center font-black text-xs shadow-xs">
              AI
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#222222] flex items-center gap-1.5">
                <span>Trợ lý Du lịch VietGo AI</span>
                <span className={`w-1.5 h-1.5 rounded-full ${aiStatus?.hasDeepSeekKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <div className="text-[10px] text-[#717171]">
                {aiStatus ? aiStatus.hasDeepSeekKey ? 'Sẵn sàng hỗ trợ chuyến đi của bạn' : 'Trợ lý AI chưa được cấu hình' : 'Đang kiểm tra kết nối AI...'}
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="md:hidden flex items-center gap-1 text-xs font-bold text-[#FF385C]"
          >
            <Plus className="w-4 h-4" />
            <span>Chat mới</span>
          </button>
        </div>

        {/* Chat Messages Scroll Area */}
        <div ref={chatScrollRef}
          onScroll={event => {
            const panel = event.currentTarget;
            const nearBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight <= 48;
            if (nearBottom) followChatRef.current = true;
            else if (manualScrollRef.current && panel.scrollTop < lastScrollTopRef.current) followChatRef.current = false;
            manualScrollRef.current = false;
            lastScrollTopRef.current = panel.scrollTop;
          }}
          onWheel={event => {
            manualScrollRef.current = true;
            if (event.deltaY < 0) followChatRef.current = false;
          }}
          onTouchMove={() => { manualScrollRef.current = true; }}
          onPointerDown={() => { manualScrollRef.current = true; }}
          onKeyDown={event => {
            if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) manualScrollRef.current = true;
          }}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 max-w-4xl mx-auto w-full">
          <div ref={chatContentRef} className="space-y-6">
          {storageError && (
            <p role="alert" className="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">
              Trình duyệt không thể lưu lịch sử chat. Nội dung có thể mất khi tải lại trang; hãy kiểm tra dung lượng hoặc quyền lưu trữ.
            </p>
          )}
          {/* Topic suggestion chips if only initial messages */}
          {messages.length <= 2 && (
            <div className="space-y-2.5 pt-2 pb-4">
              <div className="text-xs font-bold text-[#717171]">Gợi ý câu hỏi phổ biến:</div>
              <div className="flex flex-wrap gap-2">
                {topicChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="text-xs font-medium bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[#222222] border border-[#E5E5E5] rounded-full px-3.5 py-1.5 transition-all cursor-pointer text-left"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages rendering */}
          {messages.map((msg, messageIndex) => {
            const isAi = msg.sender === 'ai';
            const visibleActions = getSuggestedChatActions(messages.slice(0, messageIndex), msg);
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                  isAi ? 'bg-[#FF385C] text-white' : 'bg-[#222222] text-white'
                }`}>
                  {isAi ? 'AI' : 'Bạn'}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[78%] space-y-3 ${
                  isAi ? 'text-[#222222]' : 'text-right'
                }`}>
                  {msg.imageThumbnail?.startsWith('data:image/jpeg;base64,') && <img src={msg.imageThumbnail} alt="Ảnh đã gửi cho AI" className="max-w-48 max-h-48 rounded-xl border" />}
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line inline-block text-left ${
                    isAi 
                      ? 'bg-[#F7F7F7] border border-[#E5E5E5] text-[#222222]' 
                      : 'bg-[#222222] text-white shadow-xs'
                  } break-words [overflow-wrap:anywhere]`}>
                    {isAi ? <AIReplyText text={msg.text} animate={typingMessageId === msg.id} onComplete={finishTyping} /> : msg.text}
                  </div>

                  {isAi && msg.receiptDraft && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left space-y-2 text-xs">
                      <p className="font-bold">Thông tin hóa đơn</p>
                      <p>{msg.receiptDraft.title || 'Chưa đọc được tên cửa hàng'}</p>
                      <p>Số tiền: {msg.receiptDraft.amount ? `${msg.receiptDraft.amount.toLocaleString('vi-VN')} VNĐ` : 'Cần nhập lại số tiền VNĐ'}</p>
                      {msg.receiptDraft.date && <p>Ngày: {msg.receiptDraft.date}</p>}
                      <p className="text-emerald-800">Kiểm tra thông tin và chọn chuyến đi trước khi lưu.</p>
                      <button type="button" onClick={() => onImportReceipt({ ...msg.receiptDraft!, id: msg.id, receiptImage: msg.receiptThumbnail })}
                        className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800">
                        Thêm vào chi tiêu →
                      </button>
                    </div>
                  )}

                  {/* Trip Planning Detected Card: "Tiếp tục ở Lịch trình" */}
                  {msg.richData?.tripPreview && (
                    <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-2.5 text-left">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#FF385C]" />
                        <span className="text-xs font-bold text-rose-950">
                          Đã trích xuất thông tin chuyến đi:
                        </span>
                      </div>
                      <div className="text-xs text-stone-800 space-y-1">
                        <div><strong>Điểm đến:</strong> {msg.richData.tripPreview.destination}</div>
                        <div><strong>Thời lượng:</strong> {msg.richData.tripPreview.days} ngày ({msg.richData.tripPreview.guests} khách)</div>
                        <div><strong>Ngân sách dự kiến:</strong> {msg.richData.tripPreview.budget.toLocaleString('vi-VN')} VNĐ</div>
                        {msg.richData.tripPreview.style && (
                          <div><strong>Phong cách:</strong> {msg.richData.tripPreview.style}</div>
                        )}
                        <p className="text-stone-500">Thông tin chưa nêu dùng giá trị mặc định. Bạn có thể gửi tin nhắn để cập nhật.</p>
                      </div>
                      <button
                        onClick={() => void handleConfirmTrip(msg)}
                        disabled={runningAction !== null || isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                      >
                        <span>{runningAction === `${msg.id}:confirm_planner` ? 'Đang tạo lịch trình từ chat…'
                          : runningAction === `${msg.id}:open_planner` ? 'Đang tổng hợp…'
                          : msg.richData.tripPreviewUserId !== messages.filter(m => m.sender === 'user').at(-1)?.id
                            ? 'Cập nhật theo chat mới nhất' : 'Tiếp tục ở Lịch trình →'}</span>
                      </button>
                    </div>
                  )}

                  {/* Rich Cards (POIs & Foods) inside chat */}
                  {msg.richData?.pois && msg.richData.pois.length > 0 && (
                    <div className="space-y-2 pt-1 text-left">
                      <div className="text-[11px] font-bold text-[#717171] uppercase tracking-wider">
                        Địa điểm gợi ý:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.richData.pois.map((poi) => (
                          <div
                            key={poi.id}
                            className="bg-white p-3 rounded-2xl border border-[#E5E5E5] shadow-2xs hover:shadow-xs transition-shadow flex gap-3"
                          >
                            <img
                              src={poi.imageUrl}
                              alt={poi.name}
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-xs font-bold text-[#222222] truncate">{poi.name}</h4>
                              <div className="text-[11px] text-[#717171] truncate">{poi.address}</div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => onSelectItem({ itemType: 'poi', ...poi })}
                                  className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer"
                                >
                                  Chi tiết
                                </button>
                                <span className="text-stone-300">•</span>
                                <button
                                  onClick={() => onAddToItinerary({ itemType: 'poi', ...poi })}
                                  className="text-[11px] font-bold text-[#222222] hover:underline cursor-pointer"
                                >
                                  + Thêm vào lịch trình
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rich Foods */}
                  {msg.richData?.foods && msg.richData.foods.length > 0 && (
                    <div className="space-y-2 pt-1 text-left">
                      <div className="text-[11px] font-bold text-[#717171] uppercase tracking-wider">
                        Quán ăn đặc sản:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.richData.foods.map((food) => (
                          <div
                            key={food.id}
                            className="bg-white p-3 rounded-2xl border border-[#E5E5E5] shadow-2xs hover:shadow-xs transition-shadow flex gap-3"
                          >
                            <img
                              src={food.imageUrl}
                              alt={food.dishName}
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-xs font-bold text-[#222222] truncate">{food.dishName}</h4>
                              <div className="text-[11px] text-[#717171] truncate">{food.name} • {food.priceRange}</div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => onSelectItem({ itemType: 'food', ...food })}
                                  className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer"
                                >
                                  Xem quán
                                </button>
                                <span className="text-stone-300">•</span>
                                <button
                                  onClick={() => onAddToItinerary({ itemType: 'food', ...food })}
                                  className="text-[11px] font-bold text-[#222222] hover:underline cursor-pointer"
                                >
                                  + Thêm món
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Quick Actions */}
                  {visibleActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {visibleActions.map((act, i) => (
                        <button
                          key={i}
                          disabled={runningAction !== null || isLoading}
                          onClick={() => void handleChatAction(act.action, msg.id)}
                          className="px-3 py-1 rounded-full bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-xs font-semibold text-[#222222] cursor-pointer transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-wait"
                        >
                          {runningAction === `${msg.id}:${act.action}` ? 'Đang thực hiện…' : act.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {actionError?.messageId === msg.id && <p role="alert" className="text-xs text-rose-600">{actionError.text}</p>}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF385C] text-white flex items-center justify-center text-xs font-bold animate-pulse">
                AI
              </div>
              <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-2xl px-4 py-2.5 text-xs text-[#717171] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF385C] animate-ping"></div>
                <span>VietGo AI đang xử lý yêu cầu của bạn...</span>
              </div>
            </div>
          )}

          </div>
        </div>

        {/* 3. Fixed Bottom Chat Input Bar */}
        <div className="p-4 border-t border-[#E5E5E5] bg-white shrink-0">
          <AIImageInput disabled={isLoading || runningAction !== null} onAnalyze={handleAnalyzeImage} />
          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex-1 bg-[#F7F7F7] border border-[#E5E5E5] focus-within:border-[#222222] focus-within:bg-white rounded-2xl p-2.5 transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về điểm tham quan, ẩm thực bản địa, quy định hàng không hoặc yêu cầu lập lịch trình..."
                rows={1}
                className="w-full bg-transparent text-xs sm:text-sm text-[#222222] placeholder:text-[#717171] resize-none focus:outline-hidden max-h-28"
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-2xl cursor-pointer transition-colors disabled:opacity-40 shrink-0 shadow-sm"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="max-w-4xl mx-auto text-center pt-2 text-[10px] text-[#717171]">
            VietGo AI tư vấn dựa trên cơ sở dữ liệu bản xứ chuẩn hóa. Hãy luôn kiểm tra lại giờ mở cửa thực tế.
          </div>
        </div>
      </div>
    </div>
  );
};
