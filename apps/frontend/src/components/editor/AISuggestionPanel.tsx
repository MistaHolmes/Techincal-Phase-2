import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, Tag, FileText, BookOpen, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface AISuggestionPanelProps {
  content: string;
  onTitleSelect?: (title: string) => void;
  onTagsSelect?: (tags: string[]) => void;
  onSummaryGenerated?: (summary: string) => void;
}

const AISuggestionPanel = ({ content, onTitleSelect, onTagsSelect, onSummaryGenerated }: AISuggestionPanelProps) => {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [grammar, setGrammar] = useState<any[]>([]);
  const [error, setError] = useState("");

  const callAI = async (endpoint: string, body: any) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/ai/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("AI request failed");
    return res.json();
  };

  const handleSuggestTitles = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("titles"); setError("");
    try {
      const data = await callAI("suggest-titles", { content });
      setTitles(data.titles || []);
    } catch { setError("Failed to get suggestions"); }
    finally { setLoading(null); }
  };

  const handleSuggestTags = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("tags"); setError("");
    try {
      const data = await callAI("suggest-tags", { content });
      setTags(data.tags || []);
    } catch { setError("Failed to get suggestions"); }
    finally { setLoading(null); }
  };

  const handleGenerateSummary = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("summary"); setError("");
    try {
      const data = await callAI("generate-summary", { content });
      setSummary(data.summary || "");
      onSummaryGenerated?.(data.summary);
    } catch { setError("Failed to generate summary"); }
    finally { setLoading(null); }
  };

  const handleCheckGrammar = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("grammar"); setError("");
    try {
      const data = await callAI("grammar-check", { text: content });
      setGrammar(data.suggestions || []);
    } catch { setError("Failed to check grammar"); }
    finally { setLoading(null); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
      >
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-500" />
          AI Assistant
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleSuggestTitles} disabled={!!loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition disabled:opacity-50"
            >
              {loading === "titles" ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Titles
            </button>
            <button onClick={handleSuggestTags} disabled={!!loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition disabled:opacity-50"
            >
              {loading === "tags" ? <Loader2 size={12} className="animate-spin" /> : <Tag size={12} />}
              Tags
            </button>
            <button onClick={handleGenerateSummary} disabled={!!loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition disabled:opacity-50"
            >
              {loading === "summary" ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              Summary
            </button>
            <button onClick={handleCheckGrammar} disabled={!!loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition disabled:opacity-50"
            >
              {loading === "grammar" ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
              Grammar
            </button>
          </div>

          {/* Title Suggestions */}
          {titles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Suggested Titles</p>
              {titles.map((t, i) => (
                <button key={i} onClick={() => onTitleSelect?.(t)}
                  className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-400 transition"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Tag Suggestions */}
          {tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Suggested Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <button key={i} onClick={() => onTagsSelect?.(tags)}
                    className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Generated Summary</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Grammar */}
          {grammar.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Grammar Suggestions</p>
              {grammar.map((g, i) => (
                <div key={i} className="text-xs bg-amber-50 dark:bg-amber-900/10 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                  <span className="line-through text-red-500">{g.original}</span>
                  <span className="text-green-600 dark:text-green-400 ml-1">→ {g.suggestion}</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">{g.reason}</p>
                </div>
              ))}
            </div>
          )}

          {grammar.length === 0 && loading === null && titles.length === 0 && tags.length === 0 && !summary && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2 italic">Click a button above to get AI suggestions</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AISuggestionPanel;
