import React, { useState, useEffect, useRef } from "react";
import { LayoutGrid, FileDiff, Compass, Bookmark, BarChart2, Settings, Menu, X, Search, History, Trophy, MessageSquare } from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

interface Blog {
  id: string;
  title: string;
  summary: string;
  authorId: string;
  updatedAt: Date;
  published: string;
  tags?: string[];
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

interface FolderItemProps {
  href: string;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, active }) => (
  <a
    href={href}
    className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg transition-colors ${active ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
  >
    {icon}
    <span>{children}</span>
  </a>
);

const FolderItem: React.FC<FolderItemProps> = ({ href, children }) => (
  <a href={href} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
    <span>{children}</span>
  </a>
);

const cachedUserBlogs: Record<string, Blog[]> = {};

const Sidebar: React.FC<{ activePage?: string }> = ({ activePage = "dock" }) => {
  const { user, isLoaded } = useUser();
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const hasFetchedUserBlogs = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || !user.id) return;
    if (cachedUserBlogs[user.id]) setUserBlogs(cachedUserBlogs[user.id]);

    if (!hasFetchedUserBlogs.current || !cachedUserBlogs[user.id]) {
      hasFetchedUserBlogs.current = true;
      const API_URL = import.meta.env.VITE_API_URL;
      axios
        .get(`${API_URL}/api/user/blogs`, { withCredentials: true })
        .then((res) => {
          const blogs = res.data.blogs.map((b: any) => ({
            id: b.id,
            title: b.title,
            summary: b.content.slice(0, 150) + "...",
            authorId: b.authorId,
            updatedAt: new Date(b.updatedAt),
            published: new Date(b.updatedAt).toLocaleDateString(),
            tags: b.tags || [],
          }));
          cachedUserBlogs[user.id] = blogs;
          setUserBlogs(blogs);
        })
        .catch((err) => console.error("Error fetching user blogs:", err));
    }
  }, [user, isLoaded]);

  return (
    <>
      <button className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-200 dark:bg-gray-700 rounded" onClick={() => setOpen(true)}>
        <Menu className="w-5 h-5" />
      </button>

      <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <button className="text-xl font-bold text-gray-900 dark:text-white" onClick={() => { navigate("/landing"); setOpen(false); }}>
            DraftDock
          </button>
          <button className="md:hidden text-gray-500 dark:text-gray-400" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 px-2 py-4">
          <NavItem href="/blogs" icon={<LayoutGrid size={16} />} active={activePage === "dock"}>Dock</NavItem>
          <NavItem href="/explore" icon={<Compass size={16} />} active={activePage === "explore"}>Explore</NavItem>
          <NavItem href="/drafts" icon={<FileDiff size={16} />} active={activePage === "drafts"}>Drafts</NavItem>
          <NavItem href="/bookmarks" icon={<Bookmark size={16} />} active={activePage === "bookmarks"}>Bookmarks</NavItem>
          <NavItem href="/dashboard" icon={<BarChart2 size={16} />} active={activePage === "dashboard"}>Dashboard</NavItem>
          <NavItem href="/search" icon={<Search size={16} />} active={activePage === "search"}>Search</NavItem>
          <NavItem href="/history" icon={<History size={16} />} active={activePage === "history"}>History</NavItem>
          <NavItem href="/leaderboard" icon={<Trophy size={16} />} active={activePage === "leaderboard"}>Leaderboard</NavItem>
          <NavItem href="/messages" icon={<MessageSquare size={16} />} active={activePage === "messages"}>Messages</NavItem>
          <NavItem href="/settings" icon={<Settings size={16} />} active={activePage === "settings"}>Settings</NavItem>

          <div className="mt-4 px-2">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Your Blogs</h4>
            {userBlogs.length > 0 ? (
              userBlogs.map((blog) => (
                <FolderItem key={blog.id} href={`/blog/${blog.id}`}>
                  {blog.title.length > 20 ? blog.title.slice(0, 20) + "..." : blog.title}
                </FolderItem>
              ))
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic py-2 px-4 text-center text-sm">Draft and Dock a Blog.</p>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;