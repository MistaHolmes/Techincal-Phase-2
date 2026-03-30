/**
 * CollaborativeBlogForm — real-time collaborative blog editor.
 *
 * Routes:
 *  /collab/:blogId       — owner / accepted co-author
 *  /collab/join/:token   — invite-link guest (→ CollabJoinPage → CollabEditor)
 *
 * Features:
 *  - Title editable & synced live across clients via ydoc.getText('title')
 *  - Content synced via TipTap + Hocuspocus (Y.Doc)
 *  - Invite link generation (owner only)
 *  - Publish button (owner only — converts draft to published blog)
 *  - Explicit save button
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditorContent } from '@tiptap/react';
import axios from 'axios';
import { NewAppShell } from '@/components/new-components';
import { CoAuthorPresenceBar } from '@/components/collab/CoAuthorPresenceBar';
import { useCollaboration } from '@/hooks/useCollaboration';
import { ArrowLeft, Wifi, WifiOff, Loader2, BookOpen } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

/** Route: /collab/:blogId */
export function CollaborativeBlogForm() {
  const { blogId } = useParams<{ blogId: string }>();
  if (!blogId) return <div className="p-8 text-center text-red-500">Missing blog ID</div>;
  return <CollabEditor blogId={blogId} />;
}

/** Route: /collab/join/:token */
export function CollabJoinPage() {
  const { token } = useParams<{ token: string }>();
  const [blogId, setBlogId] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/collab/token/${token}`);
        setInfo(data);
        setBlogId(data.blogId);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <NewAppShell activePage="collaborate" hideRightPanel>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </NewAppShell>
    );
  }

  if (error) {
    return (
      <NewAppShell activePage="collaborate" hideRightPanel>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={() => navigate('/collaborate')} className="text-sm text-indigo-500 hover:underline">
            Back to Collaborate
          </button>
        </div>
      </NewAppShell>
    );
  }

  if (!blogId) return null;
  return <CollabEditor blogId={blogId} inviteToken={token} joinInfo={info} />;
}

// ─── Main Collaborative Editor ───────────────────────────────────────────────

interface CollabEditorProps {
  blogId: string;
  inviteToken?: string;
  joinInfo?: any;
}

function CollabEditor({ blogId, inviteToken, joinInfo }: CollabEditorProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [isOwner, setIsOwner] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDone, setPublishDone] = useState(false);

  // ── Yjs-synced title ──────────────────────────────────────────
  const [title, setTitle] = useState('');
  const titleSeeded = useRef(false);

  const {
    editor,
    ydoc,
    status,
    connectedUsers,
    isSaving,
    lastSavedAt,
    save,
    localUser,
  } = useCollaboration({ blogId, inviteToken });

  // Observe Yjs title text for changes from any client
  useEffect(() => {
    if (!ydoc) return;
    const yTitle = ydoc.getText('title');
    const handler = () => setTitle(yTitle.toJSON());
    yTitle.observe(handler);
    setTitle(yTitle.toJSON());
    return () => yTitle.unobserve(handler);
  }, [ydoc]);

  // Fetch blog metadata: seed Yjs title if empty, determine ownership
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const t = await getToken();
        const { data } = await axios.get(`${API_URL}/api/blogs/${blogId}`, {
          headers: { Authorization: `Bearer ${t}` },
          withCredentials: true,
        });

        // isOwner: compare blog author email with current Clerk user email
        const email = user.primaryEmailAddress?.emailAddress;
        setIsOwner(!!email && data.author?.email === email);

        // Seed Yjs title from DB if not yet synced
        if (!titleSeeded.current && ydoc && data.title) {
          const yTitle = ydoc.getText('title');
          if (yTitle.length === 0) {
            yTitle.insert(0, data.title);
          }
          titleSeeded.current = true;
        }
      } catch (err) {
        console.error('Failed to load blog:', err);
      }
    })();
  }, [blogId, user?.id, ydoc]);

  // Start session for the owner on mount
  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      try {
        const t = await getToken();
        await axios.post(`${API_URL}/api/collab/${blogId}/start`, {}, {
          headers: { Authorization: `Bearer ${t}` },
          withCredentials: true,
        });
      } catch {}
    })();
  }, [isOwner, blogId]);

  /** Write title change to Yjs so all clients see it live */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ydoc) return;
    const yTitle = ydoc.getText('title');
    yTitle.delete(0, yTitle.length);
    yTitle.insert(0, e.target.value);
  };

  const generateInviteLink = useCallback(async () => {
    setGeneratingLink(true);
    try {
      const t = await getToken();
      const { data } = await axios.post(
        `${API_URL}/api/collab/${blogId}/invite`,
        { maxUses: 20, expiresInHours: 72 },
        { headers: { Authorization: `Bearer ${t}` }, withCredentials: true },
      );
      setInviteLink(data.link);
    } catch (err) {
      console.error('Failed to generate invite link:', err);
    } finally {
      setGeneratingLink(false);
    }
  }, [blogId, getToken]);

  const publishBlog = useCallback(async () => {
    setPublishing(true);
    try {
      const t = await getToken();
      // Flush latest Yjs state first
      await axios.post(`${API_URL}/api/collab/${blogId}/save`, {}, {
        headers: { Authorization: `Bearer ${t}` },
        withCredentials: true,
      });
      // Publish the blog
      await axios.put(`${API_URL}/api/blogs/${blogId}`, { published: true }, {
        headers: { Authorization: `Bearer ${t}` },
        withCredentials: true,
      });
      setPublishDone(true);
      setTimeout(() => navigate(`/blog/${blogId}`), 1200);
    } catch (err) {
      console.error('Failed to publish blog:', err);
      setPublishing(false);
    }
  }, [blogId, getToken, navigate]);

  return (
    <NewAppShell activePage="collaborate" hideRightPanel hideFooter>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Top bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate('/collaborate')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {status === 'connected' ? (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Wifi size={13} /> Live
              </span>
            ) : status === 'connecting' ? (
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <Loader2 size={13} className="animate-spin" /> Connecting…
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <WifiOff size={13} /> Disconnected
              </span>
            )}

            {isOwner && !publishDone && (
              <button
                onClick={publishBlog}
                disabled={publishing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-80 active:scale-95 transition-all disabled:opacity-60"
              >
                {publishing ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                {publishing ? 'Publishing…' : 'Publish Blog'}
              </button>
            )}
            {publishDone && (
              <span className="text-xs text-green-500 font-semibold">Published! Redirecting…</span>
            )}
          </div>
        </div>

        {/* ── Editable title ────────────────────────────────────── */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Give your blog a title…"
          className="w-full text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-700 mb-4"
        />

        {joinInfo?.creator && (
          <p className="text-sm text-gray-400 mb-4">
            Session by <span className="font-medium text-gray-600 dark:text-gray-300">{joinInfo.creator.name}</span>
          </p>
        )}

        {/* ── Presence bar ──────────────────────────────────────── */}
        <CoAuthorPresenceBar
          connectedUsers={connectedUsers}
          localUser={localUser}
          status={status}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          onSave={save}
          inviteLink={inviteLink}
          onGenerateLink={generateInviteLink}
          isOwner={isOwner}
          generatingLink={generatingLink}
        />

        {/* ── TipTap Editor ─────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
        </div>

        {/* ── Cursor styles ─────────────────────────────────────── */}
        <style>{`
          .collaboration-cursor__caret {
            border-left: 2px solid;
            border-right: none;
            margin-left: -1px;
            pointer-events: none;
            position: relative;
            word-break: normal;
          }
          .collaboration-cursor__label {
            font-size: 10px;
            font-weight: 600;
            font-family: inherit;
            padding: 0.1rem 0.4rem;
            border-radius: 4px 4px 4px 0;
            position: absolute;
            top: -1.4em;
            left: -1px;
            white-space: nowrap;
            color: white;
            user-select: none;
            pointer-events: none;
          }
          .ProseMirror {
            min-height: 400px;
            padding: 1.25rem 1.5rem;
            outline: none;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: "Start writing together…";
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
        `}</style>

      </div>
    </NewAppShell>
  );
}

export default CollaborativeBlogForm;
