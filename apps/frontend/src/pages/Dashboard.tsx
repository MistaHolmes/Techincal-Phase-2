import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie } from "recharts";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { BarChart2, Heart, FileText, Trophy, Users, TrendingUp, CheckCircle, Zap, Award } from "lucide-react";
import { Footer } from "@/components/Footer";
import BackgroundGlow from "@/components/ui/BackgroundGlow";
import { AchievementGrid } from "@/components/social/AchievementGrid";

const API_URL = import.meta.env.VITE_API_URL;





const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // States for different analytics modules
  const [basicStats, setBasicStats] = useState<any>(null);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [completion, setCompletion] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        
        const [statsRes, viewsRes, engageRes, growthRes, completionRes, userAchRes, allAchRes] = await Promise.all([
          axios.get(`${API_URL}/api/user/stats`, { headers }),
          axios.get(`${API_URL}/api/analytics/views`, { headers }),
          axios.get(`${API_URL}/api/analytics/engagement`, { headers }),
          axios.get(`${API_URL}/api/analytics/follower-growth`, { headers }),
          axios.get(`${API_URL}/api/analytics/reading-completion`, { headers }),
          axios.get(`${API_URL}/api/achievements/user`, { headers }),
          axios.get(`${API_URL}/api/achievements/all`, { headers }),
        ]);

        setBasicStats(statsRes.data);
        setViewHistory(viewsRes.data.daily);
        setEngagement(engageRes.data);
        setGrowth(growthRes.data.history);
        setCompletion(completionRes.data);
        setUserAchievements(userAchRes.data);
        setAllAchievements(allAchRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Creator Dashboard — DraftDock</title>
      </Helmet>
      <BackgroundGlow />

      <div className="max-w-7xl mx-auto py-8 px-4 relative z-[1]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold tracking-tight mb-2"
            >
              <TrendingUp size={18} />
              <span className="uppercase text-xs tracking-widest font-headline">Analytics Overview</span>
            </motion.div>
            <h1 className="text-4xl font-headline font-bold text-gray-900 dark:text-white tracking-tight">
              Creator Insights
            </h1>
          </div>
          <div className="flex gap-3">
             <button onClick={() => navigate('/create-blog')} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 dark:shadow-none transition-all flex items-center gap-2">
               <Zap size={18} /> New Story
             </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <MetricCard 
             title="Total Views" 
             value={engagement?.totalViews || 0} 
             subtitle="Lifetime reach"
             icon={<BarChart2 size={20} />} 
             trend="+12%" 
             color="violet"
             index={0}
           />
           <MetricCard 
             title="Engagement Rate" 
             value={`${engagement?.engagementRate || 0}%`} 
             subtitle="Reader interaction"
             icon={<Heart size={20} />} 
             trend="+4.5%" 
             color="rose"
             index={1}
           />
           <MetricCard 
             title="Active Followers" 
             value={basicStats?.totalFollowers || 0} 
             subtitle="Community size"
             icon={<Users size={20} />} 
             trend="+8" 
             color="blue"
             index={2}
           />
           <MetricCard 
             title="Published Stories" 
             value={basicStats?.publishedCount || 0} 
             subtitle="Creator consistency"
             icon={<FileText size={20} />} 
             color="emerald"
             index={3}
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Chart: Views History */}
          <div className="lg:col-span-2 space-y-10">
            <ChartContainer title="Audience Reach" subtitle="Daily views over the last 30 days">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={viewHistory}>
                  <defs>
                    <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#viewGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Reading Completion Breakdown */}
            <ChartContainer title="Retention Analysis" subtitle="How many readers finish your stories">
               <div className="space-y-6 text-gray-900 dark:text-gray-100">
                  {completion.map((blog, i) => (
                    <div key={blog.id} className="space-y-2">
                       <div className="flex justify-between text-sm items-end">
                          <span className="font-semibold text-gray-950 dark:text-gray-200 truncate max-w-[70%]">{blog.title}</span>
                          <span className="text-violet-600 font-bold">{blog.rate}%</span>
                       </div>
                       <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${blog.rate}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-violet-500 rounded-full"
                          />
                       </div>
                    </div>
                  ))}
                  {completion.length === 0 && <p className="text-center py-10 text-gray-400 italic">Start writing to see retention data.</p>}
               </div>
            </ChartContainer>

            {/* Achievements Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                    <Award size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-bold text-gray-900 dark:text-white">Milestones</h2>
                    <p className="text-xs text-gray-500">Your path to becoming a DraftDock elite</p>
                  </div>
               </div>
               <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700">
                  <AchievementGrid achievements={userAchievements} allAchievements={allAchievements} />
               </div>
            </div>
          </div>

          {/* Right Sidebar Stats */}
          <div className="space-y-10">
             {/* Follower Growth */}
             <ChartContainer title="Community Growth" subtitle="Followers trend">
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={growth}>
                    <Line type="stepAfter" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
             </ChartContainer>

             {/* Engagement Mix */}
             <ChartContainer title="Engagement Mix" subtitle="Action breakdown">
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Likes', value: engagement?.totalLikes || 0 },
                          { name: 'Comments', value: engagement?.commentCount || 0 },
                          { name: 'Bookmarks', value: engagement?.bookmarkCount || 0 },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                      {(engagement ? [1,2,3] : []).map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2">
                      <LegendItem label="Likes" color="bg-violet-500" />
                      <LegendItem label="Comments" color="bg-pink-500" />
                      <LegendItem label="Saves" color="bg-amber-500" />
                  </div>
                </div>
             </ChartContainer>

             {/* Top Story Spotlight */}
             {basicStats?.topBlog && (
                <div className="bg-black dark:bg-violet-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => navigate(`/blog/${basicStats.topBlog.id}`)}>
                   <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Trophy size={140} />
                   </div>
                   <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                        Star Story
                      </div>
                      <h3 className="text-2xl font-headline font-bold mb-4 line-clamp-2 leading-tight">{basicStats.topBlog.title}</h3>
                      <div className="flex items-center gap-6 text-white/80 text-sm font-bold">
                         <span className="flex items-center gap-2"><Heart size={16} /> {basicStats.topBlog.likes}</span>
                         <span className="flex items-center gap-2"><CheckCircle size={16} /> 94% finished</span>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
      <div className="mt-20 px-4">
        <Footer />
      </div>
    </>
  );
};

function MetricCard({ title, value, subtitle, icon, trend, color, index = 0 }: any) {
  const colorMap: any = {
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  };

  const isPositive = trend?.startsWith("+");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]} transition-transform group-hover:scale-105`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
            isPositive 
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              {isPositive 
                ? <path d="M5 2L8 6H2L5 2Z" />
                : <path d="M5 8L2 4H8L5 8Z" />
              }
            </svg>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{title}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </motion.div>
  );
}

export default Dashboard;

function ChartContainer({ title, subtitle, children }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-headline font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function LegendItem({ label, color }: any) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
    </div>
  );
}
