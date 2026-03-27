import { Coffee, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#1f1f23] bg-[#0a0a0b] text-zinc-500 px-6 py-8 text-sm z-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-6">

          {/* About Me */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-zinc-300 font-headline">Resources</h3>
            <div className="flex flex-col gap-2 text-zinc-500">
              <a href="/my-story" className="hover:text-[#00e5ff] transition-colors text-sm">My Story</a>
              <a href="/contact" className="hover:text-[#00e5ff] transition-colors text-sm">Contact</a>
              <a
                href="https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#00e5ff] transition-colors text-sm"
              >
                API Docs
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-zinc-300 font-headline">Quick Links</h3>
            <div className="flex flex-col gap-2 text-zinc-500">
              <a href="/create-blog" className="hover:text-[#00e5ff] transition-colors text-sm">Draft a Blog</a>
              <a href="/blogs" className="hover:text-[#00e5ff] transition-colors text-sm">Explore Drafts</a>
              <a
                href="https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#00e5ff] transition-colors text-sm"
              >
                API Docs
              </a>
            </div>
          </div>

          {/* Buy Me a Coffee */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-zinc-300 font-headline">Support</h3>
            <a
              href="https://coff.ee/abhastheain"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 px-4 py-2 rounded-xl transition-all font-medium text-sm"
            >
              <Coffee className="w-4 h-4" />
              Buy Me a Coffee
            </a>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-zinc-300 font-headline">Connect</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com/MistaHolmes/DraftDock"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#1a1a1f] text-zinc-500 hover:text-white hover:bg-[#222228] transition-all border border-[#1f1f23]"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/AbhasBehera1"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#1a1a1f] text-zinc-500 hover:text-[#1da1f2] hover:bg-[#222228] transition-all border border-[#1f1f23]"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/abhash-behera-70b77528b/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#1a1a1f] text-zinc-500 hover:text-[#0a66c2] hover:bg-[#222228] transition-all border border-[#1f1f23]"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#1f1f23] mt-8 pt-6 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} DraftDock.app. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
