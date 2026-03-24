import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FileDiff, Trash2, Send, Pencil } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const stripHtml = (html: string) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const Drafts = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchDrafts = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/user/blogs/drafts`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setDrafts(res.data.blogs || []);
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrafts(); }, []);

  const handlePublish = async (id: string) => {
    if (!confirm("Publish this draft?")) return;
    setActionId(id);
    try {
      const token = await getToken();
      await axios.patch(`${API_URL}/api/blogs/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setDrafts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to publish.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft permanently?")) return;
    setActionId(id);
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setDrafts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>My Drafts — DraftDock</title>
      </Helmet>
      <Header2 />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <FileDiff className="w-7 h-7 text-gray-700 dark:text-gray-200" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Drafts</h1>
          <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">{drafts.length} draft{drafts.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <FileDiff className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-4">No drafts yet.</p>
            <button
              onClick={() => navigate("/create-blog")}
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-80 transition"
            >
              Start Writing
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-800 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">Draft</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Last edited {new Date(draft.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{draft.title || "Untitled"}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {stripHtml(draft.content).slice(0, 150)}...
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/edit-blog/${draft.id}`)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      title="Edit"
                      disabled={actionId === draft.id}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handlePublish(draft.id)}
                      className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition"
                      title="Publish"
                      disabled={actionId === draft.id}
                    >
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                      title="Delete"
                      disabled={actionId === draft.id}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Drafts;
