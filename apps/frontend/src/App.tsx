import React, { lazy, Suspense } from "react";
import RequireAuth from "./components/RequireAuth";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import UserBlogs from "./pages/Blogs";
import { BlogForm } from "./pages/BlogForm";
import BlogView from "./pages/BlogView";
import HomeRedirector from "./components/HomeRedirector";
import { MyStory } from "./components/MyStory";
import { Contact } from "./components/Contact";
import ProfileComponent from "./pages/Profile";

// Lazy-loaded new pages
const Explore = lazy(() => import("./pages/Explore"));
const Drafts = lazy(() => import("./pages/Drafts"));
const TagBlogs = lazy(() => import("./pages/TagBlogs"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AuthorProfile = lazy(() => import("./pages/AuthorProfile"));
const Settings = lazy(() => import("./pages/Settings"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirector />} />
          <Route path="/landing" element={<RequireAuth><LandingPage /></RequireAuth>} />
          <Route path="/blogs" element={<RequireAuth><UserBlogs /></RequireAuth>} />
          <Route path="/create-blog" element={<RequireAuth><BlogForm /></RequireAuth>} />
          <Route path="/edit-blog/:blogId" element={<RequireAuth><BlogForm /></RequireAuth>} />
          <Route path="/blog/:blogId" element={<BlogView />} />
          <Route path="/my-story" element={<MyStory />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<ProfileComponent />} />
          {/* New routes */}
          <Route path="/explore" element={<Explore />} />
          <Route path="/drafts" element={<RequireAuth><Drafts /></RequireAuth>} />
          <Route path="/tags/:tagName" element={<TagBlogs />} />
          <Route path="/bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/author/:userId" element={<AuthorProfile />} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
