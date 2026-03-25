import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useAuth } from "@clerk/clerk-react";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserContentSection from "../components/UserContent";
import { Footer } from "@/components/Footer";

const API_URL = import.meta.env.VITE_API_URL;

interface FollowUser {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  bio?: string;
}

const ProfileComponent = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loadingFollow, setLoadingFollow] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [followersRes, followingRes] = await Promise.all([
          fetch(`${API_URL}/api/user/followers`, { headers }),
          fetch(`${API_URL}/api/user/following`, { headers }),
        ]);
        if (followersRes.ok) setFollowers(await followersRes.json());
        if (followingRes.ok) setFollowing(await followingRes.json());
      } catch (err) {
        console.error("Failed to fetch follow data:", err);
      } finally {
        setLoadingFollow(false);
      }
    };
    fetchFollowData();
  }, []);

  const handleUnfollow = async (userId: string) => {
    setUnfollowingId(userId);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/user/unfollow/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowing((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Unfollow failed:", err);
    } finally {
      setUnfollowingId(null);
    }
  };

  const renderUserCard = (user: FollowUser, showUnfollow = false) => {
    const displayName = user.name || user.email.split("@")[0];
    const initials = displayName.slice(0, 2).toUpperCase();
    return (
      <motion.div
        key={user.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
        onClick={() => navigate(`/author/${user.id}`)}
      >
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={displayName} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {displayName}
          </p>
          {user.bio && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.bio}</p>
          )}
        </div>
        {showUnfollow && (
          <button
            onClick={(e) => { e.stopPropagation(); handleUnfollow(user.id); }}
            disabled={unfollowingId === user.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:border-red-800 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all disabled:opacity-40"
          >
            <UserMinus size={12} />
            {unfollowingId === user.id ? "..." : "Unfollow"}
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Account Management Box */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 flex flex-col md:flex-row items-center justify-between transition-all mb-10 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Users size={160} />
           </div>
           <div className="md:w-3/4 relative z-10">
            <h2 className="text-3xl font-headline font-bold text-gray-900 dark:text-white mb-4">Account Management</h2>
            <p className="text-gray-500 dark:text-gray-400 font-body leading-relaxed max-w-2xl">
              Access your personal details, security settings, and professional profile. Use the Clerk dashboard to manage your authentication and session data securely.
            </p>
          </div>
          <div className="md:w-1/4 flex justify-center md:justify-end mt-8 md:mt-0 relative z-10">
            <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
               <UserButton
                 afterSignOutUrl="/"
                 appearance={{
                   elements: {
                     userButtonAvatarBox: "w-14 h-14",
                   },
                 }}
               />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
             {/* Manage Your Blogs Section */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <UserContentSection />
             </div>
          </div>

          <div className="space-y-10">
            {/* Followers / Following Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl">
                   <Users className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-headline font-bold text-gray-900 dark:text-white">Network</h2>
              </div>

              {/* Tab toggles */}
              <div className="flex bg-gray-50 dark:bg-gray-950 p-1 rounded-2xl mb-8">
                <button
                  onClick={() => setActiveTab("followers")}
                  className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === "followers"
                      ? "bg-white dark:bg-gray-800 text-violet-600 shadow-md"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Followers ({followers.length})
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === "following"
                      ? "bg-white dark:bg-gray-800 text-violet-600 shadow-md"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Following ({following.length})
                </button>
              </div>

              {/* Content */}
              {loadingFollow ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activeTab === "followers" ? (
                    <motion.div key="followers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      {followers.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                          <UserPlus className="w-10 h-10 mx-auto mb-4 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-tighter">No followers yet</p>
                        </div>
                      ) : (
                        followers.map((user) => renderUserCard(user, false))
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      {following.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                          <Users className="w-10 h-10 mx-auto mb-4 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-tighter">No follows yet</p>
                        </div>
                      ) : (
                        following.map((user) => renderUserCard(user, true))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-20 px-4">
        <Footer />
      </div>
    </>
  );
};

export default ProfileComponent;
