import React, { lazy, Suspense } from "react";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import UserBlogs from "./pages/Blogs";
import { BlogForm } from "./pages/BlogForm";
import BlogView from "./pages/BlogView";
import HomeRedirector from "./components/HomeRedirector";
import { MyStory } from "./components/MyStory";
import { Contact } from "./components/Contact";

// New revamped components
import {
  NewAppShell,
  NewProfilePage,
  NewDashboardPage,
  NewExplorePage,
  NewBookmarksPage,
  NewHistoryPage,
} from "./components/new-components";

// Lazy-loaded pages (kept for non-revamped routes)
const TagBlogs = lazy(() => import("./pages/TagBlogs"));
const AuthorProfile = lazy(() => import("./pages/AuthorProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SeriesPage = lazy(() => import("./pages/SeriesPage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Messages = lazy(() => import("./pages/Messages"));
const Drafts = lazy(() => import("./pages/Drafts"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUserDetails = lazy(() => import("./pages/admin/UserDetails"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

import { AppShell } from "./components/layout/AppShell";
import { BlogCacheProvider } from "./context/BlogCacheContext";
import { PageCacheProvider } from "./context/PageCacheContext";

const App: React.FC = () => {
  return (
    <PageCacheProvider>
    <BlogCacheProvider>
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirector />} />
          <Route path="/landing" element={<RequireAuth><AppShell hideSidebar hideRightPanel><LandingPage /></AppShell></RequireAuth>} />

          {/* Revamped pages with NewAppShell */}
          <Route path="/blogs" element={<RequireAuth><UserBlogs /></RequireAuth>} />
          <Route path="/explore" element={<NewAppShell activePage="explore"><NewExplorePage /></NewAppShell>} />
          <Route path="/bookmarks" element={<RequireAuth><NewAppShell activePage="bookmarks"><NewBookmarksPage /></NewAppShell></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><NewAppShell activePage="dashboard"><NewDashboardPage /></NewAppShell></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><NewAppShell activePage="history"><NewHistoryPage /></NewAppShell></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><NewAppShell activePage="profile" hideRightPanel><NewProfilePage /></NewAppShell></RequireAuth>} />

          {/* Other pages using NewAppShell */}
          <Route path="/search" element={<NewAppShell activePage="search"><SearchPage /></NewAppShell>} />
          <Route path="/leaderboard" element={<NewAppShell activePage="leaderboard"><Leaderboard /></NewAppShell>} />
          <Route path="/messages" element={<RequireAuth><NewAppShell activePage="messages"><Messages /></NewAppShell></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><NewAppShell activePage="settings"><Settings /></NewAppShell></RequireAuth>} />
          <Route path="/drafts" element={<RequireAuth><Drafts /></RequireAuth>} />

          {/* Workflow Routes */}
          <Route path="/create-blog" element={<RequireAuth><BlogForm /></RequireAuth>} />
          <Route path="/edit-blog/:blogId" element={<RequireAuth><BlogForm /></RequireAuth>} />

          {/* Public Views */}
          <Route path="/blog/:blogId" element={<BlogView />} />
          <Route path="/author/:userId" element={<NewAppShell hideRightPanel><AuthorProfile /></NewAppShell>} />
          <Route path="/tags/:tagName" element={<NewAppShell activePage="explore"><TagBlogs /></NewAppShell>} />
          <Route path="/series/:id" element={<NewAppShell activePage="explore"><SeriesPage /></NewAppShell>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/users/:id" element={<RequireAdmin><AdminUserDetails /></RequireAdmin>} />

          {/* static */}
          <Route path="/my-story" element={<MyStory />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </Router>
    </BlogCacheProvider>
    </PageCacheProvider>
  );
};

export default App;
