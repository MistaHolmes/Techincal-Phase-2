import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import BlogSkeleton from "@/components/BlogSkeleton";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/ui/backButton";
import { ChevronLeft, Heart, MessageCircle, Send, Trash2, Clock, Eye, Twitter, Linkedin, Link2, Share2, Check } from "lucide-react";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import 'highlight.js/styles/atom-one-dark.css';
import MDEditor from '@uiw/react-md-editor';

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
  views?: number;
  coverImage?: string;
  authorId?: string;
  author: {
    email: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { email: string; name?: string };
  authorId?: string;
}

interface RelatedBlog {
  id: string;
  title: string;
  content: string;
  likes: number;
  coverImage?: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const BlogView = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeQueue, setLikeQueue] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch blog data
  useEffect(() => {
    if (!blogId) return;
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/${blogId}`);
        const data = await res.json();
        setBlog(data);
        setLikes(data.likes ?? 0);
        // Increment view count (fire-and-forget)
        fetch(`${API_URL}/api/blogs/${blogId}/view`, { method: 'POST' }).catch(() => {});
        // Fetch comments
        const commentsRes = await fetch(`${API_URL}/api/blogs/${blogId}/comments`);
        if (commentsRes.ok) setComments(await commentsRes.json());
        // Fetch related blogs
        fetch(`${API_URL}/api/blogs/${blogId}/related`).then(r => r.ok ? r.json() : []).then(setRelatedBlogs).catch(() => {});
        // Record reading history if signed in
        if (isSignedIn) {
          const token = await getToken();
          fetch(`${API_URL}/api/user/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ blogId }),
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to fetch blog", err);
      }
    };
    fetchBlog();
  }, [blogId, API_URL, isSignedIn]);

  // WebSocket for real-time likes
  useEffect(() => {
    if (!blogId) return;
    const wsUrl = API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => { ws.send(`getLikes:${blogId}`); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "likes_update" && data.blogId === blogId) setLikes(data.likes);
      } catch {}
    };
    ws.onerror = (err) => console.warn("Likes WS error:", err);
    return () => { ws.close(); };
  }, [blogId, API_URL]);

  useEffect(() => {
    if (copied) { const timer = setTimeout(() => setCopied(false), 1000); return () => clearTimeout(timer); }
  }, [copied]);

  // Debounced like queue
  useEffect(() => {
    if (likeQueue === 0 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !blogId) return;
    const timeoutPath = setTimeout(() => {
      if (likeQueue > 0) wsRef.current?.send(`like:${blogId}`);
      else if (likeQueue < 0) wsRef.current?.send(`unlike:${blogId}`);
      setLikeQueue(0);
    }, 1000);
    return () => clearTimeout(timeoutPath);
  }, [likeQueue, blogId]);

  // Close share dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLike = () => {
    if (liked) { setLikes((prev) => Math.max(0, prev - 1)); setLikeQueue((prev) => prev - 1); }
    else { setLikes((prev) => prev + 1); setLikeQueue((prev) => prev + 1); }
    setLiked((prev) => !prev);
  };

  // Generate Table of Contents from markdown headings
  const tocItems = useMemo<TocItem[]>(() => {
    if (!blog?.content) return [];
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;
    while ((match = headingRegex.exec(blog.content)) !== null) {
      const text = match[2].replace(/[#*`\[\]]/g, "").trim();
      items.push({
        id: text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
        text,
        level: match[1].length,
      });
    }
    return items;
  }, [blog?.content]);

  if (!blog) {
    return (
      <div className="bg-gray-100/30 min-h-screen">
        <main className="max-w-3xl mx-auto p-6 bg-gray-100/30">
          <BlogSkeleton variant="large" />
        </main>
      </div>
    );
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  const wordCount = (blog.content || "").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const postUrl = `${window.location.origin}/blog/${blog.id}`;

  const shareLinks = [
    { label: "Twitter / X", icon: <Twitter size={14} />, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(postUrl)}` },
    { label: "LinkedIn", icon: <Linkedin size={14} />, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}` },
    { label: "WhatsApp", icon: <MessageCircle size={14} />, url: `https://wa.me/?text=${encodeURIComponent(`${blog.title} ${postUrl}`)}` },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-100/30">
      <ReadingProgressBar />
      <div className="fixed top-0 left-0 w-full z-50 bg-gray-100/30">
        <Header2 />
      </div>

      <div className="flex max-w-6xl mx-auto w-full px-4 pt-28 pb-16 gap-8">
        {/* Table of Contents */}
        {tocItems.length > 2 && (
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contents</h3>
              <nav className="space-y-1.5">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm text-gray-600 hover:text-black transition truncate ${
                      item.level === 1 ? "font-semibold" : item.level === 2 ? "pl-3" : "pl-6 text-xs"
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${tocItems.length > 2 ? "max-w-3xl" : "max-w-4xl mx-auto"}`}>
          <div className="px-0 mb-6">
            <BackButton variant="link" onClick={() => window.history.back()}>
              <ChevronLeft className="me-1 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
              Back To Blogs
            </BackButton>
          </div>

          <div className="px-6">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight text-gray-900 mb-6">{blog.title}</h1>

            {blog.coverImage && (
              <img src={blog.coverImage} alt={blog.title} className="w-full max-h-72 object-cover rounded-xl mb-6 shadow-sm" />
            )}

            {/* Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm sm:text-base text-gray-700 font-sans mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span>By{" "}
                  <button onClick={() => blog.authorId && navigate(`/author/${blog.authorId}`)} className="font-medium hover:underline hover:text-blue-600 transition">{blog.author.email}</button>
                </span>
                <span className="text-gray-400">•</span>
                <span>{formattedDate}</span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1"><Clock size={14} className="opacity-60" />{readingTime} min read</span>
                {blog.views !== undefined && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1"><Eye size={14} className="opacity-60" />{blog.views} views</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Like button */}
                <button
                  id={`like-btn-${blog.id}`}
                  onClick={handleLike}
                  aria-pressed={liked}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 ${
                    liked ? "bg-rose-50 border-rose-300 text-rose-600 shadow-sm" : "bg-white border-gray-300 text-gray-600 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50"
                  }`}
                >
                  <Heart size={16} strokeWidth={2} className={`transition-all duration-200 ${liked ? "fill-rose-500 text-rose-500 scale-110" : "group-hover:scale-110"}`} />
                  <span className="tabular-nums">{likes}</span>
                </button>

                {/* Share button with dropdown */}
                <div ref={shareRef} className="relative">
                  <button
                    onClick={() => setShareOpen(!shareOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 border border-gray-300 rounded-full hover:bg-gray-100 text-sm font-medium"
                  >
                    <Share2 size={14} className="opacity-60" />
                    Share
                  </button>
                  {shareOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
                      {shareLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setShareOpen(false)}
                        >
                          {link.icon} {link.label}
                        </a>
                      ))}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(postUrl).then(() => setCopied(true)).catch(() => alert("Failed to copy"));
                          setShareOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition w-full"
                      >
                        {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? "Copied!" : "Copy Link"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-gray-300 mb-10" />

            {/* Blog Content */}
            <div data-color-mode="light" className="blog-content w-full">
              <MDEditor.Markdown
                source={blog.content}
                className="prose prose-lg max-w-none !bg-transparent !text-gray-800"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>

            {/* Related Posts */}
            {relatedBlogs.length > 0 && (
              <div className="mt-16 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedBlogs.map((rb) => {
                    const excerpt = rb.content.replace(/[#*`>\[\]]/g, "").slice(0, 100) + "...";
                    const authorName = rb.author?.name || rb.author?.email?.split("@")[0] || "Anonymous";
                    return (
                      <div
                        key={rb.id}
                        onClick={() => navigate(`/blog/${rb.id}`)}
                        className="cursor-pointer bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all group"
                      >
                        {rb.coverImage && (
                          <img src={rb.coverImage} alt={rb.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}
                        <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition line-clamp-2">{rb.title}</h3>
                        <p className="text-gray-500 text-sm mb-2 line-clamp-2">{excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{authorName}</span>
                          <span>❤️ {rb.likes}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageCircle size={20} /> Comments ({comments.length})
              </h2>

              <div className="flex gap-3 mb-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black transition resize-none"
                />
                <button
                  onClick={async () => {
                    if (!newComment.trim() || submittingComment) return;
                    setSubmittingComment(true);
                    try {
                      const token = await getToken();
                      const res = await fetch(`${API_URL}/api/blogs/${blogId}/comments`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ content: newComment.trim() }),
                      });
                      if (res.ok) { const comment = await res.json(); setComments((prev) => [...prev, comment]); setNewComment(""); }
                    } catch (err) { console.error("Failed to post comment", err); }
                    finally { setSubmittingComment(false); }
                  }}
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-40 flex items-center gap-1.5 self-start mt-0.5"
                >
                  <Send size={14} /> {submittingComment ? "Posting..." : "Post"}
                </button>
              </div>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-400 italic text-sm py-4">No comments yet. Be the first!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                        {(c.author.name || c.author.email || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{c.author.name || c.author.email.split("@")[0]}</span>
                          <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{c.content}</p>
                      </div>
                      {c.authorId === (useAuth as any)?.userId && (
                        <button
                          onClick={async () => {
                            const token = await getToken();
                            await fetch(`${API_URL}/api/comments/${c.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                            setComments((prev) => prev.filter((x) => x.id !== c.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 transition"
                          title="Delete comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="bg-gray-100/30 mt-auto">
        <Footer />
      </div>

      <style>{`
        .blog-content {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #1f2937;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .blog-content p { margin-bottom: 1.5rem; line-height: 1.8; }
        .blog-content h1 { font-size: 2.5rem; font-weight: 700; margin: 2rem 0 1.5rem 0; line-height: 1.2; color: #111827; font-family: Georgia, serif; }
        .blog-content h2 { font-size: 2rem; font-weight: 600; margin: 1.75rem 0 1rem 0; line-height: 1.3; color: #111827; font-family: Georgia, serif; }
        .blog-content h3 { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; line-height: 1.4; color: #111827; font-family: Georgia, serif; }
        .blog-content h4 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem 0; line-height: 1.4; color: #111827; }
        .blog-content h5, .blog-content h6 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem 0; line-height: 1.4; color: #111827; }
        .blog-content strong, .blog-content b { font-weight: 700; color: #111827; }
        .blog-content em, .blog-content i { font-style: italic; }
        .blog-content u { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }
        .blog-content strike, .blog-content s { text-decoration: line-through; }
        .blog-content pre { background-color: #1e1e1e; color: #ffffff; padding: 1.5rem; border-radius: 0.5rem; margin: 2rem 0; overflow-x: auto; font-family: 'Courier New', 'Monaco', 'Menlo', monospace; font-size: 0.875rem; line-height: 1.6; border: 1px solid #374151; position: relative; }
        .blog-content code { background-color: #f3f4f6; color: #1f2937; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-family: 'Courier New', 'Monaco', 'Menlo', monospace; font-size: 0.9em; border: 1px solid #e5e7eb; }
        .blog-content pre code { background-color: transparent; color: inherit; padding: 0; border: none; border-radius: 0; }
        .blog-content blockquote { border-left: 4px solid #3b82f6; padding: 1rem 1.5rem; margin: 2rem 0; font-style: italic; color: #4b5563; background-color: #f8fafc; border-radius: 0 0.375rem 0.375rem 0; }
        .blog-content ul { list-style-type: disc; margin-left: 2rem; margin-bottom: 1.5rem; }
        .blog-content ol { list-style-type: decimal; margin-left: 2rem; margin-bottom: 1.5rem; }
        .blog-content li { margin-bottom: 0.5rem; line-height: 1.7; padding-left: 0.5rem; }
        .blog-content a { color: #3b82f6; text-decoration: underline; text-underline-offset: 2px; transition: color 0.2s; }
        .blog-content a:hover { color: #1d4ed8; }
        .blog-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
        .blog-content th, .blog-content td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; }
        .blog-content th { background-color: #f9fafb; font-weight: 600; }
        .blog-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        @media (max-width: 640px) {
          .blog-content { font-size: 1rem; line-height: 1.7; }
          .blog-content h1 { font-size: 2rem; }
          .blog-content h2 { font-size: 1.75rem; }
          .blog-content h3 { font-size: 1.375rem; }
          .blog-content pre { padding: 1rem; margin: 1.5rem 0; font-size: 0.8rem; }
          .blog-content ul, .blog-content ol { margin-left: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default BlogView;