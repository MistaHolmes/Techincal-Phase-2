import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import {
  Compass,
  FileEdit,
  Bookmark,
  LayoutDashboard,
  History,
  Trophy,
  MessageSquare,
  Settings,
  HelpCircle,
  Plus,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/drafts", icon: FileEdit, label: "Drafts" },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/history", icon: History, label: "History" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/contact", icon: HelpCircle, label: "Support" },
];

interface NewSidebarProps {
  activePage?: string;
}

export const NewSidebar: React.FC<NewSidebarProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-v2-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-v2-collapsed", String(collapsed));
  }, [collapsed]);

  // Check admin status
  useEffect(() => {
    if (!isLoaded || !user) return;
    const API_URL = import.meta.env.VITE_API_URL;
    axios
      .get(`${API_URL}/api/admin/check`, { withCredentials: true })
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false));
  }, [user, isLoaded]);

  const isActive = (href: string) => {
    const page = href.replace("/", "");
    if (activePage) {
      return activePage === page;
    }
    return location.pathname === href;
  };

  const renderNavItem = (item: NavItem, isActiveItem: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.href}
        onClick={() => {
          navigate(item.href);
          setMobileOpen(false);
        }}
        className={`group flex items-center gap-3 w-full transition-all duration-200 rounded-xl ${
          collapsed ? "justify-center px-3 py-3" : "pl-4 pr-3 py-2.5"
        } ${
          isActiveItem
            ? "text-[#00e5ff] bg-[#00e5ff]/8 border-l-2 border-[#00e5ff] shadow-[inset_0_0_20px_rgba(0,229,255,0.04)]"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
        }`}
      >
        <Icon
          size={20}
          className={`transition-all duration-300 ${
            isActiveItem ? "drop-shadow-[0_0_6px_rgba(0,229,255,0.4)]" : "group-hover:scale-110"
          }`}
          {...(isActiveItem ? { strokeWidth: 2.5 } : {})}
        />
        {!collapsed && (
          <span className={`text-sm tracking-tight ${isActiveItem ? "font-bold" : "font-medium"}`}>
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-20 left-4 z-[80] p-2.5 bg-[#111113] rounded-xl shadow-lg border border-[#1f1f23]"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5 text-zinc-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[75] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#0d0d0f] h-[calc(100vh-4rem)] fixed left-0 top-[4rem] flex flex-col py-6 px-3 z-[60] transition-all duration-300 overflow-y-auto border-r border-[#1f1f23] ${
          collapsed ? "w-[72px]" : "w-56"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:sticky md:top-[4rem]`}
      >
        {/* Brand subtitle */}
        {!collapsed && (
          <div className="mb-5 px-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
              The Technical Editorial
            </p>
          </div>
        )}

        {/* New Post Button */}
        <button
          onClick={() => navigate("/create-blog")}
          className={`mb-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 gradient-border ${
            collapsed ? "mx-1 p-3" : "mx-1 py-3 px-6"
          } text-[#00e5ff] hover:text-white hover:bg-[#00e5ff]/10`}
        >
          <Plus size={18} />
          {!collapsed && <span className="text-sm">New Post</span>}
        </button>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => renderNavItem(item, isActive(item.href)))}

          {/* Admin link */}
          {isAdmin && renderNavItem(
            { href: "/admin", icon: Shield, label: "Admin" },
            isActive("/admin")
          )}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-6 border-t border-[#1f1f23] space-y-0.5">
          {BOTTOM_ITEMS.map((item) => renderNavItem(item, isActive(item.href)))}

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-full py-2 mt-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-white/[0.03]"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* User info */}
          {user && (
            <div className={`mt-4 flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-3 w-full group"
              >
                <img
                  src={
                    user.imageUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-lg border border-[#1f1f23] object-cover flex-shrink-0 group-hover:border-[#00e5ff]/30 transition-all"
                />
                {!collapsed && (
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-sm font-semibold text-zinc-200 truncate">
                      {user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}
                    </span>
                    <span className="text-[10px] text-zinc-600 truncate">
                      {user.emailAddresses?.[0]?.emailAddress || "Pro Account"}
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Close button for mobile */}
        <button
          className="md:hidden absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
          onClick={() => setMobileOpen(false)}
        >
          <X size={20} />
        </button>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-[#0a0a0b]/90 backdrop-blur-xl border-t border-[#1f1f23]">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                  active
                    ? "text-[#00e5ff]"
                    : "text-zinc-600"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default NewSidebar;
