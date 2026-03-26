import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Hash, ArrowLeft } from "lucide-react";
import { usePageCache } from "@/context/PageCacheContext";
import Header2 from "@/components/ui/header2";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  likes: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const TagBlogs = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = usePageCache();

  useEffect(() => {
    if (!tagName) return;
    const cacheKey = `tag:${tagName}`;
    const cached = cache.get(cacheKey);
    if (cached) { setBlogs(cached); setLoading(false); return; }
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/by-tag/${encodeURIComponent(tagName)}`);
        const data = await res.json();
        const blogData = Array.isArray(data) ? data : [];
        cache.set(cacheKey, blogData);
        setBlogs(blogData);
      } catch (err) {
        console.error("Failed to fetch tag blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [tagName]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>#{tagName} — DraftDock</title>
        <meta name="description" content={`Blogs tagged with #${tagName} on DraftDock.`} />
      </Helmet>
      <Header2 />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <button
          onClick={() => navigate("/explore")}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back to Explore
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-black dark:bg-white rounded-lg">
            <Hash className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">#{tagName}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{blogs.length} blog{blogs.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <Hash className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No blogs found for #{tagName}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog, i) => {
              const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 150) + "...";
              const displayName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";
              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4">
                    {blog.coverImage && (
                      <img src={blog.coverImage} alt={blog.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                        {blog.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">{excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                        <span>By {displayName} · {new Date(blog.updatedAt).toLocaleDateString()}</span>
                        <span>❤️ {blog.likes}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default TagBlogs;
