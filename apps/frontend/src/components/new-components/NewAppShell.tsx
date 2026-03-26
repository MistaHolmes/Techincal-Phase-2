import React from "react";
import { NewHeader } from "./NewHeader";
import { NewSidebar } from "./NewSidebar";
import { Footer } from "../Footer";

interface NewAppShellProps {
  children: React.ReactNode;
  activePage?: string;
  hideSidebar?: boolean;
  hideRightPanel?: boolean;
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
  rightPanelContent,
  searchTerm,
  setSearchTerm,
  showSearch = true,
}) => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex flex-col font-body">
      {/* Fixed Header */}
      <NewHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearch}
      />

      {/* Body: Sidebar + Main + Right Panel */}
      <div className="flex flex-1 pt-[4.5rem]">
        {/* Left Sidebar */}
        {!hideSidebar && (
          <div className="hidden md:block flex-shrink-0">
            <NewSidebar activePage={activePage} />
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 min-w-0 min-h-[calc(100vh-4.5rem)] flex flex-col ${
            !hideSidebar ? "" : ""
          }`}
        >
          <div className="flex-1">{children}</div>
        </main>

        {/* Right Sidebar / Panel */}
        {!hideRightPanel && (
          <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-[4.5rem] h-[calc(100vh-4.5rem)] overflow-y-auto border-l border-gray-200/80 dark:border-gray-800/80 p-6 bg-white/50 dark:bg-gray-950/50">
            {rightPanelContent || (
              <div className="space-y-8">
                {/* Upgrade to Dock Elite */}
                <div className="p-6 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl text-white shadow-xl shadow-violet-200/30 dark:shadow-none">
                  <h4 className="font-headline text-xl font-bold mb-2">
                    Upgrade to Dock Elite
                  </h4>
                  <p className="font-body text-xs opacity-90 mb-6 leading-relaxed">
                    Early access to premium drafts, and help build the future of
                    the Dock.
                  </p>
                  <button className="w-full py-3 bg-white text-violet-600 font-label font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                    Get Started
                  </button>
                </div>

                {/* Trending on DraftDock */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">
                    Trending on DraftDock
                  </h5>
                  <div className="space-y-4">
                    {[
                      "How AI is changing the landscape of decentralized blogging in 2026.",
                      "Why Rust is becoming the go-to language for system-level WASM.",
                      "The rise of modular monoliths in modern architecture.",
                    ].map((title, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-2xl font-bold text-gray-200 dark:text-gray-700">
                          0{i + 1}
                        </span>
                        <div>
                          <h6 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                            {title}
                          </h6>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
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
      <Footer />
    </div>
  );
};

export default NewAppShell;
