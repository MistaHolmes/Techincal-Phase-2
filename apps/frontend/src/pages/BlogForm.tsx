import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import axios from "axios";
import BlogSkeleton from "@/components/BlogSkeleton";
import { Footer } from "@/components/Footer";
import Header2 from "@/components/ui/header2";
import { Image } from "lucide-react";

export function BlogForm() {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { blogId } = useParams<{ blogId?: string }>();
  const isEditMode = !!blogId;

  const [formData, setFormData] = useState({ title: "", content: "", published: true, coverImage: "" });
  const [errors, setErrors] = useState<{ title?: string; content?: string; server?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const API_URL = import.meta.env.VITE_API_URL;

  // If edit mode, fetch existing blog data
  useEffect(() => {
    if (!isEditMode || !blogId) {
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }

    const loadBlog = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_URL}/api/blogs/${blogId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        const blog = res.data;
        setFormData({
          title: blog.title || "",
          content: blog.content || "",
          published: blog.published ?? true,
          coverImage: blog.coverImage || "",
        });
      } catch (err) {
        console.error("Failed to load blog for editing:", err);
      } finally {
        setLoadingExisting(false);
        setTimeout(() => setIsLoaded(true), 100);
      }
    };
    loadBlog();
  }, [blogId]);

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setErrors({});

    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = formData.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    if (!textContent.trim()) {
      setErrors({ content: "Content is required" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const payload = { ...formData, published: !isDraft };

      let response;
      if (isEditMode) {
        response = await axios.put(`${API_URL}/api/blogs/${blogId}`, payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        if (response.status === 200) navigate(`/blog/${blogId}`);
      } else {
        response = await axios.post(`${API_URL}/api/create-blog`, payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        if (response.status === 201) navigate("/blogs");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrors({
        server: axios.isAxiosError(error)
          ? error.response?.data?.message || "Submission failed"
          : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraftSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(e as unknown as React.FormEvent, true);
  };

  const getAnimationStyle = (delay: number) => ({
    opacity: isLoaded ? 1 : 0,
    transform: isLoaded ? "translateY(0)" : "translateY(30px)",
    transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
  });

  if (loadingExisting) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800">
        {isSubmitting ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-3xl space-y-4">
              <BlogSkeleton variant="medium" />
            </div>
          </div>
        ) : (
          <>
            <Header2 />
            <main className="flex flex-col items-center py-6 px-4 md:py-10 md:px-8 bg-white/80 dark:bg-gray-800/80">
              <div className="w-full max-w-4xl bg-muted/20 rounded-lg p-8" style={getAnimationStyle(200)}>
                {/* Mode indicator */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {isEditMode ? "✏️ Editing blog" : "📝 Create new blog"}
                </div>

                {errors.server && (
                  <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md" style={getAnimationStyle(250)}>
                    {errors.server}
                  </div>
                )}

                {/* Title */}
                <div className="border-b border-gray-300 dark:border-gray-600 mb-6" style={getAnimationStyle(300)}>
                  <Textarea
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Blog Title"
                    className="font-serif text-4xl sm:text-5xl md:text-4xl font-semibold text-gray-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-0 resize-none leading-tight h-[70px] sm:h-[90px] md:h-[110px] p-0"
                    aria-invalid={!!errors.title}
                    ref={titleRef}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                {/* Cover Image URL */}
                <div className="mb-6" style={getAnimationStyle(350)}>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Image size={14} />
                    <span>Cover Image URL (optional)</span>
                  </div>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                  />
                  {formData.coverImage && (
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="mt-2 h-28 w-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </div>

                {/* Rich Text Content Editor */}
                <div className="mb-6" style={getAnimationStyle(400)}>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write your blog..."
                    error={!!errors.content}
                  />
                  {errors.content && <p className="text-sm text-red-600 mt-1 ml-1">{errors.content}</p>}
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6" style={getAnimationStyle(500)}>
                  <Button type="button" onClick={() => navigate(-1)} className="w-full sm:w-auto order-3 sm:order-1 transform transition-all duration-200 hover:scale-105">
                    Cancel
                  </Button>
                  {!isEditMode && (
                    <Button type="button" onClick={handleDraftSubmit} disabled={isSubmitting} className="w-full sm:w-auto order-2 transform transition-all duration-200 hover:scale-105">
                      {isSubmitting ? "Saving..." : "Save Draft"}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={isSubmitting}
                    className="bg-black text-white dark:bg-white dark:text-black w-full sm:w-auto order-1 sm:order-3 sm:ml-auto hover:bg-gray-900 dark:hover:bg-gray-100 transform transition-all duration-200 hover:scale-105"
                  >
                    {isSubmitting ? (isEditMode ? "Updating..." : "Publishing...") : (isEditMode ? "Update Blog" : "Publish")}
                  </Button>
                </div>
              </div>
            </main>
            <div className="bg-gray-50 dark:bg-gray-900">
              <Footer />
            </div>
          </>
        )}
      </div>
    </div>
  );
}