import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Search, Sun, Moon, Plus, Menu, X, Zap } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { Notifications } from "../Notifications";

interface NewHeaderProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  showSearch?: boolean;
}

export const NewHeader: React.FC<NewHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  showSearch = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [localSearch, setLocalSearch] = useState(searchTerm || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    setSearchTerm?.(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localSearch.trim()) {
      navigate(`/explore?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const navItems = [
    { label: "Explore", href: "/explore" },
    { label: "Drafts", href: "/drafts" },
    { label: "My Profile", href: "/profile" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed top-0 w-full z-[100] bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="flex justify-between items-center px-6 py-3.5 w-full">
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-10">
          <button
            onClick={() => navigate("/blogs")}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e5ff] to-[#00ff88] flex items-center justify-center">
              <Zap size={16} className="text-[#0a0a0b]" fill="#0a0a0b" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-headline">
              DraftDock
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-[#00e5ff] bg-[#00e5ff]/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-3">
          {/* Search bar (desktop) */}
          {showSearch && (
            <div className="hidden sm:flex bg-[#1a1a1f] px-4 py-2 rounded-xl items-center gap-2 border border-[#1f1f23] focus-within:border-[#00e5ff]/30 focus-within:shadow-[0_0_20px_rgba(0,229,255,0.08)] transition-all duration-300">
              <Search className="text-zinc-500 w-4 h-4" />
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-48 text-zinc-200 placeholder:text-zinc-600 font-body"
                placeholder="Search insights..."
                type="text"
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-zinc-500 hover:text-[#00e5ff] hover:bg-[#1a1a1f] transition-all duration-200"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {/* Notifications */}
          <Notifications />

          {/* Write button */}
          <button
            onClick={() => navigate("/create-blog")}
            className="hidden sm:flex btn-neon px-5 py-2.5 rounded-xl text-sm items-center gap-2 active:scale-95"
          >
            <Plus size={16} />
            Write
          </button>

          {/* Profile avatar */}
          {user && (
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-[#1f1f23] hover:ring-[#00e5ff]/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,229,255,0.15)]"
            >
              <img
                src={
                  user.imageUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a0b] px-6 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                navigate(item.href);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "text-[#00e5ff] bg-[#00e5ff]/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {item.label}
            </button>
          ))}
          {showSearch && (
            <div className="flex bg-[#1a1a1f] px-4 py-2 rounded-xl items-center gap-2 mt-3 border border-[#1f1f23]">
              <Search className="text-zinc-500 w-4 h-4" />
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm flex-1 text-zinc-200 placeholder:text-zinc-600"
                placeholder="Search insights..."
                type="text"
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default NewHeader;
