import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { BarChart2, Heart, FileText, Trophy, MessageCircle } from "lucide-react";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";
import BackgroundGlow from "@/components/ui/BackgroundGlow";

const API_URL = import.meta.env.VITE_API_URL;

interface Stats {
  totalBlogs: number;
  publishedCount: number;
  draftCount: number;
  totalLikes: number;
  commentCount: number;
  topBlog: { id: string; title: string; likes: number } | null;
  blogs: { id: string; title: string; likes: number; published: boolean }[];
}

const StatCard = ({
  label, value, icon, color, delay = 0
}: {
  label: string; value: number | string; icon: React.ReactNode; color: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
    className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm cursor-default transition-colors`}
  >
    <div className={`inline-flex p-2.5 rounded-lg mb-3 ${color}`}>{icon}</div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_URL}/api/user/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = stats?.blogs
    .filter((b) => b.published)
    .slice(0, 10)
    .map((b) => ({
      name: b.title.length > 18 ? b.title.slice(0, 18) + "…" : b.title,
      likes: b.likes,
    })) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>Dashboard — DraftDock</title>
      </Helmet>
      <Header2 />
      <BackgroundGlow />

      <main className="max-w-5xl mx-auto px-4 pt-28 pb-16 relative z-[1]">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, x: -20, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5 }}
        >
          <BarChart2 className="w-7 h-7 text-gray-700 dark:text-gray-200" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !stats ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-20">Failed to load stats.</p>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              <StatCard label="Published Blogs" value={stats.publishedCount} icon={<FileText size={18} />} color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" delay={0.1} />
              <StatCard label="Drafts" value={stats.draftCount} icon={<FileText size={18} />} color="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" delay={0.2} />
              <StatCard label="Total Likes" value={stats.totalLikes} icon={<Heart size={18} />} color="bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400" delay={0.3} />
              <StatCard label="Comments Received" value={stats.commentCount} icon={<MessageCircle size={18} />} color="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" delay={0.4} />
            </div>

            {/* Top Blog */}
            {stats.topBlog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-8 cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/blog/${stats.topBlog!.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-0.5">Most Popular Blog</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{stats.topBlog.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">❤️ {stats.topBlog.likes} likes · Click to view</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Likes per Blog</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "#f9fafb",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="likes" fill="#111827" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats.totalBlogs === 0 && (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-4">No blogs yet. Start writing to see your stats!</p>
                <button
                  onClick={() => navigate("/create-blog")}
                  className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-80 transition"
                >
                  Create Blog
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
