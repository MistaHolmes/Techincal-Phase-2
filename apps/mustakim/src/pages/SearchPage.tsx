import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Search, Clock, X, Tag } from "lucide-react";
import { Footer } from "@/components/Footer";
import { usePageCache } from "@/context/PageCacheContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  updatedAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const cache = usePageCache();

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    const cacheKey = `search:${q.trim().toLowerCase()}`;
    const cached = cache.get(cacheKey, 120000);
    if (cached) {
      setResults(cached);
      setSearched(true);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/blogs/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        cache.set(cacheKey, data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search on initial load if query param exists
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); performSearch(q); }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
    performSearch(query);
  };

  return (
    <>
      <Helmet>
        <title>Search — DraftDock</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white mb-2">Search Blogs</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Find articles by title, content, or topic</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for blogs..."
              autoFocus
              className="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition shadow-sm"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setResults([]); setSearched(false); setSearchParams({}); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                <X size={18} />
              </button>
            )}
          </form>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searched && results.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or check spelling</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searched && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
              )}
              {results.map((blog, i) => {
                const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 160) + "...";
                const wordCount = blog.content.split(/\s+/).filter(Boolean).length;
                const readingTime = Math.max(1, Math.ceil(wordCount / 200));
                const authorName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";
                return (
                  <motion.div
                    key={blog.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/blog/${blog.id}`)}
                    className="cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex gap-4">
                      {blog.coverImage && (
                        <img src={blog.coverImage} alt={blog.title} className="w-20 h-16 object-cover rounded-xl flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-headline font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition truncate">{blog.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">{excerpt}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span>{authorName}</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{readingTime} min</span>
                          {blog.tags?.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="flex items-center gap-0.5 px-2 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                              <Tag size={9} />{tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
      <div className="mt-12 px-4">
        <Footer />
      </div>
    </>
  );
};

export default SearchPage;

