import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { TrendingUp, Star, Clock, Hash, Compass } from "lucide-react";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";

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

interface TagItem {
  name: string;
  count: number;
}

const BlogCard = ({ blog, onClick }: { blog: Blog; onClick: () => void }) => {
  const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 120) + "...";
  const displayName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all"
    >
      {blog.coverImage && (
        <img src={blog.coverImage} alt={blog.title} className="w-full h-36 object-cover rounded-lg mb-3" />
      )}
      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-2">{blog.title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{excerpt}</p>
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>By {displayName}</span>
        <span className="flex items-center gap-1">❤️ {blog.likes}</span>
      </div>
      {blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {blog.tags.slice(0, 3).map((tag) => (
            <span key={tag.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <section className="mb-12">
    <div className="flex items-center gap-2 mb-6">
      <div className="p-2 bg-black dark:bg-white rounded-lg text-white dark:text-black">{icon}</div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
    {children}
  </section>
);

const Explore = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Blog[]>([]);
  const [featured, setFeatured] = useState<Blog[]>([]);
  const [recent, setRecent] = useState<Blog[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tRes, fRes, rRes, tagsRes] = await Promise.all([
          fetch(`${API_URL}/api/blogs/trending`),
          fetch(`${API_URL}/api/blogs/featured`),
          fetch(`${API_URL}/api/blogs`),
          fetch(`${API_URL}/api/tags`),
        ]);
        const [tData, fData, rData, tagsData] = await Promise.all([
          tRes.json(), fRes.json(), rRes.json(), tagsRes.json(),
        ]);
        setTrending(Array.isArray(tData) ? tData : []);
        setFeatured(Array.isArray(fData) ? fData : []);
        setRecent(Array.isArray(rData) ? rData.slice(0, 6) : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>Explore — DraftDock</title>
        <meta name="description" content="Discover trending, featured, and recent blogs on DraftDock." />
      </Helmet>

      <Header2 />

      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Compass className="w-8 h-8 text-black dark:text-white" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Explore</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Discover what people are talking about</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {trending.length > 0 && (
              <Section title="Trending This Week" icon={<TrendingUp size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trending.map((b) => (
                    <BlogCard key={b.id} blog={b} onClick={() => navigate(`/blog/${b.id}`)} />
                  ))}
                </div>
              </Section>
            )}

            {featured.length > 0 && (
              <Section title="Featured" icon={<Star size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((b) => (
                    <BlogCard key={b.id} blog={b} onClick={() => navigate(`/blog/${b.id}`)} />
                  ))}
                </div>
              </Section>
            )}

            {recent.length > 0 && (
              <Section title="Recently Published" icon={<Clock size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recent.map((b) => (
                    <BlogCard key={b.id} blog={b} onClick={() => navigate(`/blog/${b.id}`)} />
                  ))}
                </div>
              </Section>
            )}

            {tags.length > 0 && (
              <Section title="Browse by Tag" icon={<Hash size={16} />}>
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <motion.button
                      key={tag.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/tags/${tag.name}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm"
                    >
                      <Hash size={12} />
                      {tag.name}
                      <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{tag.count}</span>
                    </motion.button>
                  ))}
                </div>
              </Section>
            )}

            {trending.length === 0 && featured.length === 0 && recent.length === 0 && (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                <Compass className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Nothing to explore yet. Start writing!</p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Explore;
