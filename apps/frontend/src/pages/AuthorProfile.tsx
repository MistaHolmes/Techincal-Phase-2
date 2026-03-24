import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft } from "lucide-react";
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
  tags: { id: string; name: string }[];
}

interface Author {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  createdAt: string;
  blogs: Blog[];
}

const AuthorProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchAuthor = async () => {
      try {
        const res = await fetch(`${API_URL}/api/authors/${userId}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setAuthor(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthor();
  }, [userId]);

  const displayName = author?.name || author?.email?.split("@")[0] || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !author) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <p className="text-xl mb-4">Author not found.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>{displayName} — DraftDock</title>
        <meta name="description" content={author.bio || `${displayName}'s blogs on DraftDock`} />
      </Helmet>
      <Header2 />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Author Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-2xl font-bold flex-shrink-0">
              {initials}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{displayName}</h1>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-3 flex items-center justify-center sm:justify-start gap-1">
                <Calendar size={12} />
                Joined {new Date(author.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </p>
              {author.bio && (
                <p className="text-gray-600 dark:text-gray-300 text-base mb-4 leading-relaxed">{author.bio}</p>
              )}
            </div>

            {/* Blog count badge */}
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{author.blogs.length}</span>
              <p className="text-xs text-gray-400 dark:text-gray-500">blog{author.blogs.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </motion.div>

        {/* Blogs */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Published Blogs</h2>
        {author.blogs.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-10">No published blogs yet.</p>
        ) : (
          <div className="space-y-4">
            {author.blogs.map((blog, i) => {
              const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 140) + "...";
              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4">
                    {blog.coverImage && (
                      <img src={blog.coverImage} alt={blog.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">{blog.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">{excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                        <span>{new Date(blog.updatedAt).toLocaleDateString()}</span>
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
      <Footer />
    </div>
  );
};

export default AuthorProfile;
