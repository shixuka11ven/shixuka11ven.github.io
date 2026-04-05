import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthDialog } from './components/AuthDialog';
import { AnimatedAIChat } from './components/ui/animated-ai-chat';
import { PanelLeftClose, PanelLeft, SquarePen, Settings, LogOut, MessageSquare } from 'lucide-react';
import { cn } from './lib/utils';
import { motion } from 'framer-motion';

/* ============================================================
   CONSTANTS
   ============================================================ */

<<<<<<< HEAD
const AI_AVATAR_URL = 'https://ejldbhfncuutqcfhdiph.supabase.co/storage/v1/object/public/wtv/smalltrans.png';

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 64;

const SIDEBAR_TRANSITION = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const, // Material ease-in-out
};

const SAMPLE_RESPONSES = [
  "That's a great question! I've analyzed your request and here's what I found.",
  "I'd be happy to help with that! Based on my analysis, there are several approaches.",
  "Interesting thought! Here's my perspective on this.",
  "Great prompt! Let me think through this carefully.",
  "I love this kind of challenge! Running through scenarios now...",
];

/* ============================================================
   TYPES
   ============================================================ */

=======
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

/* ============================================================
   SIDEBAR ITEM
   A single clickable row in the sidebar. Uses CSS classes from
   index.css for the smooth collapsed/expanded transition.
   ============================================================ */

function SidebarItem({
  icon,
  label,
  onClick,
  active = false,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      className={cn(
        "sidebar-item w-full text-sm",
        active
          ? "bg-white/10 text-white font-medium"
          : "text-on-surface-muted hover:text-white"
      )}
    >
      <span className="sidebar-icon-container">{icon}</span>
      <span className="sidebar-item-label text-left truncate">{label}</span>
    </button>
  );
}

/* ============================================================
   MAIN CHAT APP
   ============================================================ */

function ChatApp() {
  const { user, loading, signOut } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
<<<<<<< HEAD
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
=======
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ── Data Fetching ─────────────────────────────────────── */

  const fetchChats = useCallback(async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Failed to fetch chats:', error);
    if (data) setChats(data);
  }, []);

  const fetchMessages = useCallback(async (chatId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', chatId)
      .order('created_at', { ascending: true });
    if (error) console.error('Failed to fetch messages:', error);
    if (data) setMessages(data);
  }, []);

  /* ── Effects ───────────────────────────────────────────── */

  useEffect(() => {
    if (user) fetchChats();
  }, [user, fetchChats]);

  useEffect(() => {
    if (!currentChat) return;
    fetchMessages(currentChat.id);
    const channel = supabase
      .channel(`chat:${currentChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${currentChat.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentChat, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

<<<<<<< HEAD
  // After auth, auto-send the message that was pending
  useEffect(() => {
    if (user && pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage('');
      setShowAuthDialog(false);
      setTimeout(() => performSendMessage(msg), 300);
    }
  }, [user, pendingMessage]);

  /* ── Actions ───────────────────────────────────────────── */

=======
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
  const createChat = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: user?.id, title: 'New Conversation' }])
      .select()
      .single();
    if (error) return console.error('Failed to create chat:', error);
    if (data) {
      setChats((prev) => [data, ...prev]);
      setCurrentChat(data);
      setSidebarOpen(false);
      return data;
    }
  };

<<<<<<< HEAD
  const simulateAiResponse = (userContent: string) => {
    setIsAiTyping(true);
    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      const response = SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response + " " + userContent.slice(0, 20) + "...",
        sender_id: 'ai-arcturus',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsAiTyping(false);
    }, delay);
  };

  const performSendMessage = async (content: string) => {
    if (!user) {
      setPendingMessage(content);
      setShowAuthDialog(true);
      return;
    }

=======
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
    let targetChat = currentChat;
    if (!targetChat) {
      targetChat = await createChat();
      if (!targetChat) return;
    }
<<<<<<< HEAD

=======
    const content = newMessage.trim();
    setNewMessage('');
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
    const { error } = await supabase.from('messages').insert([{
      conversation_id: targetChat.id,
      content,
      sender_id: user.id,
    }]);
    if (error) {
      console.error('Failed to send message:', error);
<<<<<<< HEAD
    } else {
      simulateAiResponse(content);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    performSendMessage(newMessage.trim());
    setNewMessage('');
  };

=======
      setNewMessage(content);
    }
  };

>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        performSendMessage(newMessage.trim());
        setNewMessage('');
      }
    }
  };

  /* ── Derived State ─────────────────────────────────────── */

  if (loading) return null;

<<<<<<< HEAD
  const isOwnMessage = (msg: Message) => msg.sender_id === user?.id;
  const isAiMessage = (msg: Message) => msg.sender_id === 'ai-arcturus';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || null;

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="bg-surface min-h-screen flex text-white overflow-hidden relative selection:bg-primary/30 selection:text-white">
      {/* Subtle radial gradient background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(98,0,70,0.08),transparent)]" />

      {/* Auth modal */}
      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />

      {/* ─── SIDEBAR ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
        transition={SIDEBAR_TRANSITION}
        className={cn(
          "h-screen bg-surface-raised/80 backdrop-blur-xl border-r border-border-default",
          "flex flex-col shrink-0 relative z-40 overflow-hidden",
          !isSidebarOpen && "sidebar-collapsed"
        )}
      >
        {/* Logo + toggle row */}
        <div className="flex items-center h-14 px-[18px] mt-2 shrink-0 overflow-hidden">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-on-surface-faint hover:text-white transition-colors shrink-0 sidebar-icon-container"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <PanelLeft size={18} />
          </button>
          
          <div className="sidebar-item-label flex items-center gap-2.5 ml-3">
            <img 
              src="/logo.png" 
              alt="Arcturus Logo" 
              className="w-7 h-7 object-contain shrink-0 drop-shadow-[0_0_8px_rgba(155,50,150,0.5)]" 
            />
            <span className="font-semibold tracking-tight text-[15px] font-space">
              Arcturus
            </span>
          </div>
        </div>

        {/* New Chat button */}
        <div className="px-2 mt-3 shrink-0">
          <button
            onClick={() => { setCurrentChat(null); setMessages([]); }}
            title="New Chat"
            className={cn(
              "sidebar-item w-full",
              "bg-white/[0.04] border border-border-subtle text-white hover:bg-white/[0.08]"
            )}
          >
            <span className="sidebar-icon-container">
              <SquarePen size={18} className="text-on-surface-muted" />
            </span>
            <span className="sidebar-item-label text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto mt-5 px-2 min-h-0">
          <div className="sidebar-text-fade text-xs font-semibold text-on-surface-faint uppercase tracking-wider mb-2 px-3">
            History
          </div>
          {user ? (
            <div className="space-y-0.5">
              {chats.map((chat) => (
                <SidebarItem
                  key={chat.id}
                  icon={<MessageSquare size={14} className="opacity-50" />}
                  label={chat.title}
                  onClick={() => setCurrentChat(chat)}
                  active={currentChat?.id === chat.id}
                />
              ))}
              {chats.length === 0 && (
                <div className="sidebar-text-fade text-sm text-on-surface-ghost px-3 italic">
                  No earlier chats
                </div>
              )}
=======
  // Unauthenticated — show landing + auth dialog
  if (!user) return (
    <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden font-body text-white relative">
      <div className="archive-grain pointer-events-none"></div>
      <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>
      <div className="w-full max-w-sm space-y-6 glass-panel p-8 rounded-3xl relative z-10 mx-4 text-center">
        <div className="w-10 h-10 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
          <span className="material-symbols-outlined text-white text-xl">star</span>
        </div>
        <h1 className="text-2xl font-black text-white font-headline tracking-tight">Arcturus AI</h1>
        <p className="text-[11px] uppercase tracking-widest text-purple-300/60 font-bold">Midnight Edition</p>
        <button
          onClick={() => setAuthOpen(true)}
          className="w-full bg-primary py-3 rounded-full font-headline font-semibold text-sm tracking-wide text-white hover:bg-primary/90 transition-all mt-4"
        >
          Get Started
        </button>
      </div>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );

  const isOwnMessage = (msg: Message) => msg.sender_id === user.id;

  // Shared sidebar content used in both desktop aside and mobile drawer
  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] shrink-0">
          <span className="material-symbols-outlined text-white text-xl">star</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-white font-headline tracking-tighter">Arcturus AI</h2>
          <p className="text-[10px] uppercase tracking-widest text-purple-300/60 font-bold">Midnight Edition</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 flex flex-col min-h-0">
        <button
          onClick={() => { createChat(); }}
          className="w-full flex items-center gap-3 bg-white text-black rounded-full px-4 py-3 shadow-lg transition-all hover:scale-[1.02] active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-headline font-bold text-sm">New Chat</span>
        </button>
        <button
          onClick={() => { setCurrentChat(null); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 text-purple-200/70 px-4 py-3 hover:bg-white/10 rounded-full transition-all group shrink-0"
        >
          <span className="material-symbols-outlined group-hover:text-white">home</span>
          <span className="font-headline font-medium text-sm">Home</span>
        </button>

        <div className="pt-6 pb-4 flex-1 overflow-hidden flex flex-col">
          <p className="px-4 text-[11px] font-bold text-purple-400/50 uppercase tracking-[0.2em] mb-4 shrink-0">
            Recent Conversations
          </p>
          <div className="space-y-1 overflow-y-auto flex-1 pr-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => { setCurrentChat(chat); setSidebarOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 text-sm transition-colors truncate rounded-lg ${
                  currentChat?.id === chat.id
                    ? 'bg-white/10 text-white rounded-full'
                    : 'text-purple-200/60 hover:text-white'
                }`}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-auto space-y-3 pt-4">
        <button className="w-full py-3 bg-primary text-white rounded-full font-headline font-bold text-xs tracking-wide hover:bg-purple-500 transition-all">
          Upgrade to Pro
        </button>
        <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
          <button className="flex items-center gap-3 text-purple-200/70 px-4 py-2 hover:text-white transition-all text-sm font-headline">
            <span className="material-symbols-outlined text-lg">settings</span> Settings
          </button>
          <button onClick={signOut} className="flex items-center gap-3 text-purple-200/70 px-4 py-2 hover:text-white transition-all text-sm font-headline">
            <span className="material-symbols-outlined text-lg">logout</span> Log out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-black min-h-screen flex selection:bg-black selection:text-white font-body text-white overflow-hidden">
      <div className="archive-grain"></div>
      <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

      {/* ── DESKTOP SIDEBAR (md+) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col w-72 p-6 glass-panel rounded-r-[2.5rem] h-[95vh] my-auto ml-4 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.7)]">
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-full z-50 flex flex-col w-[80vw] max-w-xs p-6 glass-panel rounded-r-[2rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-80 relative z-10 flex flex-col h-screen md:px-12 px-4 pb-4 md:pb-6">

        {/* TOP HEADER */}
        <header className="w-full shrink-0 flex justify-between items-center py-4 md:py-8">
          {/* Mobile: hamburger + mini logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>star</span>
              </div>
              <span className="font-headline font-black text-white text-base tracking-tight">Arcturus AI</span>
            </div>
          </div>
          {/* Desktop spacer */}
          <div className="hidden md:block opacity-0 text-2xl font-bold">Arcturus.ai</div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-purple-200 cursor-pointer hover:text-white transition-colors">help</span>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-primary/40 p-0.5 shrink-0">
              <img
                alt="User profile"
                className="w-full h-full rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAjQgV9P8KYnYak4rIh2HCOzY9LtTLjaAmqxkbnJXO5EpRB0G1RwPEZMVDZRBtcHdFsBsOWM1_vnINcJGFNSX6XHT5tFdaDl9OgkYIbfoOJq4aJhQaDiQyoP-5me6ExcyDjUIgqJpget5AuSCXHE2hUnacTHlWKNDASubDflod112cJGdhplTxQQhj2zwxB9iDJhDtqXMifUjJJBtq66tuTaBPqTjfON9nZy-VwsoN4MqHTQXkGZVmCxEKqtX6XLWEPUcBQsBUzbQ"
              />
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
            </div>
          ) : (
            <div className="sidebar-text-fade text-xs text-on-surface-ghost px-3">
              Sign in to sync history
            </div>
          )}
        </div>

        {/* Bottom actions */}
        {user && (
          <div className="mt-auto border-t border-border-default px-2 py-2 space-y-0.5 shrink-0">
            <SidebarItem
              icon={<Settings size={18} />}
              label="Account"
              onClick={() => {}}
            />
            <SidebarItem
              icon={<LogOut size={18} />}
              label="Log out"
              onClick={signOut}
            />
          </div>
        )}
      </motion.aside>

      {/* ─── MAIN CONTENT ────────────────────────────────── */}
      <main className="flex-1 relative z-10 flex flex-col min-w-0 h-screen">
        {/* Top-right header: profile or sign-in */}
        <header className="absolute top-0 right-0 p-4 z-20 flex items-center gap-2">
          {user ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary-border/40">
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=620046`}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAuthDialog(true)}
              className="flex justify-center items-center h-[26px] px-[10px] py-[4px] text-[12px] leading-[16px] rounded-[6px] border border-primary-border bg-primary text-[#fafafa] font-space font-medium transition-all duration-200 ease-out cursor-pointer outline-none hover:bg-primary-hover hover:border-primary-border-hover"
            >
              Sign In
            </button>
          )}
        </header>

<<<<<<< HEAD
        {/* Dynamic content area */}
        <div className="flex-1 overflow-hidden flex flex-col w-full h-full">
          {!currentChat ? (
            /* ── Home / Empty State ─────────────────────────── */
            <AnimatedAIChat
              onSendMessage={performSendMessage}
              isExternalTyping={isAiTyping}
              userName={displayName}
            />
          ) : (
            /* ── Active Chat ────────────────────────────────── */
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-6 relative z-10">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 px-6 space-y-6 mt-16">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-on-surface-faint text-sm">
                    Say hello!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={cn("flex w-full", isOwnMessage(msg) ? 'justify-end' : 'justify-start')}>
                      {isAiMessage(msg) && (
                        <div className="w-8 h-8 rounded-lg mr-3 mt-1 shrink-0 bg-white/5 border border-border-subtle flex items-center justify-center overflow-hidden">
                          <img src={AI_AVATAR_URL} alt="AI" className="w-6 h-6 object-contain" />
                        </div>
                      )}
                      <div className={cn("flex flex-col max-w-[80%]", isOwnMessage(msg) ? 'items-end' : 'items-start')}>
                        <div className={cn(
                          "px-5 py-3.5 text-[15px] leading-relaxed",
                          isOwnMessage(msg)
                            ? "bg-white text-black rounded-2xl rounded-tr-sm font-medium"
                            : "bg-surface-card border border-border-subtle text-white/90 rounded-2xl rounded-tl-sm"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
=======
        {/* DYNAMIC AREA */}
        <div className="flex-1 flex flex-col items-center min-h-0 w-full overflow-hidden">
          {!currentChat ? (
            /* ── HOME STATE ── */
            <div className="w-full flex flex-col h-full">
              {/* Scrollable welcome area */}
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 overflow-y-auto min-h-0 py-4">
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-headline font-extrabold text-white tracking-tight mb-6 md:mb-12 drop-shadow-2xl leading-tight">
                  Where should we <br />
                  <span className="text-primary italic">start</span>,&nbsp;{user.email?.split('@')[0]}?
                </h1>
                {/* Action chips */}
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                  {[
                    { icon: 'image', label: 'Create image' },
                    { icon: 'analytics', label: 'Analyze data' },
                    { icon: 'code', label: 'Write code' },
                    { icon: 'history_edu', label: 'Summarize PDF' },
                  ].map(({ icon, label }) => (
                    <button
                      key={label}
                      className="px-4 py-2.5 md:px-6 md:py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                      <span className="text-xs font-bold tracking-wide font-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat input — always at bottom */}
              <div className="w-full shrink-0 pb-1">
                <form onSubmit={sendMessage} className="w-full max-w-3xl mx-auto">
                  <div className="glass-panel rounded-2xl md:rounded-full p-2 pl-4 md:pl-8 flex items-center gap-2 md:gap-4 focus-within:ring-2 focus-within:ring-primary/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder-purple-300/30 text-base md:text-lg focus:ring-0 font-body py-3 md:py-4 focus:outline-none"
                      placeholder="Message Arcturus..."
                      type="text"
                    />
                    <div className="flex items-center gap-1 md:gap-2 pr-1 md:pr-2 shrink-0">
                      <button type="button" className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>attachment</span>
                      </button>
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-purple-100 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined font-bold" style={{ fontSize: '18px' }}>arrow_upward</span>
                      </button>
                    </div>
                  </div>
                </form>
                <p className="text-center text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 mt-2">
                  Arcturus AI can make mistakes. Verify important info.
                </p>
              </div>
            </div>
          ) : (
            /* ── ACTIVE CHAT VIEW ── */
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 md:space-y-8 mt-2 mb-4 pr-1 md:pr-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 italic text-sm">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col max-w-[88%] md:max-w-[75%] ${isOwnMessage(msg) ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-3 md:px-6 md:py-4 rounded-3xl ${
                          isOwnMessage(msg)
                            ? 'bg-primary text-white rounded-tr-md shadow-lg shadow-primary/20'
                            : 'glass-panel rounded-tl-md'
                        }`}>
                          <p className="text-sm md:text-[15px] font-body leading-relaxed opacity-90 whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                        <span className="text-[10px] text-white/40 mt-1.5 px-2 uppercase tracking-widest font-label font-medium">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
                      </div>
                    </div>
                  ))
                )}
<<<<<<< HEAD

                {/* Typing indicator */}
                {isAiTyping && (
                  <div className="flex w-full justify-start">
                    <div className="w-8 h-8 rounded-lg mr-3 mt-1 shrink-0 bg-white/5 border border-border-subtle flex items-center justify-center overflow-hidden">
                      <img src={AI_AVATAR_URL} alt="AI" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="bg-surface-card border border-border-subtle rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                      {[0, 0.2, 0.4].map((delay) => (
                        <motion.div
                          key={delay}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay, ease: "easeInOut" }}
                          className="w-1.5 h-1.5 bg-white/60 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Chat input */}
              <div className="px-6 shrink-0">
                <form onSubmit={handleSubmit}>
                  <div className="bg-surface-card border border-border-subtle rounded-2xl p-2 flex items-center gap-2 shadow-lg">
=======
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Chat input */}
              <div className="w-full shrink-0 pb-1">
                <form onSubmit={sendMessage} className="w-full">
                  <div className="glass-panel rounded-2xl md:rounded-full p-2 pl-4 md:pl-8 flex items-center gap-2 md:gap-4 focus-within:ring-2 focus-within:ring-primary/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all">
                    <button type="button" className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>attachment</span>
                    </button>
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
                    <textarea
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
<<<<<<< HEAD
                      className="flex-1 bg-transparent text-white placeholder-on-surface-faint text-[15px] py-3 px-3 resize-none min-h-[44px] border-none focus:ring-0 focus:outline-none"
                      placeholder="Reply to Arcturus..."
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isAiTyping}
                      className={cn(
                        "flex items-center justify-center shrink-0 w-[30px] h-[30px] rounded-[6px] border transition-all duration-200 ease-out outline-none",
                        (!newMessage.trim() || isAiTyping)
                          ? "bg-transparent border-transparent text-on-surface-ghost opacity-50 cursor-not-allowed"
                          : "bg-primary border-primary-border text-[#fafafa] hover:bg-primary-hover hover:border-primary-border-hover cursor-pointer shadow-md"
                      )}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L8 3.70711L8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5L7 3.70711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                      </svg>
                    </button>
=======
                      className="flex-1 bg-transparent border-none text-white placeholder-purple-300/30 text-base md:text-lg focus:ring-0 font-body py-3 md:py-4 focus:outline-none resize-none"
                      placeholder="Message Arcturus..."
                    />
                    <div className="flex items-center gap-1 md:gap-2 pr-1 md:pr-2 shrink-0">
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-purple-100 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined font-bold" style={{ fontSize: '18px' }}>arrow_upward</span>
                      </button>
                    </div>
>>>>>>> 84992513964188bf90c49646b03b179393b4ca30
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */

export default function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}
