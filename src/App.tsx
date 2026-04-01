import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { MessageSquare, Send, Plus, LogOut, ChevronRight } from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (currentChat) {
      fetchMessages(currentChat.id);
      
      const channel = supabase
        .channel(`chat:${currentChat.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentChat.id}`
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setChats(data);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', chatId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const createChat = async () => {
    const { data } = await supabase
      .from('conversations')
      .insert([{ user_id: user?.id, title: 'New Chat' }])
      .select()
      .single();

    if (data) {
      setChats([data, ...chats]);
      setCurrentChat(data);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert([{
      conversation_id: currentChat.id,
      content,
      sender_id: user.id
    }]);

    if (error) {
      console.error(error);
      setNewMessage(content);
    }
  };

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-muted border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border flex items-center justify-between overflow-hidden">
          <h2 className="text-[10px] uppercase tracking-[0.3em] font-light opacity-50 whitespace-nowrap">Chats</h2>
          <button onClick={createChat} className="p-1 hover:bg-accent rounded-sm transition-colors shrink-0">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChat(chat)}
              className={`w-full p-4 text-left text-xs border-b border-border/50 hover:bg-accent transition-colors ${currentChat?.id === chat.id ? 'bg-accent' : ''}`}
            >
              <p className="truncate opacity-80 font-light tracking-wide">{chat.title}</p>
              <p className="text-[9px] opacity-20 mt-1 uppercase tracking-tighter">{new Date(chat.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </div>
        <button onClick={() => signOut()} className="p-4 border-t border-border text-[10px] uppercase tracking-[0.3em] opacity-30 hover:opacity-100 flex items-center gap-2 transition-all whitespace-nowrap">
          <LogOut size={12} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-border flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="opacity-30 hover:opacity-100 transition-opacity">
              <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-[10px] uppercase tracking-[0.4em] font-light opacity-60">
              {currentChat?.title || 'System'}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${msg.sender_id === user.id ? 'text-right' : 'text-left'}`}>
                <p className="text-sm font-light leading-relaxed tracking-wide opacity-90">{msg.content}</p>
                <p className="text-[9px] opacity-10 mt-3 uppercase tracking-widest">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {!currentChat && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
              <MessageSquare size={40} strokeWidth={1} />
              <p className="text-[10px] uppercase tracking-[0.5em]">Select a thread to continue</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        {currentChat && (
          <form onSubmit={sendMessage} className="p-8">
            <div className="flex gap-6 items-end max-w-3xl mx-auto border-b border-border/50 pb-2 focus-within:border-white transition-colors">
              <textarea
                rows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-light resize-none py-1 placeholder:opacity-10"
              />
              <button type="submit" className="opacity-20 hover:opacity-100 transition-opacity pb-1">
                <Send size={18} strokeWidth={1.5} />
              </button>
            </div>
          </form>
        )}

        {/* Floating Chat Button */}
        {!currentChat && (
          <button
            onClick={createChat}
            className="fixed bottom-10 right-10 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}

export default App;
