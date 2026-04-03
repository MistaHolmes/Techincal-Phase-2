import { Coffee, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/50 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-gray-100 px-6 py-8 text-sm z-10 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-6">

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-800">Resources</h3>
            <div className="flex flex-col gap-2">
              <a href="/my-story" className="text-gray-700 hover:text-gray-900 transition-colors">My Story</a>
              <a href="/contact" className="text-gray-700 hover:text-gray-900 transition-colors">Contact</a>
              <a
                href="https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-800">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <a href="/create-blog" className="text-gray-700 hover:text-gray-900 transition-colors">Draft a Blog</a>
              <a href="/blogs" className="text-gray-700 hover:text-gray-900 transition-colors">Explore Drafts</a>
              <a
                href="https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-800">Support</h3>
            <a
              href="https://coff.ee/abhastheain"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-md transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <Coffee className="w-4 h-4" />
              Buy Me a Coffee
            </a>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-800">Connect</h3>
            <div className="flex gap-4">
              <a
                href="https://github.com/MistaHolmes/DraftDock"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/AbhasBehera1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/abhash-behera-70b77528b/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-200/50 mt-8 pt-6 text-center text-xs text-slate-600 dark:text-slate-300">
          &copy; {new Date().getFullYear()} DraftDock.app. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
