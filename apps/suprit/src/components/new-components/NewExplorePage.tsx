import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Helmet } from "react-helmet-async";
import { Compass, Heart, Bookmark } from "lucide-react";
import { usePageCache, PAGE_TTL } from "@/context/PageCacheContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  summary?: string;
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

const NewExplorePage = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Blog[]>([]);
  const [featured, setFeatured] = useState<Blog[]>([]);
  const [recent, setRecent] = useState<Blog[]>([]);
  const [personalized, setPersonalized] = useState<Blog[]>([]);
  const [, setRecommendedAuthors] = useState<any[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "foryou">("trending");
  const { getToken, isSignedIn } = useAuth();
  const cache = usePageCache();

  useEffect(() => {
    const cacheKey = `explore:${isSignedIn}`;
    const cached = cache.get(cacheKey, PAGE_TTL.explore);
    if (cached) {
      setTrending(cached.trending);
      setFeatured(cached.featured);
      setRecent(cached.recent);
      setTags(cached.tags);
      if (cached.personalized) setPersonalized(cached.personalized);
      if (cached.recommendedAuthors) setRecommendedAuthors(cached.recommendedAuthors);
      if (isSignedIn) setActiveTab("foryou");
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      try {
        const [tRes, fRes, rRes, tagsRes] = await Promise.all([
          fetch(`${API_URL}/api/blogs/trending`),
          fetch(`${API_URL}/api/blogs/featured`),
          fetch(`${API_URL}/api/blogs`),
          fetch(`${API_URL}/api/tags/trending`),
        ]);
        const [tData, fData, rData, tagsData] = await Promise.all([
          tRes.json(),
          fRes.json(),
          rRes.json(),
          tagsRes.json(),
        ]);
        setTrending(Array.isArray(tData) ? tData : []);
        setFeatured(Array.isArray(fData) ? fData : []);
        setRecent(Array.isArray(rData) ? rData.slice(0, 9) : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);

        let pData: any[] = [];
        let aData: any[] = [];
        if (isSignedIn) {
          const token = await getToken();
          const [pRes, aRes] = await Promise.all([
            fetch(`${API_URL}/api/discovery/personalized-feed`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/api/discovery/recommended-authors`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          if (pRes.ok) {
            pData = await pRes.json();
            setPersonalized(pData);
          }
          if (aRes.ok) {
            aData = await aRes.json();
            setRecommendedAuthors(aData);
          }
          setActiveTab("foryou");
        }
        cache.set(cacheKey, {
          trending: Array.isArray(tData) ? tData : [],
          featured: Array.isArray(fData) ? fData : [],
          recent: Array.isArray(rData) ? rData.slice(0, 9) : [],
          tags: Array.isArray(tagsData) ? tagsData : [],
          personalized: pData,
          recommendedAuthors: aData,
        });
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isSignedIn]);

  const featuredBlog = featured[0] || trending[0];
  const displayBlogs = activeTab === "foryou" ? personalized : recent;

  return (
    <>
      <Helmet>
        <title>Explore | DraftDock</title>
      </Helmet>

      <div className="px-8 md:px-12 min-h-screen">
        {/* Hero Header */}
        <header className="pt-12 pb-8">
          <h2 className="text-4xl md:text-[3.5rem] font-bold font-headline tracking-tighter leading-none text-white mb-4">
            Explore{" "}
            <span className="bg-gradient-to-r from-[#00e5ff] to-[#00ff88] bg-clip-text text-transparent italic">
              Intelligence
            </span>
            .
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 border-b border-[#1f1f23] pb-6">
            <p className="text-zinc-400 max-w-xl font-body">
              Curated technical insights from the world's leading engineers.
              Dive into deep-dives that define the next decade of tech.
            </p>
            <div className="flex gap-2 ml-auto flex-wrap">
              {tags.slice(0, 4).map((tag, i) => (
                <button
                  key={tag.name}
                  onClick={() => navigate(`/tags/${tag.name}`)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-label uppercase tracking-wider font-bold transition-all ${
                    i === 0
                      ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20"
                      : "bg-[#111113] text-zinc-400 border border-[#1f1f23] hover:border-[#00e5ff]/30 hover:text-[#00e5ff]"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <section className="py-8 grid grid-cols-12 gap-6 auto-rows-[280px]">
          {/* Featured Post (Large) */}
          {featuredBlog && (
            <div
              className="col-span-12 md:col-span-8 row-span-2 group relative overflow-hidden rounded-2xl bg-[#111113] cursor-pointer border border-[#1f1f23] hover:border-[#00e5ff]/30 transition-all"
              onClick={() => navigate(`/blog/${featuredBlog.id}`)}
            >
              <img
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60"
                src={
                  featuredBlog.coverImage ||
                  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000"
                }
                alt={featuredBlog.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 md:p-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="neon-gradient text-[#0a0a0b] px-3 py-1 rounded-lg text-[10px] font-label uppercase tracking-widest font-bold">
                    Editor's Choice
                  </span>
                  <span className="text-xs font-label text-zinc-400">
                    {Math.ceil(
                      (featuredBlog.summary || featuredBlog.title || "").length / 200
                    ) || 1}{" "}
                    min read
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-headline font-bold mb-4 leading-tight">
                  {featuredBlog.title}
                </h3>
                <p className="text-zinc-400 font-body max-w-lg mb-4 line-clamp-2">
                  {(featuredBlog.summary || featuredBlog.title || "").slice(0, 150)}
                  ...
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] font-bold text-sm">
                    {(
                      featuredBlog.author?.name ||
                      featuredBlog.author?.email ||
                      "A"
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm font-label font-medium text-zinc-300">
                    {featuredBlog.author?.name ||
                      featuredBlog.author?.email?.split("@")[0] ||
                      "Anonymous"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Side Cards */}
          {trending.slice(1, 3).map((blog, i) => (
            <div
              key={blog.id}
              className={`col-span-12 md:col-span-4 row-span-1 ${
                i === 0
                  ? "bg-[#111113] border border-[#1f1f23]"
                  : "bg-gradient-to-br from-[#00e5ff]/10 to-[#00ff88]/5 border border-[#00e5ff]/20"
              } p-6 md:p-8 flex flex-col justify-between rounded-2xl group hover:border-[#00e5ff]/40 hover:shadow-[0_0_30px_rgba(0,229,255,0.08)] transition-all cursor-pointer`}
              onClick={() => navigate(`/blog/${blog.id}`)}
            >
              <div>
                <span
                  className={`text-[10px] font-label font-bold uppercase tracking-widest mb-2 block ${
                    i === 0
                      ? "text-[#00e5ff]"
                      : "text-[#00ff88]"
                  }`}
                >
                  {(blog.tags || [])[0]?.name || "Tech"}
                </span>
                <h4
                  className="text-xl font-headline font-bold group-hover:text-[#00e5ff] transition-colors text-white"
                >
                  {blog.title}
                </h4>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs font-label text-zinc-500">
                  by{" "}
                  {blog.author?.name ||
                    blog.author?.email?.split("@")[0] ||
                    "Anonymous"}
                </span>
                <span className="text-zinc-500 group-hover:text-[#00e5ff] group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Editorial Feed */}
        <section className="py-12">
          <div className="flex items-center gap-8 mb-12 border-b border-[#1f1f23] pb-4">
            <button
              onClick={() => setActiveTab("trending")}
              className={`font-headline text-2xl font-bold transition-all relative ${
                activeTab === "trending"
                  ? "text-white"
                  : "text-zinc-500 opacity-60 hover:opacity-100"
              }`}
            >
              Trending
              {activeTab === "trending" && (
                <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#00e5ff] rounded-full" />
              )}
            </button>
            {isSignedIn && (
              <button
                onClick={() => setActiveTab("foryou")}
                className={`font-headline text-2xl font-bold transition-all flex items-center gap-2 relative ${
                  activeTab === "foryou"
                    ? "text-white"
                    : "text-zinc-500 opacity-60 hover:opacity-100"
                }`}
              >
                For You
                <span className="flex h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
                {activeTab === "foryou" && (
                  <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#00e5ff] rounded-full" />
                )}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-16">
              {displayBlogs.map((blog, idx) => (
                <article
                  key={blog.id}
                  className="grid grid-cols-12 gap-8 items-center group cursor-pointer"
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  <div
                    className={`col-span-12 md:col-span-4 ${
                      idx % 2 !== 0 ? "md:order-last" : ""
                    } overflow-hidden rounded-2xl bg-[#111113] border border-[#1f1f23] group-hover:border-[#00e5ff]/30 transition-all`}
                  >
                    <img
                      className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
                      src={
                        blog.coverImage ||
                        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800"
                      }
                      alt={blog.title}
                    />
                  </div>
                  <div
                    className={`col-span-12 md:col-span-8 flex flex-col gap-3 ${
                      idx % 2 !== 0 ? "md:text-right md:items-end" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 text-xs font-label uppercase tracking-widest text-zinc-500">
                      <span>
                        {new Date(blog.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                      <span>
                        {(blog.tags || [])[0]?.name || "General"}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-headline font-bold text-white hover:text-[#00e5ff] transition-colors leading-tight">
                      {blog.title}
                    </h3>
                    <p className="text-zinc-400 font-body leading-relaxed max-w-2xl line-clamp-2">
                      {(blog.summary || blog.title || "").slice(0, 200)}
                      ...
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        aria-label="Like"
                        className="inline-flex items-center gap-2 p-2 rounded-xl hover:bg-[#0a0a0b]/60 transition-colors"
                      >
                        <Heart size={18} />
                        <span className="text-xs font-label">
                          {blog.likes || 0}
                        </span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        aria-label="Bookmark"
                        className="inline-flex items-center p-2 rounded-xl hover:bg-[#0a0a0b]/60 transition-colors"
                      >
                        <Bookmark size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {displayBlogs.length === 0 && !loading && (
            <div className="text-center py-20 text-zinc-500">
              <Compass
                className="mx-auto mb-4 opacity-30"
                size={48}
              />
              <p className="text-lg">Nothing to explore yet.</p>
            </div>
          )}
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-[#111113] border border-[#1f1f23] mt-12 mb-12 -mx-8 md:-mx-12 px-8 md:px-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-3xl font-headline font-bold text-white mb-4 tracking-tight">
              Stay synchronized.
            </h3>
            <p className="text-zinc-400 font-body mb-8">
              Weekly technical deep-dives and architectural blueprints delivered
              directly to your inbox. No fluff, just signal.
            </p>
            <div className="flex gap-2">
              <input
                className="bg-[#0a0a0b] border border-[#1f1f23] rounded-xl px-4 py-3 flex-1 focus:border-[#00e5ff]/40 focus:shadow-[0_0_20px_rgba(0,229,255,0.1)] text-sm font-label focus:outline-none text-zinc-200 placeholder:text-zinc-500 transition-all"
                placeholder="engineer@domain.com"
                type="email"
              />
              <button className="neon-gradient text-[#0a0a0b] px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                Subscribe
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Contributors", value: "12k+" },
              { label: "Daily Posts", value: "450" },
              { label: "Monthly Readers", value: "8.4m" },
              { label: "Signal Ratio", value: "99.9" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-6 bg-[#0a0a0b] rounded-2xl text-center border border-[#1f1f23] hover:border-[#00e5ff]/20 transition-all"
              >
                <span className="text-2xl font-bold font-headline bg-gradient-to-r from-[#00e5ff] to-[#00ff88] bg-clip-text text-transparent">
                  {stat.value}
                </span>
                <p className="text-[10px] font-label uppercase tracking-widest mt-1 text-zinc-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default NewExplorePage;
