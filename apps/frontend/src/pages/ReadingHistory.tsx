import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { History, Trash2, Clock, Heart } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";

const API_URL = import.meta.env.VITE_API_URL;

interface HistoryBlog {
  id: string;
  title: string;
  content: string;
  likes: number;
  coverImage?: string;
  readAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const ReadingHistory = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [history, setHistory] = useState<HistoryBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/user/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setHistory(await res.json());
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const clearHistory = async () => {
    if (!window.confirm("Clear all reading history?")) return;
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/user/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const formatReadAt = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>Reading History — DraftDock</title>
      </Helmet>
      <Header2 />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reading History</h1>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No reading history yet</p>
              <p className="text-sm mt-2">Blogs you read will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((blog, i) => {
                const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 120) + "...";
                const authorName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";
                return (
                  <motion.div
                    key={blog.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/blog/${blog.id}`)}
                    className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex gap-4">
                      {blog.coverImage && (
                        <img src={blog.coverImage} alt={blog.title} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">{blog.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1.5 line-clamp-1">{excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span>{authorName}</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{formatReadAt(blog.readAt)}</span>
                          <span className="flex items-center gap-1"><Heart size={11} />{blog.likes}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ReadingHistory;
