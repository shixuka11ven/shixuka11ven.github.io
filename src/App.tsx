import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthDialog } from './components/AuthDialog';

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

function ChatApp() {
  const { user, loading, signOut } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages]);

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    let targetChat = currentChat;
    if (!targetChat) {
      targetChat = await createChat();
      if (!targetChat) return;
    }
    const content = newMessage.trim();
    setNewMessage('');
    const { error } = await supabase.from('messages').insert([{
      conversation_id: targetChat.id,
      content,
      sender_id: user.id,
    }]);
    if (error) {
      console.error('Failed to send message:', error);
      setNewMessage(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  };

  if (loading) return null;

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
            </div>
          </div>
        </header>

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
                    { icon: 'image', label: 'Create image', sample: 'Create an image of a futuristic city at night with neon lights reflecting off rain-soaked streets.' },
                    { icon: 'analytics', label: 'Analyze data', sample: 'Analyze this dataset for trends: month, revenue, users — Jan: $12k, 340 | Feb: $15k, 410 | Mar: $11k, 290.' },
                    { icon: 'code', label: 'Write code', sample: 'Write a Python function that takes a list of numbers and returns the top 3 largest values.' },
                    { icon: 'history_edu', label: 'Summarize PDF', sample: 'Summarize the key points of a research paper about the effects of sleep deprivation on cognitive performance.' },
                  ].map(({ icon, label, sample }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setNewMessage(sample)}
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
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Chat input */}
              <div className="w-full shrink-0 pb-1">
                <form onSubmit={sendMessage} className="w-full">
                  <div className="glass-panel rounded-2xl md:rounded-full p-2 pl-4 md:pl-8 flex items-center gap-2 md:gap-4 focus-within:ring-2 focus-within:ring-primary/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all">
                    <button type="button" className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>attachment</span>
                    </button>
                    <textarea
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
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

export default function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}
