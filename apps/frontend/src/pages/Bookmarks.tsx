import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Bookmark, BookmarkX } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  likes: number;
  coverImage?: string;
  updatedAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const Bookmarks = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/user/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setBlogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const handleRemove = async (blogId: string) => {
    setRemoving(blogId);
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/api/user/bookmarks/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
    } catch (err) {
      alert("Failed to remove bookmark.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>Bookmarks — DraftDock</title>
      </Helmet>
      <Header2 />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-7 h-7 text-gray-700 dark:text-gray-200" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookmarks</h1>
          <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">{blogs.length} saved</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No saved blogs yet.</p>
            <p className="text-sm mb-6">Start bookmarking blogs you want to read later.</p>
            <button
              onClick={() => navigate("/blogs")}
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-80 transition"
            >
              Browse Blogs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog, i) => {
              const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 140) + "...";
              const displayName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";
              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm group"
                >
                  <div className="flex gap-4">
                    {blog.coverImage && (
                      <img src={blog.coverImage} alt={blog.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        onClick={() => navigate(`/blog/${blog.id}`)}
                        className="font-semibold text-gray-900 dark:text-white text-lg mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition line-clamp-1"
                      >
                        {blog.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">{excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          By {displayName} · {new Date(blog.updatedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleRemove(blog.id)}
                          disabled={removing === blog.id}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition opacity-0 group-hover:opacity-100"
                        >
                          <BookmarkX size={14} />
                          {removing === blog.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Bookmarks;
