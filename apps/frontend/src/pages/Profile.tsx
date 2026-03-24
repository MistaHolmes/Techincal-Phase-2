import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useAuth } from "@clerk/clerk-react";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header3 from "../components/ui/header3";
import UserContentSection from "../components/UserContent";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-950 transition-colors duration-300">
      <div className="w-full">
        <Header3 />
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Account Management Box */}
        <div className="bg-white dark:bg-gray-900/60 rounded-xl shadow-md border border-gray-300 dark:border-gray-800 p-6 flex flex-col md:flex-row items-center justify-between transition-colors">
          <div className="md:w-3/4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Manage Your Account</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Access and update your personal details, security settings, and view your recent activity. Use the profile menu to manage your account efficiently.
            </p>
          </div>
          <div className="md:w-1/4 flex justify-center md:justify-end mt-6 md:mt-0 mr-4">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-12 h-12",
                },
              }}
            />
          </div>
        </div>

        {/* Followers / Following Section */}
        <div className="mt-8 bg-white dark:bg-gray-900/60 rounded-xl shadow-md border border-gray-300 dark:border-gray-800 p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Network</h2>
          </div>

          {/* Tab toggles */}
          <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden w-fit mb-6">
            <button
              onClick={() => setActiveTab("followers")}
              className={`px-5 py-2.5 font-semibold text-sm transition ${
                activeTab === "followers"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-900/20"
              }`}
            >
              Followers ({followers.length})
            </button>
            <div className="w-px bg-gray-300 dark:bg-gray-700"></div>
            <button
              onClick={() => setActiveTab("following")}
              className={`px-5 py-2.5 font-semibold text-sm transition ${
                activeTab === "following"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-900/20"
              }`}
            >
              Following ({following.length})
            </button>
          </div>

          {/* Content */}
          {loadingFollow ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-3 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "followers" ? (
                <motion.div key="followers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {followers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                      <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No followers yet. Share your blogs to grow your audience!</p>
                    </div>
                  ) : (
                    followers.map((user) => renderUserCard(user, false))
                  )}
                </motion.div>
              ) : (
                <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {following.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">You're not following anyone yet. Discover authors on the Explore page!</p>
                    </div>
                  ) : (
                    following.map((user) => renderUserCard(user, true))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Manage Your Blogs Section */}
        <UserContentSection />
      </div>
    </div>
  );
};

export default ProfileComponent;
