import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
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
          fetch(`${API_URL}/api/tags/trending`),
        ]);
        const [tData, fData, rData, tagsData] = await Promise.all([
          tRes.json(), fRes.json(), rRes.json(), tagsRes.json(),
        ]);
        setTrending(Array.isArray(tData) ? tData : []);
        setFeatured(Array.isArray(fData) ? fData : []);
        setRecent(Array.isArray(rData) ? rData.slice(0, 9) : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const featuredBlog = featured[0] || trending[0];

  return (
    <div className="min-h-screen bg-stitch-surface text-stitch-on-surface selection:bg-stitch-tertiary-container selection:text-white font-body selection:bg-tertiary-container selection:text-white">
      <Helmet>
        <title>Explore | DraftDock</title>
        <meta name="description" content="Discover trending, featured, and recent blogs on DraftDock." />
      </Helmet>

      <Header2 />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-screen-2xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-5 mb-8 lg:mb-0">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-headline text-6xl md:text-8xl font-medium tracking-tight leading-[0.9] mb-8"
              >
                Explore.<br />Discover what people are talking about.
              </motion.h1>
              <div className="space-y-6">
                <p className="font-body text-xl text-stitch-secondary max-w-md leading-relaxed">
                  A curated selection of the most thought-provoking drafts and discussions happening across the Dock today.
                </p>
              </div>
            </div>

            {featuredBlog && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(`/blog/${featuredBlog.id}`)}
                className="lg:col-span-7 relative group cursor-pointer overflow-hidden rounded-lg"
              >
                <div className="aspect-[16/10] w-full bg-stitch-surface-container-high overflow-hidden">
                  <img 
                    alt={featuredBlog.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    src={featuredBlog.coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000"} 
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12 text-white">
                  <span className="font-label text-xs uppercase tracking-widest mb-4 opacity-80">Featured Draft</span>
                  <h2 className="font-headline text-3xl md:text-5xl font-semibold mb-6 max-w-2xl leading-tight">
                    {featuredBlog.title}
                  </h2>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                         <span className="material-symbols-outlined text-sm">person</span>
                      </div>
                      <span className="font-label text-sm font-medium">
                        {featuredBlog.author?.name || featuredBlog.author?.email?.split('@')[0] || 'Anonymous'}
                      </span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-white/40"></span>
                    <span className="font-label text-sm opacity-80">
                      {Math.ceil((featuredBlog.content || "").length / 1000) || 1} min read
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Trending Topics (Horizontal Scroll) */}
        {tags.length > 0 && (
          <section className="mb-24">
            <div className="max-w-screen-2xl mx-auto px-6 mb-8 flex justify-between items-end">
              <h3 className="font-headline text-3xl font-bold tracking-tight text-stitch-on-surface">Trending Topics</h3>
              <button onClick={() => navigate('/tags')} className="font-label text-sm font-semibold border-b border-stitch-on-surface pb-1 hover:opacity-60 transition-opacity">
                View all tags
              </button>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 max-w-screen-2xl mx-auto scroll-smooth">
              {tags.map((tag, idx) => (
                <div 
                  key={tag.name}
                  onClick={() => navigate(`/tags/${tag.name}`)}
                  className="flex-none w-64 aspect-square bg-stitch-surface-container-low rounded-xl p-8 flex flex-col justify-between hover:bg-black group transition-colors duration-300 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-4xl group-hover:text-white text-stitch-on-surface" data-icon={idx % 4 === 0 ? "memory" : idx % 4 === 1 ? "palette" : idx % 4 === 2 ? "smart_toy" : "spa"}>
                    {idx % 4 === 0 ? "memory" : idx % 4 === 1 ? "palette" : idx % 4 === 2 ? "smart_toy" : "spa"}
                  </span>
                  <div>
                    <span className="font-headline text-2xl font-medium group-hover:text-white text-stitch-on-surface block">{tag.name}</span>
                    <span className="font-label text-xs text-stitch-secondary group-hover:text-white/70">{tag.count} blog{tag.count !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Community Drafts Grid */}
        <section className="max-w-screen-2xl mx-auto px-6">
          <h3 className="font-headline text-4xl font-bold tracking-tight mb-12 text-stitch-on-surface">Community Drafts</h3>
          
          {loading ? (
             <div className="flex items-center justify-center py-20">
               <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-20 gap-x-12">
              {recent.map((blog) => (
                <article 
                  key={blog.id} 
                  className="flex flex-col group cursor-pointer"
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  <div className="aspect-[4/3] bg-stitch-surface-container-high mb-6 overflow-hidden rounded-lg">
                    <img 
                      alt={blog.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      src={blog.coverImage || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800"} 
                    />
                  </div>
                  <div className="flex gap-2 mb-4">
                    {(blog.tags || []).slice(0, 2).map(t => (
                      <span key={t.id} className="font-label text-[10px] uppercase tracking-widest px-2 py-1 bg-stitch-surface-container-high rounded text-stitch-on-surface-variant font-bold">
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <h4 className="font-headline text-2xl font-bold mb-4 leading-snug group-hover:text-stitch-tertiary-container transition-colors text-stitch-on-surface">
                    {blog.title || "Untitled Draft"}
                  </h4>
                  <p className="text-stitch-secondary font-body line-clamp-3 mb-6 leading-relaxed">
                    {(blog.content || "").replace(/[#*`>\[\]]/g, "").slice(0, 150)}...
                  </p>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-stitch-outline-variant/20">
                    <span className="font-label text-sm text-stitch-secondary font-medium">
                      By {blog.author?.name || blog.author?.email?.split('@')[0] || 'Anonymous'}
                    </span>
                    <button className="font-label text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform text-stitch-on-surface">
                      Read More <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          
          {recent.length === 0 && !loading && (
            <div className="text-center py-20 text-stitch-secondary">
               <p className="text-lg">Nothing to explore yet. Start writing!</p>
            </div>
          )}

          <div className="mt-20 flex justify-center">
            <button className="px-12 py-4 bg-stitch-surface-container-high hover:bg-stitch-surface-container-highest transition-colors font-label font-bold tracking-tight rounded-md text-stitch-on-surface">
              Load more stories
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Explore;

