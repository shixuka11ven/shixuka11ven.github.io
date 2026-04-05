import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthDialog } from './components/AuthDialog';

const AI_AVATAR_URL = 'https://ejldbhfncuutqcfhdiph.supabase.co/storage/v1/object/public/wtv/smalltrans.png';

const SAMPLE_RESPONSES = [
  "That's a great question! I've analyzed your request and here's what I found. The key insight is that by breaking the problem into smaller components, we can tackle each part systematically. Would you like me to dive deeper into any specific aspect?",
  "I'd be happy to help with that! Based on my analysis, there are several approaches we could take. The most effective one involves a combination of creative thinking and structured methodology. Let me outline the steps for you.",
  "Interesting thought! Here's my perspective on this. When we look at the bigger picture, the connections between these ideas become clearer. I've put together a comprehensive overview that should help clarify things.",
  "Great prompt! Let me think through this carefully. After considering multiple angles, I believe the most promising direction involves leveraging existing patterns while introducing innovative elements. Here's my detailed breakdown.",
  "I love this kind of challenge! After running through several scenarios, I've identified the optimal approach. It balances efficiency with creativity, and I think you'll find the results quite compelling.",
];

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
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
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

  // After successful auth, send the pending message
  useEffect(() => {
    if (user && pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage('');
      setShowAuthDialog(false);
      // Small delay so UI updates first
      setTimeout(() => {
        setNewMessage(msg);
        // Auto-submit after setting
        setTimeout(() => {
          const form = document.getElementById('chat-form-main') || document.getElementById('chat-form-home');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }, 100);
      }, 200);
    }
  }, [user, pendingMessage]);

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

  const simulateAiResponse = (userContent: string) => {
    setIsAiTyping(true);
    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      const randomResponse = SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: randomResponse,
        sender_id: 'ai-arcturus',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsAiTyping(false);
    }, delay);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // If not logged in, show auth dialog
    if (!user) {
      setPendingMessage(newMessage.trim());
      setNewMessage('');
      setShowAuthDialog(true);
      return;
    }

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
    } else {
      // Simulate AI response
      simulateAiResponse(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  };

  if (loading) return null;

  const isOwnMessage = (msg: Message) => msg.sender_id === user?.id;
  const isAiMessage = (msg: Message) => msg.sender_id === 'ai-arcturus';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="bg-black min-h-screen flex selection:bg-black selection:text-white font-body text-white overflow-hidden">
      <div className="archive-grain"></div>
      {/* Background Layer */}
      <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />

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
          {user && (
            <button onClick={createChat} className="w-full flex items-center gap-3 bg-white text-black rounded-full px-4 py-3 shadow-lg transition-all hover:scale-[1.02] active:scale-95 shrink-0">
              <span className="material-symbols-outlined" data-icon="add_circle">add_circle</span>
              <span className="font-headline font-bold text-sm">New Chat</span>
            </button>
          )}
          <button onClick={() => { setCurrentChat(null); setMessages([]); }} className="w-full flex items-center gap-3 text-purple-200/70 px-4 py-3 hover:bg-white/10 rounded-full transition-all group shrink-0">
            <span className="material-symbols-outlined group-hover:text-white" data-icon="history">home</span>
            <span className="font-headline font-medium text-sm">Home</span>
          </button>

          {user && (
            <div className="pt-8 pb-4 flex-1 overflow-hidden flex flex-col">
              <p className="px-4 text-[11px] font-bold text-purple-400/50 uppercase tracking-[0.2em] mb-4 shrink-0">Recent Conversations</p>
              <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setCurrentChat(chat)}
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
          )}
        </nav>

        <div className="mt-auto space-y-4">
          <button className="w-full py-3 bg-primary text-white rounded-full font-headline font-bold text-xs tracking-wide hover:bg-purple-500 transition-all">
            Upgrade to Pro
          </button>
          <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
            <button className="flex items-center gap-3 text-purple-200/70 px-4 py-2 hover:text-white transition-all text-sm font-headline">
              <span className="material-symbols-outlined text-lg" data-icon="settings">settings</span> Settings
            </button>
            {user && (
              <button onClick={signOut} className="flex items-center gap-3 text-purple-200/70 px-4 py-2 hover:text-white transition-all text-sm font-headline">
                <span className="material-symbols-outlined text-lg" data-icon="logout">logout</span> Log out
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 ml-80 relative z-10 flex flex-col min-h-screen px-12 pb-6">
        {/* Top Navigation */}
        <header className="w-full shrink-0 flex justify-between items-center py-8">
          <div className="text-2xl font-bold tracking-tighter text-white font-headline opacity-0">Arcturus.ai</div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 items-center">
              <span className="material-symbols-outlined text-purple-200 cursor-pointer hover:text-white transition-colors" data-icon="help">help</span>
              {user ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 p-0.5">
                  <img
                    alt="User profile"
                    className="w-full h-full rounded-full object-cover"
                    src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=7c3aed`}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-purple-200 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-headline font-medium"
                >
                  <span className="material-symbols-outlined text-lg">person</span>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Area */}
        <div className="w-full flex flex-col items-center flex-1 h-full min-h-0 relative">
          {!currentChat ? (
            /* Empty State / Start Widget */
            <>
            <div className="w-full max-w-3xl text-center flex flex-col justify-center h-full -mt-20">
              <h1 className="text-6xl md:text-7xl font-headline font-extrabold text-white tracking-tight mb-12 drop-shadow-2xl">
                Where should we <br/><span className="text-primary italic">start</span>{user ? `, ${displayName}` : ''}?
              </h1>
              
              {/* Prompt Input Box for new chat */}
              <form id="chat-form-home" onSubmit={sendMessage} className="w-full group line-clamp-none">
                <div className="glass-panel rounded-full p-2 pl-8 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-primary/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none text-white placeholder-purple-300/30 text-lg focus:ring-0 font-body py-4 focus:outline-none" 
                    placeholder="Message Arcturus..." 
                    type="text" 
                  />
                  <div className="flex items-center gap-2 pr-2">
                    <button type="button" className="w-12 h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined" data-icon="attachment">attachment</span>
                    </button>
                    <button type="button" className="w-12 h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined" data-icon="construction">construction</span>
                    </button>
                    <button type="submit" disabled={!newMessage.trim()} className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-purple-100 transition-transform active:scale-95 disabled:opacity-50">
                      <span className="material-symbols-outlined font-bold" data-icon="arrow_upward">arrow_upward</span>
                    </button>
                  </div>
                </div>
              </form>
              
              {/* Action Chips */}
              <div className="flex flex-wrap justify-center gap-3 mt-10">
                <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm" data-icon="image">image</span>
                  <span className="text-xs font-bold tracking-wide font-label">Create image</span>
                </button>
                <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm" data-icon="analytics">analytics</span>
                  <span className="text-xs font-bold tracking-wide font-label">Analyze data</span>
                </button>
                <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm" data-icon="code">code</span>
                  <span className="text-xs font-bold tracking-wide font-label">Write code</span>
                </button>
                <button className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm" data-icon="history_edu">history_edu</span>
                  <span className="text-xs font-bold tracking-wide font-label">Summarize PDF</span>
                </button>
              </div>
            </div>
            <footer className="mt-auto w-full text-center py-6 opacity-40">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white">Arcturus AI can make mistakes. Verify important info.</p>
            </footer>
          </>
          ) : (
            /* Active Chat View */
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-6 relative z-10 transition-all">
              <div className="flex-1 overflow-y-auto mb-6 pr-4 space-y-8 mt-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 italic text-sm">No messages yet. Say hello!</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                      {isAiMessage(msg) && (
                        <div className="w-9 h-9 rounded-full overflow-hidden mr-3 mt-1 shrink-0 bg-primary/20 border border-primary/30 p-0.5">
                          <img src={AI_AVATAR_URL} alt="Arcturus AI" className="w-full h-full object-contain rounded-full" />
                        </div>
                      )}
                      <div className={`flex flex-col max-w-[75%] ${isOwnMessage(msg) ? 'items-end' : 'items-start'}`}>
                        {isAiMessage(msg) && (
                          <span className="text-[10px] text-primary/70 uppercase tracking-widest font-bold mb-1.5 px-2">Arcturus</span>
                        )}
                        <div className={`px-6 py-4 rounded-3xl ${
                          isOwnMessage(msg) 
                            ? 'bg-primary text-white rounded-tr-md shadow-lg shadow-primary/20' 
                            : isAiMessage(msg)
                              ? 'glass-panel rounded-tl-md border-primary/20'
                              : 'glass-panel rounded-tl-md'
                        }`}>
                          <p className="text-[15px] font-body leading-relaxed opacity-90 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-white/40 mt-2 px-2 uppercase tracking-widest font-label font-medium">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {isAiTyping && (
                  <div className="flex w-full justify-start">
                    <div className="w-9 h-9 rounded-full overflow-hidden mr-3 mt-1 shrink-0 bg-primary/20 border border-primary/30 p-0.5">
                      <img src={AI_AVATAR_URL} alt="Arcturus AI" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-primary/70 uppercase tracking-widest font-bold mb-1.5 px-2">Arcturus</span>
                      <div className="glass-panel rounded-3xl rounded-tl-md border-primary/20 px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Chat Input Area */}
              <div className="w-full shrink-0">
                <form id="chat-form-main" onSubmit={sendMessage} className="w-full group">
                  <div className="glass-panel rounded-full p-2 pl-8 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-primary/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                    <button type="button" className="w-12 h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined" data-icon="attachment">attachment</span>
                    </button>
                    <button type="button" className="w-12 h-12 flex items-center justify-center rounded-full text-purple-200 hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined" data-icon="construction">construction</span>
                    </button>
                    <textarea 
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-none text-white placeholder-purple-300/30 text-lg focus:ring-0 font-body py-4 focus:outline-none resize-none" 
                      placeholder="Message Arcturus..." 
                    />
                    <div className="flex items-center gap-2 pr-2">
                      <button type="submit" disabled={!newMessage.trim()} className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-purple-100 transition-transform active:scale-95 disabled:opacity-50">
                        <span className="material-symbols-outlined font-bold" data-icon="arrow_upward">arrow_upward</span>
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
