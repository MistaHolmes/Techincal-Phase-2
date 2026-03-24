import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import axios from "axios";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { Image, Upload, X as CloseIcon, Tag as TagIcon, Plus, FileDiff, History as HistoryIcon, Sparkles } from "lucide-react";
import AISuggestionPanel from "@/components/editor/AISuggestionPanel";
import ReadabilityMeter from "@/components/editor/ReadabilityMeter";

export function BlogForm() {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { blogId } = useParams<{ blogId?: string }>();
  const isEditMode = !!blogId;

  const [formData, setFormData] = useState({ 
    title: "", 
    content: "", 
    published: true, 
    coverImage: "",
    summary: "",
    tags: [] as string[],
    scheduledAt: ""
  });
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<{ title?: string; content?: string; server?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [autoSaved, setAutoSaved] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const AUTO_SAVE_KEY = "draftdock_autosave";

  // If edit mode, fetch existing blog data
  useEffect(() => {
    if (!isEditMode || !blogId) {
      try {
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed }));
        }
      } catch { /* ignore */ }
      setLoadingExisting(false);
      return;
    }

    const loadBlog = async () => {
      try {
        const token = await getToken();
        if (blogId) {
          const { data } = await axios.get(`${API_URL}/api/blogs/${blogId}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          setFormData({ 
            title: data.title || "", 
            content: data.content || "", 
            published: data.published ?? true, 
            coverImage: data.coverImage || "",
            summary: data.summary || "",
            tags: data.tags?.map((t: any) => t.name) || [],
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : ""
          });
        }
      } catch (err) {
        console.error("Failed to load blog for editing:", err);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadBlog();
  }, [blogId]);

  // Auto-save
  useEffect(() => {
    if (isEditMode) return;
    const interval = setInterval(() => {
      if (formData.title || formData.content) {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, isEditMode]);

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !formData.tags.includes(t)) {
      setFormData({ ...formData, tags: [...formData.tags, t] });
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleDraftSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(e as unknown as React.FormEvent, true);
  };

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
        // Update tags separately if needed or as part of payload
        await axios.put(`${API_URL}/api/blogs/${blogId}/tags`, { tags: formData.tags }, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        
        if (response.status === 200) {
          localStorage.removeItem(AUTO_SAVE_KEY);
          navigate(`/blog/${blogId}`);
        }
      } else {
        response = await axios.post(`${API_URL}/api/blogs`, payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        const newId = response.data.blog.id;
        // Associate tags
        await axios.put(`${API_URL}/api/blogs/${newId}/tags`, { tags: formData.tags }, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });

        if (response.status === 201) {
          localStorage.removeItem(AUTO_SAVE_KEY);
          navigate("/blogs");
        }
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

  if (loadingExisting) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const RightPanelContent = (
    <div className="space-y-6">
      {/* Co-Authors Management */}
      <CoAuthorsPanel blogId={blogId} />

      {/* Version History Toggle */}
      <VersionHistoryPanel blogId={blogId} onRestore={(title, content) => setFormData({ ...formData, title, content })} />

      {/* Readability */}
      <ReadabilityMeter content={formData.content} />

      {/* AI Assistant */}
      <AISuggestionPanel 
        content={formData.content} 
        onTitleSelect={(title) => setFormData({ ...formData, title })}
        onTagsSelect={(tags) => setFormData({ ...formData, tags: [...new Set([...formData.tags, ...tags])] })}
        onSummaryGenerated={(summary) => setFormData({ ...formData, summary })}
      />

      {/* Summary Box */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <FileDiff size={14} /> SEO Summary
        </h3>
        <Textarea 
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          placeholder="Brief summary for social sharing..."
          className="text-sm min-h-[100px] bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-violet-500 resize-none"
        />
      </div>
    </div>
  );

  return (
    <AppShell rightPanelContent={RightPanelContent}>
      <div className="max-w-4xl mx-auto">
        {isSubmitting ? (
          <div className="py-20 text-center space-y-6">
             <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-sm font-black uppercase tracking-widest text-gray-500 animate-pulse">Cooking your stories...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 sm:p-12 shadow-sm"
          >
            {/* Meta & Status */}
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-violet-600 text-white rounded-full shadow-lg shadow-violet-200 dark:shadow-none">
                  {isEditMode ? "Editing Mode" : "Creative Mode"}
                </span>
                {autoSaved && (
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-green-500 tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                    Auto-saved
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                   const win = window.open("", "_blank");
                   win?.document.write(`<html><head><title>Preview: ${formData.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:20px;} img{max-width:100%;border-radius:12px;} h1{font-size:3rem;margin-bottom:10px;}</style></head><body><h1>${formData.title}</h1>${formData.coverImage ? `<img src="${formData.coverImage}">` : ""}<hr>${formData.content}</body></html>`);
                   win?.document.close();
                }} className="bg-gray-50 dark:bg-gray-900 text-xs font-bold text-violet-600 hover:bg-violet-50 rounded-xl px-6">Preview</Button>
                <Button onClick={() => navigate(-1)} className="bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-6">Cancel</Button>
              </div>
            </div>

            {errors.server && (
              <div className="mb-10 p-6 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-3xl text-sm font-medium">
                {errors.server}
              </div>
            )}

            {/* Title Section */}
            <div className="mb-10">
              <Textarea
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="The Next Great Story Starts Here..."
                className="font-headline text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-0 resize-none leading-tight min-h-[120px] p-0 shadow-none overflow-hidden placeholder:text-gray-200 dark:placeholder:text-gray-700"
                ref={titleRef}
              />
              {errors.title && <p className="text-xs text-rose-500 font-bold mt-2 uppercase tracking-widest">{errors.title}</p>}
            </div>

            {/* Dynamic Tags */}
            <div className="mb-10 space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <TagIcon size={14} /> Topic Tags
              </div>
              <div className="flex flex-wrap gap-3">
                {formData.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold border border-gray-100 dark:border-gray-700 transition hover:bg-white hover:shadow-md">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-rose-500 transition">
                      <CloseIcon size={14} />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 transition focus-within:bg-white focus-within:border-violet-400">
                   <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                    placeholder="Add..."
                    className="w-20 bg-transparent border-0 focus:ring-0 text-xs font-bold p-0"
                   />
                   <button onClick={() => addTag(newTag)}><Plus size={14} className="text-violet-500" /></button>
                </div>
              </div>
            </div>

            {/* Premium Cover Image Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  <Image size={14} /> Visual Cover
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={async () => {
                      if (!formData.title && !formData.content) return alert("Write something first!");
                      setIsSubmitting(true);
                      try {
                        const token = await getToken();
                        const res = await axios.post(`${API_URL}/api/ai/generate-image`, { 
                          prompt: formData.title || formData.content.slice(0, 100) 
                        }, { headers: { Authorization: `Bearer ${token}` } });
                        setFormData({ ...formData, coverImage: res.data.imageUrl });
                      } finally { setIsSubmitting(false); }
                    }} 
                    className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 flex items-center gap-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 px-3 py-1.5 rounded-lg transition"
                  >
                     <Sparkles size={14} /> Magic Generate
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition">Upload</button>
                </div>
              </div>
              
              {formData.coverImage ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group ring-4 ring-white dark:ring-gray-700">
                  <img src={formData.coverImage} alt="Cover" className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button 
                    onClick={() => setFormData({ ...formData, coverImage: "" })}
                    className="absolute top-6 right-6 bg-white/90 dark:bg-gray-800/90 p-3 rounded-2xl text-rose-500 shadow-2xl hover:bg-rose-500 hover:text-white transition-all scale-90 group-hover:scale-100"
                  >
                    <CloseIcon size={20} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/50 hover:border-violet-400 transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                     <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Drop your visual story</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">PNG or JPG (MAX. 5MB)</p>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setFormData({ ...formData, coverImage: reader.result as string });
                  reader.readAsDataURL(file);
                }
              }} />
            </div>

            {/* Rich Editor Integration */}
            <div className="mb-12">
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Once upon a time..."
                error={!!errors.content}
              />
              {errors.content && <p className="text-xs text-rose-500 font-bold mt-4 uppercase tracking-widest">{errors.content}</p>}
            </div>

            {/* Actions & Scheduling */}
            <div className="pt-10 border-t border-gray-50 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
               <div className="space-y-4 w-full md:w-auto">
                  <div className="flex items-center gap-4">
                    {!isEditMode && (
                        <Button 
                          onClick={handleDraftSubmit} 
                          disabled={isSubmitting} 
                          className="bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-white hover:shadow-md rounded-2xl px-8 h-14"
                        >
                          Save Draft
                        </Button>
                    )}
                    <Button 
                      onClick={(e) => {
                        const isScheduled = !!formData.scheduledAt;
                        handleSubmit(e, isScheduled); 
                      }} 
                      disabled={isSubmitting} 
                      className="bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl px-12 h-14 shadow-xl hover:opacity-90 transition-all flex-1 md:flex-none"
                    >
                      {isSubmitting ? "..." : isEditMode ? "Update" : formData.scheduledAt ? "Schedule" : "Launch Post"}
                    </Button>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 w-full md:w-auto">
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!formData.scheduledAt} 
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.checked ? new Date(Date.now() + 86400000).toISOString().slice(0, 16) : "" })}
                        className="w-4 h-4 rounded-md border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Scheduled Launch</span>
                    </label>
                    {formData.scheduledAt && (
                      <input 
                        type="datetime-local" 
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="text-[10px] font-bold p-2 border-none bg-transparent text-gray-900 dark:text-white focus:ring-0"
                      />
                    )}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}

function CoAuthorsPanel({ blogId }: { blogId?: string }) {
  const [coAuthors, setCoAuthors] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCoAuthors = async () => {
    if (!blogId) return;
    try {
      const res = await axios.get(`${API_URL}/api/coauthors/${blogId}/coauthors`);
      setCoAuthors(res.data);
    } catch (err) { console.error(err); }
  };

  const inviteUser = async () => {
    if (!blogId || !inviteEmail) return;
    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${API_URL}/api/coauthors/${blogId}/coauthors`, { inviteeEmail: inviteEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInviteEmail("");
      fetchCoAuthors();
    } catch (err: any) { alert(err.response?.data?.error || "Failed to invite"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (blogId) fetchCoAuthors(); }, [blogId]);

  if (!blogId) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Collaborators</h3>
      <div className="space-y-4 mb-4">
        {coAuthors.map((ca) => (
          <div key={ca.id} className="flex items-center gap-3">
            <img src={ca.user.profilePicture || `https://ui-avatars.com/api/?name=${ca.user.name}`} className="w-8 h-8 rounded-full border border-gray-100" />
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{ca.user.name || ca.user.email}</p>
               <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{ca.status}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="email" 
          value={inviteEmail} 
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Peer's email..."
          className="flex-1 text-[10px] font-bold bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2"
        />
        <button onClick={inviteUser} disabled={loading} className="p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition">
           <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function VersionHistoryPanel({ blogId, onRestore }: { blogId?: string, onRestore: (t: string, c: string) => void }) {
  const [versions, setVersions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchVersions = async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/blogs/${blogId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVersions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveVersion = async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${API_URL}/api/blogs/${blogId}/versions`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVersions();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRestore = async (vId: string) => {
    if (!blogId) return;
    if (!confirm("Are you sure? This will replace your current editor content.")) return;
    try {
      const token = await getToken();
      const res = await axios.post(`${API_URL}/api/blogs/${blogId}/versions/${vId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blog = res.data.blog;
      onRestore(blog.title, blog.content);
      setIsOpen(false);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (isOpen) fetchVersions(); }, [isOpen]);

  if (!blogId) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <HistoryIcon size={14} /> Revisions
        </h3>
        <button onClick={() => setIsOpen(!isOpen)} className="text-[10px] font-black uppercase text-violet-600 hover:underline">
          {isOpen ? "Hide" : "History"}
        </button>
      </div>

      {!isOpen ? (
        <button onClick={saveVersion} disabled={loading} className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-900 text-gray-500 rounded-xl hover:bg-gray-100 transition disabled:opacity-50">
          {loading ? "..." : "Create Snapshot"}
        </button>
      ) : (
        <div className="space-y-3 mt-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {versions.length === 0 ? (
            <p className="text-[10px] text-gray-400 text-center py-4 italic uppercase tracking-widest">Fresh paper. No ghosts.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent hover:border-violet-100 dark:hover:border-violet-900 transition group relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tighter">v{v.version}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase">
                      {new Date(v.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRestore(v.id)}
                    className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase bg-violet-600 text-white px-3 py-1.5 rounded-lg transition-all"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))
          )}
          <button onClick={saveVersion} disabled={loading} className="w-full py-3 text-[9px] font-black uppercase border-2 border-dashed border-gray-100 dark:border-gray-800 text-gray-400 rounded-xl hover:border-violet-400 transition mb-2">
             + New Version
          </button>
        </div>
      )}
    </div>
  );
}