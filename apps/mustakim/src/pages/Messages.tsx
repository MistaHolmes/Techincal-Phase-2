import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { MessageCircle, Send, ArrowLeft, Loader2 } from "lucide-react";


const API_URL = import.meta.env.VITE_API_URL;

interface Conversation {
  id: string;
  otherUser: { id: string; name?: string; email: string; profilePicture?: string };
  lastMessage?: { content: string; createdAt: string };
  lastMessageAt: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name?: string; email: string; profilePicture?: string };
}

const Messages = () => {
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (activeConv) fetchMessages(activeConv); }, [activeConv]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const authFetch = async (url: string, opts: any = {}) => {
    const token = await getToken();
    return fetch(`${API_URL}${url}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
    });
  };

  const fetchConversations = async () => {
    try {
      const res = await authFetch("/api/messaging/conversations");
      if (res.ok) setConversations(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await authFetch(`/api/messaging/conversations/${convId}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/messaging/conversations/${activeConv}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const activeConversation = conversations.find((c) => c.id === activeConv);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation List */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${activeConv ? "hidden md:block" : ""}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle size={20} /> Messages
          </h1>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">
            <MessageCircle size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Visit an author profile to start chatting</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                  activeConv === conv.id ? "bg-violet-50 dark:bg-violet-900/20" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                  {conv.otherUser.profilePicture ? (
                    <img src={conv.otherUser.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (conv.otherUser.name || conv.otherUser.email).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {conv.otherUser.name || conv.otherUser.email.split("@")[0]}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage.content}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat View */}
      <div className={`flex-1 flex flex-col ${!activeConv ? "hidden md:flex" : ""}`}>
        {activeConv && activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <button onClick={() => setActiveConv(null)} className="md:hidden text-gray-500 hover:text-gray-700">
                <ArrowLeft size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {(activeConversation.otherUser.name || activeConversation.otherUser.email).charAt(0).toUpperCase()}
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {activeConversation.otherUser.name || activeConversation.otherUser.email.split("@")[0]}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === activeConversation.otherUser.id ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                      msg.senderId === activeConversation.otherUser.id
                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "bg-violet-600 text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing chats</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
