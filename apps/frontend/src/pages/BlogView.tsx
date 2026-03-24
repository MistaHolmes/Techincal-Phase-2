import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import BlogSkeleton from "@/components/BlogSkeleton";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/ui/backButton";
import { ChevronLeft, Heart, Share, MessageCircle, Send, Trash2 } from "lucide-react";
import { ShareButton } from "@/components/ui/shareButton";
import 'highlight.js/styles/atom-one-dark.css';
import MDEditor from '@uiw/react-md-editor';

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
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

const BlogView = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { getToken, userId: currentUserId } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeQueue, setLikeQueue] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
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
        // also fetch comments
        const commentsRes = await fetch(`${API_URL}/api/blogs/${blogId}/comments`);
        if (commentsRes.ok) setComments(await commentsRes.json());
      } catch (err) {
        console.error("Failed to fetch blog", err);
      }
    };
    fetchBlog();
  }, [blogId, API_URL]);

  // WebSocket for real-time likes
  useEffect(() => {
    if (!blogId) return;

    const wsUrl = API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Request current like count immediately on connect
      ws.send(`getLikes:${blogId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "likes_update" && data.blogId === blogId) {
          setLikes(data.likes);
        }
      } catch {
        // ignore non-JSON messages (pong, etc.)
      }
    };

    ws.onerror = (err) => console.warn("Likes WS error:", err);

    return () => {
      ws.close();
    };
  }, [blogId, API_URL]);

  // Cleanup copy timer
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Debounced queue for sending likes to WebSocket
  useEffect(() => {
    if (likeQueue === 0 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !blogId) return;

    const timeoutPath = setTimeout(() => {
      // Send the net result over WebSocket
      if (likeQueue > 0) {
        wsRef.current?.send(`like:${blogId}`);
      } else if (likeQueue < 0) {
        wsRef.current?.send(`unlike:${blogId}`);
      }
      // Reset the queue after sending
      setLikeQueue(0);
    }, 1000); // 1-second debounce delay

    return () => clearTimeout(timeoutPath);
  }, [likeQueue, blogId]);

  const handleLike = () => {
    // Optimistically update UI immediately
    if (liked) {
      setLikes((prev) => Math.max(0, prev - 1));
      setLikeQueue((prev) => prev - 1); // Add "unlike" action to queue
    } else {
      setLikes((prev) => prev + 1);
      setLikeQueue((prev) => prev + 1); // Add "like" action to queue
    }
    setLiked((prev) => !prev);
  };

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
    year: "numeric",
    month: "long",
    day: "numeric",
  });


  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-100/30">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-gray-100/30">
        <Header2 />
      </div>

      {/* Blog Content */}
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Back Button */}
        <div className="px-0 mb-6">
          <BackButton variant="link" onClick={() => window.history.back()}>
            <ChevronLeft
              className="me-1 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Back To Blogs
          </BackButton>
        </div>

        <div className="px-6">
          {/* Title */}
          <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight text-gray-900 mb-6">
            {blog.title}
          </h1>

          {/* Cover Image */}
          {blog.coverImage && (
            <img src={blog.coverImage} alt={blog.title} className="w-full max-h-72 object-cover rounded-xl mb-6 shadow-sm" />
          )}

          {/* Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm sm:text-base text-gray-700 font-sans mb-8">
            {/* Left: Author and Date */}
            <div className="flex items-center gap-2">
              <span>By{" "}
                <button
                  onClick={() => blog.authorId && navigate(`/author/${blog.authorId}`)}
                  className="font-medium hover:underline hover:text-blue-600 transition"
                >{blog.author.email}</button>
              </span>
              <span className="text-gray-400">•</span>
              <span>{formattedDate}</span>
            </div>

            {/* Right: Like and Share Buttons */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  id={`like-btn-${blog.id}`}
                  onClick={handleLike}
                  aria-pressed={liked}
                  aria-label={liked ? "Unlike this post" : "Like this post"}
                  className={`
                    group flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium text-sm
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400
                    ${liked
                      ? "bg-rose-50 border-rose-300 text-rose-600 shadow-sm"
                      : "bg-white border-gray-300 text-gray-600 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50"
                    }
                  `}
                >
                  <Heart
                    size={16}
                    strokeWidth={2}
                    className={`transition-all duration-200 ${liked ? "fill-rose-500 text-rose-500 scale-110" : "group-hover:scale-110"}`}
                  />
                  <span className="tabular-nums">{likes}</span>
                  <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
                </button>
              </div>

              <ShareButton
                variant="link"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 border border-transparent rounded-full hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  const postUrl = `${window.location.origin}/blog/${blog.id}`;
                  navigator.clipboard
                    .writeText(postUrl)
                    .then(() => setCopied(true))
                    .catch(() => alert("Failed to copy the link."));
                }}
              >
                <Share
                  className="opacity-60"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>{copied ? "Copied!" : "Share"}</span>
              </ShareButton>
            </div>
          </div>

          <hr className="border-gray-300 mb-10" />

          {/* Blog Content - Now renders HTML with proper styling */}
          <div data-color-mode="light" className="blog-content w-full">
            <MDEditor.Markdown 
              source={blog.content} 
              className="prose prose-lg max-w-none !bg-transparent !text-gray-800"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>

          {/* ─────────────── Comments ─────────────── */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageCircle size={20} /> Comments ({comments.length})
            </h2>

            {/* Comment input */}
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
                    if (res.ok) {
                      const comment = await res.json();
                      setComments((prev) => [...prev, comment]);
                      setNewComment("");
                    }
                  } catch (err) {
                    console.error("Failed to post comment", err);
                  } finally {
                    setSubmittingComment(false);
                  }
                }}
                disabled={!newComment.trim() || submittingComment}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-40 flex items-center gap-1.5 self-start mt-0.5"
              >
                <Send size={14} /> {submittingComment ? "Posting..." : "Post"}
              </button>
            </div>

            {/* Comments list */}
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
                    {c.authorId === currentUserId && (
                      <button
                        onClick={async () => {
                          const token = await getToken();
                          await fetch(`${API_URL}/api/comments/${c.id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          });
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
          {/* ────────────────────────────────────────────────────── */}
        </div>
      </main>

      {/* Footer */}
      <div className="bg-gray-100/30 mt-auto">
        <Footer />
      </div>

      {/* Enhanced custom styles for blog content */}
      <style>{`
        .blog-content {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #1f2937;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .blog-content p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }
        
        .blog-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 2rem 0 1.5rem 0;
          line-height: 1.2;
          color: #111827;
          font-family: Georgia, serif;
        }
        
        .blog-content h2 {
          font-size: 2rem;
          font-weight: 600;
          margin: 1.75rem 0 1rem 0;
          line-height: 1.3;
          color: #111827;
          font-family: Georgia, serif;
        }
        
        .blog-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem 0;
          line-height: 1.4;
          color: #111827;
          font-family: Georgia, serif;
        }
        
        .blog-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem 0;
          line-height: 1.4;
          color: #111827;
        }
        
        .blog-content h5, .blog-content h6 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.4;
          color: #111827;
        }
        
        .blog-content strong, .blog-content b {
          font-weight: 700;
          color: #111827;
        }
        
        .blog-content em, .blog-content i {
          font-style: italic;
        }
        
        .blog-content u {
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
        }
        
        .blog-content strike, .blog-content s {
          text-decoration: line-through;
          text-decoration-thickness: 1px;
        }
        
        .blog-content pre {
          background-color: #1e1e1e;
          color: #ffffff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin: 2rem 0;
          overflow-x: auto;
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          border: 1px solid #374151;
        }
        
        .blog-content code {
          background-color: #f3f4f6;
          color: #1f2937;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          font-size: 0.9em;
          border: 1px solid #e5e7eb;
        }
        
        .blog-content pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          border: none;
          border-radius: 0;
        }
        
        .blog-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #4b5563;
          background-color: #f8fafc;
          padding: 1rem 1.5rem;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        
        .blog-content ul {
          list-style-type: disc;
          margin-left: 2rem;
          margin-bottom: 1.5rem;
          padding-left: 0;
        }
        
        .blog-content ol {
          list-style-type: decimal;
          margin-left: 2rem;
          margin-bottom: 1.5rem;
          padding-left: 0;
        }
        
        .blog-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
          padding-left: 0.5rem;
        }
        
        .blog-content li > ul,
        .blog-content li > ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .blog-content a {
          color: #3b82f6;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
          transition: color 0.2s ease;
        }
        
        .blog-content a:hover {
          color: #1d4ed8;
          text-decoration-thickness: 2px;
        }
        
        /* Handle custom font sizes from rich text editor */
        .blog-content [style*="font-size: 12px"] {
          font-size: 0.75rem !important;
          line-height: 1.6;
        }
        
        .blog-content [style*="font-size: 14px"] {
          font-size: 0.875rem !important;
          line-height: 1.6;
        }
        
        .blog-content [style*="font-size: 16px"] {
          font-size: 1rem !important;
          line-height: 1.7;
        }
        
        .blog-content [style*="font-size: 18px"] {
          font-size: 1.125rem !important;
          line-height: 1.7;
        }
        
        .blog-content [style*="font-size: 24px"] {
          font-size: 1.5rem !important;
          line-height: 1.5;
        }
        
        .blog-content [style*="font-size: 36px"] {
          font-size: 2.25rem !important;
          line-height: 1.3;
        }
        
        /* Handle custom font families */
        .blog-content [style*="font-family"] {
          line-height: inherit;
        }
        
        /* Handle custom colors */
        .blog-content [style*="color"] {
          /* Colors are preserved from inline styles */
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .blog-content {
            font-size: 1rem;
            line-height: 1.7;
          }
          
          .blog-content h1 {
            font-size: 2rem;
          }
          
          .blog-content h2 {
            font-size: 1.75rem;
          }
          
          .blog-content h3 {
            font-size: 1.375rem;
          }
          
          .blog-content pre {
            padding: 1rem;
            margin: 1.5rem 0;
            font-size: 0.8rem;
          }
          
          .blog-content ul, .blog-content ol {
            margin-left: 1.5rem;
          }
        }
        
        /* Preserve spacing and formatting */
        .blog-content br {
          margin-bottom: 0.5rem;
        }
        
        .blog-content hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 2rem 0;
        }
        
        /* Table styling if tables are used */
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        
        .blog-content th, .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        
        .blog-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        /* Image styling */
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default BlogView;