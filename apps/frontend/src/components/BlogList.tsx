import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Share, Heart, Clock } from "lucide-react";
import { ShareButton } from "./ui/shareButton";

const API_URL = import.meta.env.VITE_API_URL;

const BlogCardLikeButton = ({ blogId }: { blogId: string }) => {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  // Fetch current like count + user status
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/likes/${blogId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setLikes(data.likes ?? 0);
          setLiked(data.liked ?? false);
        }
      } catch {}
    };
    fetchLikes();
  }, [blogId, getToken]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        // Revert — user not signed in
        setLiked(wasLiked);
        setLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
        return;
      }

      const res = await fetch(`${API_URL}/api/likes/${blogId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setLiked(data.liked);
      } else {
        // Revert on failure
        setLiked(wasLiked);
        setLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {
      setLiked(wasLiked);
      setLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  }, [blogId, liked, loading, getToken]);

  return (
    <button
      onClick={handleLike}
      aria-pressed={liked}
      className={`
        group flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium text-sm
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400
        ${liked
          ? "bg-rose-50 border-rose-300 text-rose-600 shadow-sm dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400"
          : "bg-white border-gray-300 text-gray-600 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-rose-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/20"
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
  );
};

interface Blog {
  id: string;
  title: string;
  summary: string;
  author: string;
  authorId?: string;
  published: string;
  coverImage?: string;
}

interface BlogListProps {
  posts: Blog[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  const scrollRef = useRef<HTMLDivElement>(null); // ✅ Ref for scrolling

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const stripHtmlTags = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const handleClick = (id: string) => {
    navigate(`/blog/${id}`);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      scrollToTop(); // ✅ Scroll to top on next
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      scrollToTop(); // ✅ Scroll to top on back
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={scrollRef}></div> {/* 👈 Scroll Target */}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No blogs available</p>
          <Button className="gap-2" onClick={() => navigate('/create-blog')}>
            Create your first blog
          </Button>
        </div>
      ) : (
        <>
          {currentPosts.map((post) => (
            <motion.div
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => handleClick(post.id)}
              onKeyDown={(e) => e.key === "Enter" && handleClick(post.id)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-3xl border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-5 shadow-sm bg-white dark:bg-gray-900 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <div className="flex gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">
                    <div className="flex items-center gap-3">
                      <span>{post.published}</span>
                      <span className="flex items-center gap-1"><Clock size={11} className="opacity-60" />{Math.max(1, Math.ceil(stripHtmlTags(post.summary).split(/\s+/).filter(Boolean).length / 200))} min</span>
                    </div>
                    <span
                      className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors duration-200"
                      onClick={(e) => { e.stopPropagation(); navigate(`/author/${post.authorId}`); }}
                    >
                      By {post.author}
                    </span>
                  </div>
                  <h3 className="text-lg font-headline font-bold mb-2 text-gray-900 dark:text-white leading-snug line-clamp-2">{stripHtmlTags(post.title)}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{stripHtmlTags(post.summary)}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
                    <BlogCardLikeButton blogId={post.id} />

                    <ShareButton
                      variant="link"
                      className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full px-3 py-1.5 transition-colors text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const postUrl = `${window.location.origin}/blog/${post.id}`;
                        navigator.clipboard.writeText(postUrl)
                          .then(() => {
                            setCopiedId(post.id);
                            setTimeout(() => setCopiedId(null), 1000);
                          });
                      }}
                    >
                      <Share size={14} strokeWidth={2} aria-hidden="true" />
                      <span>{copiedId === post.id ? "Copied!" : "Share"}</span>
                    </ShareButton>
                  </div>
                </div>
                {post.coverImage && (
                  <div className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden hidden sm:block group/img">
                    <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Pagination Controls */}
          {posts.length > 0 && (
            <div className="flex items-center justify-between mt-6 gap-4">
              {currentPage > 1 && (
                <Button onClick={goToPreviousPage} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>

              {currentPage < totalPages && (
                <Button onClick={goToNextPage} className="flex items-center gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {currentPage === totalPages && posts.length > 0 && (
            <p className="mt-2 text-gray-500 italic">No more drafts — dock a new one!</p>
          )}
        </>
      )}
    </div>
  );
};

export default BlogList;
