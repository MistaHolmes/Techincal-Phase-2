import React from "react";
import { NewHeader } from "./NewHeader";
import { NewSidebar } from "./NewSidebar";
import { Footer } from "../Footer";

interface NewAppShellProps {
  children: React.ReactNode;
  activePage?: string;
  hideSidebar?: boolean;
  hideRightPanel?: boolean;
  hideFooter?: boolean;
  rightPanelContent?: React.ReactNode;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  showSearch?: boolean;
}

export const NewAppShell: React.FC<NewAppShellProps> = ({
  children,
  activePage,
  hideSidebar = false,
  hideRightPanel = false,
  hideFooter = false,
  rightPanelContent,
  searchTerm,
  setSearchTerm,
  showSearch = true,
}) => {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col font-body text-zinc-200">
      {/* Fixed Header */}
      <NewHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearch}
      />

      {/* Body: Sidebar + Main + Right Panel */}
      <div className="flex flex-1 pt-[4rem]">
        {/* Left Sidebar */}
        {!hideSidebar && (
          <div className="hidden md:block flex-shrink-0">
            <NewSidebar activePage={activePage} />
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 min-w-0 flex flex-col ${
            hideFooter ? "h-[calc(100vh-4rem)] overflow-hidden" : "min-h-[calc(100vh-4rem)]"
          }`}
        >
          <div className={hideFooter ? "h-full" : "flex-1"}>{children}</div>
        </main>

        {/* Right Sidebar / Panel */}
        {!hideRightPanel && (
          <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-[4rem] h-[calc(100vh-4rem)] overflow-y-auto border-l border-[#1f1f23] p-6 bg-[#0d0d0f]/50">
            {rightPanelContent || (
              <div className="space-y-8">
                {/* Upgrade Card */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-[#00e5ff]/10 to-[#00ff88]/5 border border-[#00e5ff]/20 glow-cyan">
                  <h4 className="font-headline text-lg font-bold mb-2 text-white">
                    Upgrade to Dock Elite
                  </h4>
                  <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                    Early access to premium drafts, and help build the future of
                    the Dock.
                  </p>
                  <button className="w-full py-3 btn-neon rounded-xl text-xs font-bold uppercase tracking-widest">
                    Get Started
                  </button>
                </div>

                {/* Trending on DraftDock */}
                <div className="surface-card p-5">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-4">
                    Trending on DraftDock
                  </h5>
                  <div className="space-y-4">
                    {[
                      "How AI is changing the landscape of decentralized blogging in 2026.",
                      "Why Rust is becoming the go-to language for system-level WASM.",
                      "The rise of modular monoliths in modern architecture.",
                    ].map((title, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-2xl font-bold text-zinc-700 font-headline">
                          0{i + 1}
                        </span>
                        <div>
                          <h6 className="text-sm font-semibold text-zinc-300 line-clamp-2">
                            {title}
                          </h6>
                          <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">
                            5 min read
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Sidebar */}
      {!hideSidebar && (
        <div className="md:hidden">
          <NewSidebar activePage={activePage} />
        </div>
      )}

      {/* Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
};

export default NewAppShell;
