import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';

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
  if (!user) return <Login />;

  const isOwnMessage = (msg: Message) => msg.sender_id === user.id;

  return (
    <div className="bg-black min-h-screen flex selection:bg-black selection:text-white font-body text-white overflow-hidden">
      <div className="archive-grain"></div>
      {/* Background Layer */}
      <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col w-72 p-6 glass-panel rounded-r-[2.5rem] h-[95vh] my-auto ml-4 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
            <span className="material-symbols-outlined text-white text-xl">star</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-headline tracking-tighter">Arcturus AI</h2>
            <p className="text-[10px] uppercase tracking-widest text-purple-300/60 font-bold">Midnight Edition</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2 flex flex-col min-h-0">
          <button onClick={createChat} className="w-full flex items-center justify-center gap-3 bg-white text-black rounded-full px-4 py-3 shadow-lg transition-all hover:scale-[1.02] active:scale-95 shrink-0">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-headline font-bold text-sm">New Chat</span>
          </button>
          <button onClick={() => setCurrentChat(null)} className="w-full flex items-center justify-center gap-3 text-purple-200/70 px-4 py-3 hover:bg-white/10 rounded-full transition-all group shrink-0 mt-2">
            <span className="material-symbols-outlined group-hover:text-white">home</span>
            <span className="font-headline font-medium text-sm text-center">Home</span>
          </button>

          <div className="pt-8 pb-4 flex-1 overflow-hidden flex flex-col">
            <p className="px-4 text-[11px] font-bold text-purple-400/50 uppercase tracking-[0.2em] mb-4 shrink-0">Recent Conversations</p>
            <div className="space-y-1 overflow-y-auto flex-1 pr-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setCurrentChat(chat)}
                  className={`w-full text-left block px-4 py-2.5 text-sm transition-colors truncate rounded-xl ${
                    currentChat?.id === chat.id 
                      ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(209,188,255,0.1)]' 
                      : 'text-purple-200/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-auto space-y-4 pt-4">
          <button className="w-full py-3 bg-primary text-white rounded-full font-headline font-bold text-xs tracking-wide hover:bg-purple-500 transition-all">
            Upgrade to Pro
          </button>
          <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
            <button className="flex items-center gap-3 text-purple-200/70 px-4 py-2 hover:text-white transition-all text-sm font-headline">
              <span className="material-symbols-outlined text-lg">settings</span> Settings
            </button>
            <button onClick={signOut} className="flex items-center gap-3 text-purple-200/70 px-4 py-2 hover:text-white transition-all text-sm font-headline">
              <span className="material-symbols-outlined text-lg">logout</span> Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 ml-[20rem] relative z-10 flex flex-col min-h-screen px-12 h-screen">
        {/* Top Navigation */}
        <header className="w-full flex justify-between items-center py-8 shrink-0">
          <div className="text-2xl font-bold tracking-tighter text-white font-headline opacity-0">
            {/* Hidden to preserve space if needed */}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 items-center">
              <span className="material-symbols-outlined text-purple-200 cursor-pointer hover:text-white transition-colors">help</span>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 p-0.5">
                <img alt="User profile" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAjQgV9P8KYnYak4rIh2HCOzY9LtTLjaAmqxkbnJXO5EpRB0G1RwPEZMVDZRBtcHdFsBsOWM1_vnINcJGFNSX6XHT5tFdaDl9OgkYIbfoOJq4aJhQaDiQyoP-5me6ExcyDjUIgqJpget5AuSCXHE2hUnacTHlWKNDASubDflod112cJGdhplTxQQhj2zwxB9iDJhDtqXMifUjJJBtq66tuTaBPqTjfON9nZy-VwsoN4MqHTQXkGZVmCxEKqtX6XLWEPUcBQsBUzbQ" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Area */}
        <div className="w-full flex-1 flex flex-col min-h-0 relative">
          {!currentChat ? (
            /* Empty State / Start Widget */
            <div className="w-full h-full flex flex-col items-center justify-center -mt-20">
              <div className="w-full max-w-3xl text-center mb-12">
                <h1 className="text-6xl md:text-7xl font-headline font-extrabold text-white tracking-tight mb-12 drop-shadow-2xl">
                  Where should we <br/><span className="text-primary italic">start</span>, {user.email?.split('@')[0]}?
                </h1>
                
                {/* Prompt Input Box for new chat */}
                <form onSubmit={sendMessage} className="w-full group">
                  <div className="glass-panel rounded-full p-2 pl-8 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-primary/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder-purple-300/30 text-lg focus:ring-0 font-body py-4 focus:outline-none" 
                      placeholder="Message Arcturus..." 
                      type="text" 
                    />
                    <div className="flex items-center gap-2 pr-2">
                      <button type="button" className="w-12 h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">attachment</span>
                      </button>
                      <button type="button" className="w-12 h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">construction</span>
                      </button>
                      <button type="submit" className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-purple-100 transition-transform active:scale-95 disabled:opacity-50">
                        <span className="material-symbols-outlined font-bold">arrow_upward</span>
                      </button>
                    </div>
                  </div>
                </form>
                
                {/* Action Chips */}
                <div className="flex flex-wrap justify-center gap-3 mt-10">
                  <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">image</span>
                    <span className="text-xs font-bold tracking-wide font-label">Create image</span>
                  </button>
                  <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">analytics</span>
                    <span className="text-xs font-bold tracking-wide font-label">Analyze data</span>
                  </button>
                  <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">code</span>
                    <span className="text-xs font-bold tracking-wide font-label">Write code</span>
                  </button>
                  <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
                    <span className="text-xs font-bold tracking-wide font-label">Summarize PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Chat View */
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-6 relative z-10 transition-all">
              <div className="flex-1 overflow-y-auto mb-6 pr-4 space-y-8 mt-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 italic text-sm">No messages yet. Say hello!</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col max-w-[75%] ${isOwnMessage(msg) ? 'items-end' : 'items-start'}`}>
                        <div className={`px-6 py-4 rounded-3xl ${
                          isOwnMessage(msg) 
                            ? 'bg-gradient-to-br from-primary-container to-[rgba(14,14,14,0.8)] text-white shadow-[0_4px_30px_rgba(76,29,149,0.3)] backdrop-blur-md border border-[rgba(209,188,255,0.1)] rounded-tr-sm' 
                            : 'glass-panel rounded-tl-sm'
                        }`}>
                          <p className="text-[15px] font-body leading-relaxed tracking-wide opacity-90 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-[10px] opacity-40 mt-2 px-2 uppercase tracking-widest font-label">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Chat Input Area */}
              <div className="w-full shrink-0">
                <form onSubmit={sendMessage} className="w-full group">
                  <div className="glass-panel rounded-full p-2 pl-6 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-primary/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                    <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined">add</span>
                    </button>
                    <textarea 
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-none text-white placeholder-purple-300/30 text-base focus:ring-0 font-body py-3 focus:outline-none resize-none" 
                      placeholder="Message Arcturus..." 
                    />
                    <div className="flex items-center gap-1 pr-1">
                      <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-purple-100 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                        <span className="material-symbols-outlined font-bold">arrow_upward</span>
                      </button>
                    </div>
                  </div>
                </form>
                <div className="text-center mt-3">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white opacity-40 font-label">Arcturus AI can make mistakes. Verify important info.</span>
                </div>
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
