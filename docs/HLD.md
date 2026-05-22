# System High-Level Design (HLD)

This document provides a comprehensive High-Level Design (HLD) for the **DraftDock** (Collaborative Blogging Platform) and **DockStudio** (Browser-based Web IDE) applications.

---

## 1. DraftDock: Collaborative Blogging Platform

DraftDock is a feature-rich, real-time collaborative blogging platform. It allows multiple users to edit the same document simultaneously, provides robust AI integrations for content generation, and includes a full suite of social, monetization, and analytics tools.

### 1.1 Architecture Overview

The architecture follows a client-server model optimized for real-time state synchronization using **CRDTs (Conflict-free Replicated Data Types)** via **Yjs**, alongside a comprehensive REST API for standard CRUD operations.

### 1.2 Comprehensive Feature Set

**Frontend (React/Vite & Tailwind CSS)**
*   **Rich Text & Collaboration:** Headless Tiptap editor with Yjs for real-time multiplayer editing (`CollaboratePage`, `CollaborativeBlogForm`).
*   **Content Discovery:** Explore feeds, Tag-based navigation, Series/Collections, and Author profiles.
*   **Social & Engagement:** User-to-user messaging, commenting, liking, highlighting text, and following authors.
*   **User Dashboard:** Personal drafts management, reading history, and saved bookmarks.
*   **Analytics:** Visual data representation using `Recharts` for author metrics.
*   **Gamification:** Leaderboards and achievement tracking.
*   **Monetization:** Pricing pages and subscription management via Stripe (`@stripe/react-stripe-js`).
*   **AI Tools:** Integrated AI writing assistants using `@ai-sdk/openai`.
*   **Admin Panel:** Administrative moderation tools.

**Backend (Node.js/Express & Prisma)**
*   **Real-time Server:** `Hocuspocus` WebSocket server managing Yjs client connections and resolving CRDT conflicts.
*   **RESTful API Routes:** Extensive endpoints covering `users`, `blogs`, `comments`, `likes`, `follows`, `messaging`, `notifications`, `bookmarks`, `highlights`, `analytics`, `series`, `tags`, and `achievements`.
*   **Authentication:** `Clerk` middleware securing API routes and managing user identity.
*   **AI Integration:** `ai.ts` handling secure communication with OpenAI and Google Gemini APIs.
*   **Communication Layer:** `Nodemailer` integration for transactional emails and in-app notifications.
*   **Database:** Relational data modeling via Prisma (connecting to PostgreSQL), tracking complex relationships like co-authorship.
*   **Caching/Scaling:** Redis for pub/sub (scaling Hocuspocus across instances) and rate limiting.

### 1.3 Deep Dive: Real-time Collaboration Engine

The Collaboration engine is a crucial component of DraftDock, allowing multiple users to edit the same blog draft simultaneously without conflicts.

**1. Authentication & Access Control**
*   **Dedicated Server (`apps/backend/src/lib/collabServer.ts`)**: The Hocuspocus WebSocket server runs on a dedicated port (3002).
*   **Two-Tier Authentication**:
    1.  **Clerk JWT**: Registered users authenticate via their Clerk token. The system verifies if they are the blog's author or an explicitly invited "Accepted Co-author".
    2.  **Invite Tokens**: Guest users can join via a shareable invite link (e.g., `/collab/join/:token`). These tokens have strict max-usage limits, expiration dates, and revocation capabilities enforced at the WebSocket connection layer.
*   **Awareness & Presence**: Integrates seamlessly with Yjs Awareness to broadcast cursor positions, text selections, and user identities (names/avatars) to all participants in the room. Real-time notifications are instantly pushed to the blog owner whenever someone joins their session.

**2. State Synchronization (Yjs CRDT)**
*   Instead of passing raw text strings, the Tiptap editor generates binary state vectors representing incremental changes using the **Yjs CRDT** algorithm.
*   The Hocuspocus provider (`apps/frontend/src/pages/CollaboratePage.tsx`) streams these binary updates over WebSockets.
*   The server receives these updates and mathematically merges them. CRDTs guarantee that all connected clients eventually reach the exact same document state regardless of network latency, disconnects, or concurrent edits.

**3. Multi-Tier Persistence Strategy**
To balance extreme performance with data safety, the collaboration engine uses three layers of persistence:
*   **Layer 1 - In-Memory / Redis (Hot Cache)**: As users type, the `Y.Doc` (binary representation of the document) is constantly written to Redis (`collab:ydoc:${blogId}`). This allows near-instant document recovery if the server restarts or a client drops and reconnects. Active session states (`collab:active:${blogId}`) are also tracked here.
*   **Layer 2 - PostgreSQL Binary Store (Warm Storage)**: The binary `ydocState` is periodically flushed to the Prisma PostgreSQL database. This ensures long-term preservation of the collaborative editing history, which enables features like "undo" across different sessions.
*   **Layer 3 - Plain Markdown & Snapshots (Cold Storage)**: When a session ends or a manual save is triggered, the server automatically decodes the binary `Y.Doc` back into plain Markdown and saves it to the standard `content` column of the `Blog` table. Concurrently, it generates a race-safe snapshot in the `BlogVersion` table, preserving a historical timeline of the draft for version control.

**4. Real-time Collaboration Network Flow**
```text
┌──────────┐                               ┌───────────────────────┐                                 ┌────────────────────────┐
│ Client 1 │                               │ Server (Node/Express) │                                 │ DB (Postgres & Redis)  │
└────┬─────┘                               └───────────┬───────────┘                                 └───────────┬────────────┘
     │ 1. HTTP POST /collab/start (Auth)               │                                                       │
     │────────────────────────────────────────────────▶│                                                       │
     │                                                 │ 2. Verify Clerk Auth & Permissions                    │
     │                                                 │──────────────────────────────────────────────────────▶│
     │ 3. Returns { wsUrl, active: true }              │◀──────────────────────────────────────────────────────│
     │◀────────────────────────────────────────────────│                                                       │
     │                                                 │                                                       │
     │ 4. ws:// connect to wsUrl (Token)               │                                                       │
     │════════════════════════════════════════════════▶│                                                       │
     │                                                 │ 5. GET `collab:ydoc:id` (Hot Cache check)             │
     │                                                 │──────────────────────────────────────────────────────▶│
     │                                                 │ 6. Returns Cached Y.Doc or Fallback to Postgres       │
     │                                                 │◀──────────────────────────────────────────────────────│
     │ 7. Initial Y.Doc Sync (Binary Payload)          │                                                       │
     │◀════════════════════════════════════════════════▶                                                       │
     │                                                 │                                                       │
     │ 8. User types (Y.Doc Delta)                     │                                                       │
     │════════════════════════════════════════════════▶│                                                       │
     │                                                 │ 9. SET `collab:ydoc:id` (Update Hot Cache)            │
     │                                                 │──────────────────────────────────────────────────────▶│
     │                                                 │                                                       │
     │ 10. Broadcast Delta to other Clients            │                                                       │
     │   (Server pushes to Client 2, etc.)             │                                                       │
     │                                                 │                                                       │
     │                                                 │ 11. Periodic Flush (Save Binary to Postgres)          │
     │                                                 │──────────────────────────────────────────────────────▶│
```


### 1.4 High-Level Textual Architecture Diagram

```text
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                       CLIENT LAYER (React / Vite / Tailwind)                                       ║
║                                                                                                                    ║
║  ┌──────────────────────────────┐   ┌───────────────────────────────────┐   ┌───────────────────────────────────┐  ║
║  │       USER ENGAGEMENT        │   │      REAL-TIME COLLABORATION      │   │        CORE PLATFORM UI           │  ║
║  │ - Messaging Interface        │   │ - Tiptap Rich Text Editor         │   │ - Dashboard & Profile             │  ║
║  │ - Comments, Likes, Follows   │   │ - Yjs Document State (CRDT)       │   │ - Recharts Analytics Charts       │  ║
║  │ - Notifications Dropdown     │   │ - Awareness (Cursors/Identities)  │   │ - Stripe Subscriptions            │  ║
║  │ - Leaderboard & Badges       │   │ - Hocuspocus WebSocket Provider   │   │ - Admin Moderation Panel          │  ║
║  └──────────────┬───────────────┘   └─────────────────┬─────────────────┘   └─────────────────┬─────────────────┘  ║
║                 │ HTTP / REST                         │ WebSockets (ws://)                    │ HTTP / REST        ║
╚═════════════════╪═════════════════════════════════════╪═══════════════════════════════════════╪════════════════════╝
                  │                                     │                                       │
                  ▼                                     ▼                                       ▼
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      SERVER LAYER (Node.js / Express / Prisma)                                     ║
║                                                                                                                    ║
║   [ Clerk Middleware ] ──► Validates JWTs & Enforces Roles (Author vs. Co-author vs. Guest)                        ║
║                                                                                                                    ║
║  ┌──────────────────────────────┐   ┌───────────────────────────────────┐   ┌───────────────────────────────────┐  ║
║  │      RESTFUL API ROUTES      │   │       REAL-TIME COLLAB SERVER     │   │        INTEGRATION LAYER          │  ║
║  │ - /blogs, /users, /tags      │   │ - Hocuspocus Server (Port 3002)   │   │ - AI Services (OpenAI & Gemini)   │  ║
║  │ - /comments, /likes, /follow │   │ - Invite Token Auth & Limits      │   │ - Stripe Payment Webhooks         │  ║
║  │ - /messaging, /analytics     │   │ - Yjs CRDT Conflict Resolution    │   │ - Nodemailer (Transactional Email)│  ║
║  └──────────────┬───────────────┘   └─────────────────┬─────────────────┘   └─────────────────┬─────────────────┘  ║
║                 │ Reads / Writes                      │ (1) Hot Cache (2) Binary DB Flush     │ Integrations       ║
╚═════════════════╪═════════════════════════════════════╪═══════════════════════════════════════╪════════════════════╝
                  │                                     │                                       │
                  ▼                                     ▼                                       ▼
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        DATA PERSISTENCE & EXTERNAL SERVICES                                        ║
║                                                                                                                    ║
║  ┌──────────────────────────────┐   ┌───────────────────────────────────┐   ┌───────────────────────────────────┐  ║
║  │     POSTGRESQL (Prisma)      │   │         REDIS (In-Memory)         │   │          EXTERNAL APIs            │  ║
║  │ - Users, Blogs, Metrics      │   │ - `collab:ydoc:*` (Hot Y.Doc)     │   │ - Clerk (Identity Management)     │  ║
║  │ - `ydocState` (Binary Store) │   │ - `collab:active:*` (Sessions)    │   │ - Stripe (Payment Processing)     │  ║
║  │ - `BlogVersion` (History)    │   │ - Pub/Sub for Server Scaling      │   │ - LLMs (Content Generation)       │  ║
║  └──────────────────────────────┘   └───────────────────────────────────┘   └───────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. DockStudio: Browser-based Web IDE

DockStudio is a fully functional web-based IDE that runs entirely in the user's browser, allowing users to write, run, and preview full-stack Node.js applications without a cloud backend.

### 2.1 Architecture Overview

DockStudio leverages the **WebContainers API** to boot a micro-operating system inside a WebAssembly (Wasm) environment directly in the browser.

### 2.2 Deep Dive: WebContainer Architecture

DockStudio is completely serverless from a compute perspective. The entire Node.js runtime executes directly inside the user's browser tab.

**1. The Virtual File System (VFS) & Editor Sync**
*   **Monaco Editor (`CodeEditor.tsx`)**: The UI uses the same editor engine as VS Code. As the user types, an `onChange` handler debounces the keystrokes and writes the updated string directly to the WebContainer's in-memory Virtual File System (VFS).
*   **Instant State**: Because the VFS lives in the browser's RAM, file read/write operations are nearly instantaneous. There are no network latency penalties for saving a file, unlike traditional cloud IDEs.

**2. Terminal & Process Execution**
*   **xterm.js (`PrettyTerminal.tsx`)**: The terminal UI is driven by `xterm.js`. When a user types a command (e.g., `npm install`), the raw string is piped to the WebContainer's `spawn` API.
*   **WebAssembly Node.js**: The WebContainer API boots a WebAssembly-compiled version of Node.js. It natively parses `package.json` and fetches dependencies directly from the public NPM registry using the browser's native network stack.
*   **Piped Streams**: The `stdout` and `stderr` streams of the WebContainer processes are piped directly back to `xterm.js`, providing real-time visual feedback (and parsing features like colored Vite ready-states).

**3. The Dev Server & Service Worker Interceptor**
*   When a user runs a dev server command (e.g., `npm run dev`), the WebContainer starts the server process and attempts to bind to a local port (e.g., `5173`).
*   Instead of opening a real TCP port, the WebContainer's internal network layer intercepts this binding and registers it.
*   A **Service Worker** acts as a reverse proxy. When the **Preview Iframe** attempts to load the generated local URL, the Service Worker intercepts the `fetch` event, passes the HTTP request to the WebContainer's bound process, and returns the generated HTML/JS. No backend server is ever involved in the preview rendering.

### 2.3 High-Level Textual Architecture Diagram

```text
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        BROWSER ENVIRONMENT (Next.js App Router)                                    ║
║                                                                                                                    ║
║  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │                                             USER INTERFACE (UI)                                              │  ║
║  │                                                                                                              │  ║
║  │  ┌───────────────────────────┐      ┌───────────────────────────┐      ┌──────────────────────────────┐      │  ║
║  │  │   Monaco Editor (IDE)     │      │   xterm.js (Terminal)     │      │   Preview Iframe (App)       │      │  ║
║  │  │   [Code Editing Window]   │      │   [CLI Input & Output]    │      │   [Renders Localhost URL]    │      │  ║
║  │  └────────────┬──────────────┘      └────────────┬──────────────┘      └───────────────┬──────────────┘      │  ║
║  │               │ Debounced Writes                 │ Stdin/Stdout Streams                │ HTTP Requests       │  ║
║  └───────────────┼──────────────────────────────────┼─────────────────────────────────────┼─────────────────────┘  ║
║                  │                                  │                                     │                        ║
║                  ▼                                  ▼                                     │                        ║
║  ┌────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────┐  ║
║  │                              WEBCONTAINER (WebAssembly Micro-OS)                       │                     │  ║
║  │                                                                                        │                     │  ║
║  │  ┌───────────────────────────┐      ┌───────────────────────────┐                      │                     │  ║
║  │  │ Virtual File System (VFS) │◄──── │ Virtual Node.js Runtime   │                      │                     │  ║
║  │  │ (In-Memory File Storage)  │      │ (Executes 'npm run dev')  │                      │                     │  ║
║  │  └───────────────────────────┘      └────────────┬──────────────┘                      │                     │  ║
║  │                                                  │ Spawns                              │                     │  ║
║  │                                                  ▼                                     │                     │  ║
║  │                                     ┌───────────────────────────┐                      │                     │  ║
║  │                                     │    Dev Server Process     │                      │                     │  ║
║  │                                     │    (Binds to port 5173)   │                      │                     │  ║
║  │                                     └────────────┬──────────────┘                      │                     │  ║
║  │                                                  │ Port Binding                        ▼                     │  ║
║  │                                                  ▼                      ┌──────────────────────────────┐     │  ║
║  │                                     ┌───────────────────────────┐       │       Service Worker         │     │  ║
║  │                                     │    Network Interceptor    │◄──────┤  (Intercepts Preview URL &   │     │  ║
║  │                                     │  (Traps HTTP connection)  │       │   proxies to Dev Server)     │     │  ║
║  │                                     └───────────────────────────┘       └──────────────────────────────┘     │  ║
║  └──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════╦═════════════════════════════════════════════════════════════════════════╝
                                           ║ Network fetch for NPM packages
                                           ▼
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                              EXTERNAL CLOUD SERVICES                                               ║
║                                                                                                                    ║
║      ┌─────────────────────────────────┐                       ┌─────────────────────────────────┐                 ║
║      │   NPM Registry (npmjs.com)      │                       │   Clerk (Authentication)        │                 ║
║      │   [Provides Package Tarballs]   │                       │   [JWT & User Identity]         │                 ║
║      └─────────────────────────────────┘                       └─────────────────────────────────┘                 ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 2.4 Data Flow in DockStudio

1.  **Code Editing**: When a user types in `Monaco Editor`, the changes are debounced and written directly to the WebContainer's Virtual File System (VFS).
2.  **Command Execution**: When the user runs `npm install` in the terminal, the command is passed to the WebContainer, which reaches out to the external NPM registry to download packages into the VFS.
3.  **App Preview**:
    *   The user runs `npm run dev`.
    *   The WebContainer starts a Node process and attempts to bind to a port.
    *   A Service Worker intercepts this port binding.
    *   The `Preview Iframe` requests a special local URL. The Service Worker catches this request and fulfills it using the active dev server running inside the Wasm environment, all without the request ever leaving the browser.

**WebContainer Local Network Flow**
```text
┌───────────────┐                  ┌─────────────────────┐                   ┌────────────────┐                   ┌────────────────┐
│ Monaco Editor │                  │ WebContainer (Wasm) │                   │ Service Worker │                   │ Preview Iframe │
└───────┬───────┘                  └──────────┬──────────┘                   └────────┬───────┘                   └────────┬───────┘
        │                                     │                                       │                                    │
        │ 1. User types `npm run dev`         │                                       │                                    │
        │────────────────────────────────────▶│                                       │                                    │
        │                                     │ 2. Boots Node.js Runtime              │                                    │
        │                                     │    & Binds port 5173                  │                                    │
        │                                     │──────────────────────────────────────▶│                                    │
        │                                     │                                       │ 3. Registers Interceptor           │
        │                                     │                                       │    for local preview URL           │
        │                                     │                                       │                                    │
        │                                     │                                       │ 4. HTTP GET /app                   │
        │                                     │                                       │◀───────────────────────────────────│
        │                                     │ 5. Proxies Request internally         │                                    │
        │                                     │◀──────────────────────────────────────│                                    │
        │                                     │                                       │                                    │
        │                                     │ 6. Node returns HTML/JS bundle        │                                    │
        │                                     │──────────────────────────────────────▶│                                    │
        │                                     │                                       │ 7. Serves response to Iframe       │
        │                                     │                                       │───────────────────────────────────▶│
```




# DockStudio — Interview Architecture Diagrams

## 1. Executive System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         DOCKSTUDIO PLATFORM                                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                      ┌─────────────────────────────┐
                                      │         END USER           │
                                      │  Writes & Runs Fullstack   │
                                      │       Apps in Browser      │
                                      └──────────────┬─────────────┘
                                                     │
                                                     ▼

┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      FRONTEND LAYER (NEXT.JS 14)                                            │
│                                                                                                              │
│  ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌───────────────────────────┐  │
│  │   Monaco Editor    │   │   xterm.js CLI     │   │  Preview Iframe    │   │  Project Dashboard UI    │  │
│  │  VSCode-like IDE   │   │ Terminal Emulator  │   │  Live Application  │   │  Tasks / Files / Plans   │  │
│  └─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘   └───────────────────────────┘  │
│            │                        │                        │                                             │
└────────────┼────────────────────────┼────────────────────────┼─────────────────────────────────────────────┘
             │                        │                        │
             ▼                        ▼                        ▼

┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              WEBCONTAINER RUNTIME (BROWSER WASM OS)                                         │
│                                                                                                              │
│  ┌──────────────────────────────┐        ┌────────────────────────────────┐                                 │
│  │  Virtual File System (VFS)  │◄──────►│   WebAssembly Node.js Runtime  │                                 │
│  │  In-memory Project Files    │        │   npm install / npm run dev    │                                 │
│  └──────────────┬──────────────┘        └────────────────┬───────────────┘                                 │
│                 │                                          Spawns                                            │
│                 │                                             │                                               │
│                 ▼                                             ▼                                               │
│       ┌───────────────────────┐                 ┌──────────────────────────────┐                            │
│       │  File Synchronizer    │                 │      Dev Server Process      │                            │
│       │  Debounced Updates    │                 │        localhost:5173        │                            │
│       └───────────────────────┘                 └──────────────┬───────────────┘                            │
│                                                                │                                            │
│                                                                ▼                                            │
│                                                ┌──────────────────────────────┐                            │
│                                                │     Network Interceptor      │                            │
│                                                │  Captures Local Port Bind    │                            │
│                                                └──────────────┬───────────────┘                            │
│                                                               │                                            │
│                                                               ▼                                            │
│                                                ┌──────────────────────────────┐                            │
│                                                │        Service Worker        │                            │
│                                                │  Reverse Proxy for Preview   │                            │
│                                                └──────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                                     │
                                                     ▼

┌──────────────────────────────────────────────┐          ┌───────────────────────────────────────────────────┐
│              LOCAL PERSISTENCE               │          │              EXTERNAL SERVICES                    │
│                                              │          │                                                   │
│  • IndexedDB Workspace Cache                 │          │  • NPM Registry                                  │
│  • Browser Runtime Memory                    │          │  • Clerk Authentication                           │
│  • Session State                             │          │  • Anthropic Claude API                           │
│                                              │          │  • Vercel Hosting                                 │
└──────────────────────────────────────────────┘          └───────────────────────────────────────────────────┘
```

---

# 2. Core Runtime Execution Flow

```text
┌──────────────┐
│ User Types   │
│ Code / Prompt│
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│   Monaco Editor UI   │
│  Debounced onChange  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Virtual File System  │
│  In-memory Writes    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ WebContainer Runtime │
│  WebAssembly NodeJS  │
└──────────┬───────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ▼                             ▼
┌──────────────────────┐      ┌─────────────────────────┐
│ npm install          │      │ npm run dev             │
│ Package Resolution   │      │ Starts Dev Server       │
└──────────┬───────────┘      └──────────┬──────────────┘
           │                             │
           ▼                             ▼
┌──────────────────────┐      ┌─────────────────────────┐
│ Fetches Packages     │      │ Port Binding Intercept  │
│ from NPM Registry    │      │ via Service Worker      │
└──────────────────────┘      └──────────┬──────────────┘
                                          │
                                          ▼
                              ┌─────────────────────────┐
                              │ Preview Iframe          │
                              │ Live Rendered App       │
                              └─────────────────────────┘
```

---

# 3. AI-Powered Project Generation Flow

```text
┌────────────────────┐
│ User Prompt        │
│ "Build a Todo App"│
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────┐
│ Next.js Frontend            │
│ Sends Authenticated Request │
└──────────────┬──────────────┘
               │ JWT Bearer Token
               ▼
┌─────────────────────────────┐
│ FastAPI Backend             │
│ Validates Clerk JWT         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Claude AI Planning Engine   │
│ Generates Structured Plan   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Task + Plan Stored          │
│ PostgreSQL via Prisma       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ User Approves Plan          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Generated Files Written     │
│ into WebContainer VFS       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ npm install + npm run dev   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Live Preview Generated      │
│ Entirely Inside Browser     │
└─────────────────────────────┘
```

---

# 4. Fullstack System Architecture (Interview Version)

```text
                                        ┌────────────────────┐
                                        │      CLIENT        │
                                        │  Next.js Frontend  │
                                        └─────────┬──────────┘
                                                  │
                         ┌────────────────────────┼────────────────────────┐
                         │                        │                        │
                         ▼                        ▼                        ▼
             ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
             │ Monaco Editor    │     │ xterm.js         │     │ Preview Iframe   │
             │ Code Editing     │     │ Shell Runtime    │     │ Live App Output  │
             └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
                      │                        │                        │
                      └────────────────┬───────┴────────────────────────┘
                                       │
                                       ▼
                    ┌────────────────────────────────────────────┐
                    │      WebContainer Browser Runtime          │
                    │                                            │
                    │  • Virtual Filesystem                      │
                    │  • Node.js Runtime (WASM)                  │
                    │  • Process Execution                       │
                    │  • Local Dev Server                        │
                    │  • Service Worker Networking               │
                    └──────────────────┬─────────────────────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                     │                     │
                 ▼                     ▼                     ▼
      ┌─────────────────┐   ┌──────────────────┐   ┌────────────────────┐
      │ NPM Registry    │   │ Clerk Auth       │   │ Anthropic Claude   │
      │ Dependency Pull │   │ JWT Validation   │   │ AI Plan Generation │
      └─────────────────┘   └──────────────────┘   └────────────────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │ FastAPI Backend        │
                          │ Business Logic Layer   │
                          └──────────┬─────────────┘
                                     │
                                     ▼
                          ┌────────────────────────┐
                          │ PostgreSQL Database    │
                          │ Projects / Tasks /     │
                          │ File Versions / Runs   │
                          └────────────────────────┘
```

---

# 5. Authentication + API Flow

```text
┌─────────────┐
│ User Login  │
│ via Clerk   │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Clerk Issues JWT     │
│ Session Token        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Next.js Frontend     │
│ Stores Session       │
└──────────┬───────────┘
           │
           │ Authorization: Bearer <JWT>
           ▼
┌──────────────────────┐
│ FastAPI Backend      │
│ Verifies JWT via     │
│ Clerk JWKS Endpoint  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Authorized API       │
│ Request Processing   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PostgreSQL Database  │
└──────────────────────┘
```

---

# 6. File Versioning + Persistence Flow

```text
┌─────────────────────┐
│ User Edits File     │
│ inside Monaco       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Debounced Save      │
│ Triggered           │
└──────────┬──────────┘
           │
           ├──────────────────────────────┐
           │                              │
           ▼                              ▼
┌─────────────────────┐       ┌──────────────────────────┐
│ Update WebContainer │       │ Persist via FastAPI      │
│ Virtual File System │       │ PUT /projects/:id/files  │
└──────────┬──────────┘       └─────────────┬────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────┐       ┌──────────────────────────┐
│ Vite HMR Reload     │       │ Create File Version      │
│ Updates Preview     │       │ in PostgreSQL            │
└─────────────────────┘       └──────────────────────────┘
```

---

# 7. Deployment Architecture

```text
                           ┌────────────────────┐
                           │      Vercel        │
                           │ Next.js Frontend   │
                           └─────────┬──────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │ Browser WebContainer Runtime   │
                    │ Entire Node Execution Client   │
                    │ Side via WebAssembly           │
                    └────────────────┬───────────────┘
                                     │
             ┌───────────────────────┼────────────────────────┐
             │                       │                        │
             ▼                       ▼                        ▼
   ┌────────────────┐    ┌────────────────────┐    ┌────────────────────┐
   │ FastAPI Server │    │ Clerk Cloud Auth   │    │ Anthropic Claude   │
   │ Business APIs  │    │ JWT + Sessions     │    │ AI Generation      │
   └────────┬───────┘    └────────────────────┘    └────────────────────┘
            │
            ▼
   ┌────────────────┐
   │ PostgreSQL DB  │
   │ Persistent Data│
   └────────────────┘
```

---

# 8. Interview Explanation Strategy

## What makes DockStudio technically interesting

### 1. Browser-Native Execution

Unlike traditional cloud IDEs, DockStudio runs the Node.js runtime directly inside the browser using WebAssembly-powered WebContainers.

### 2. No Remote Compute Server

The application preview is generated locally inside the user's tab. The backend never executes user code.

### 3. Service Worker Reverse Proxy

Instead of opening real TCP ports, WebContainers intercept localhost bindings and proxy requests internally through a Service Worker.

### 4. AI-Driven Development Workflow

Claude generates structured implementation plans which are then converted into executable files and run immediately inside the sandbox.

### 5. Real-Time IDE Experience

Monaco Editor + xterm.js + WebContainer together replicate a lightweight VSCode-like environment entirely in-browser.

---

# 9. Best Diagram To Use In Interviews

If you only show ONE diagram in interviews, use:

1. Executive System Architecture
2. AI-Powered Project Generation Flow
3. Core Runtime Execution Flow

These three together explain:

* frontend architecture
* backend architecture
* browser runtime internals
* AI integration
* execution lifecycle
* deployment model

They are sufficient for most internship and junior SWE interviews.

---

Project references derived from uploaded project documentation:

* Architecture and runtime details fileciteturn0file0L1-L220
* Full implementation architecture and backend flow fileciteturn0file1L1-L1200



<!--  -->
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                              DOCKSTUDIO — COMPLETE SYSTEM ARCHITECTURE                                     ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                   CLIENT LAYER (NEXT.JS 14)                                                 ║
║                                                                                                                              ║
║  ┌────────────────────────────┐   ┌────────────────────────────┐   ┌────────────────────────────┐                          ║
║  │       MONACO EDITOR        │   │       XTERM.JS CLI         │   │      PREVIEW IFRAME        │                          ║
║  │                            │   │                            │   │                            │                          ║
║  │ • VSCode-like IDE          │   │ • Interactive Terminal     │   │ • Live App Rendering       │                          ║
║  │ • Syntax Highlighting      │   │ • npm install              │   │ • localhost Preview        │                          ║
║  │ • Debounced File Writes    │   │ • npm run dev              │   │ • Hot Module Reload        │                          ║
║  │ • Multi-file Workspace     │   │ • Process Streaming        │   │ • Sandboxed Runtime UI     │                          ║
║  └──────────────┬─────────────┘   └──────────────┬─────────────┘   └──────────────┬─────────────┘                          ║
║                 │                                │                                │                                        ║
║                 └────────────────────────────────┼────────────────────────────────┘                                        ║
║                                                  │                                                                         ║
║                                                  ▼                                                                         ║
║                                   ┌──────────────────────────────────────┐                                                  ║
║                                   │      PROJECT DASHBOARD LAYER         │                                                  ║
║                                   │                                      │                                                  ║
║                                   │ • AI Prompt Input                    │                                                  ║
║                                   │ • Generated File Tree                │                                                  ║
║                                   │ • Runtime Controls                   │                                                  ║
║                                   │ • File Explorer                      │                                                  ║
║                                   │ • Terminal Sessions                  │                                                  ║
║                                   │ • Live Runtime State                 │                                                  ║
║                                   └─────────────────┬────────────────────┘                                                  ║
╚═════════════════════════════════════════════════════╪════════════════════════════════════════════════════════════════════════╝
                                                      │
                                                      ▼



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                    BROWSER EXECUTION LAYER (WEBCONTAINER / WASM OS)                                         ║
║                                                                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │                                        WEBCONTAINER RUNTIME                                                             │  ║
║  │                                                                                                                        │  ║
║  │   ┌──────────────────────────┐        ┌────────────────────────────┐                                                   │  ║
║  │   │   VIRTUAL FILE SYSTEM    │◄──────►│   WASM NODE.JS RUNTIME     │                                                   │  ║
║  │   │                          │        │                            │                                                   │  ║
║  │   │ • In-memory FS           │        │ • Node.js via WASM         │                                                   │  ║
║  │   │ • Generated Source Files │        │ • Process Execution         │                                                   │  ║
║  │   │ • package.json Storage   │        │ • npm install              │                                                   │  ║
║  │   │ • Runtime Persistence    │        │ • npm run dev              │                                                   │  ║
║  │   └─────────────┬────────────┘        └──────────────┬─────────────┘                                                   │  ║
║  │                 │                                    │                                                                 │  ║
║  │                 │                                    ▼                                                                 │  ║
║  │                 │                     ┌────────────────────────────┐                                                   │  ║
║  │                 │                     │     DEV SERVER PROCESS      │                                                   │  ║
║  │                 │                     │                            │                                                   │  ║
║  │                 │                     │ • Vite / Next Dev Server   │                                                   │  ║
║  │                 │                     │ • localhost:5173 Binding   │                                                   │  ║
║  │                 │                     │ • HMR Runtime              │                                                   │  ║
║  │                 │                     └──────────────┬─────────────┘                                                   │  ║
║  │                 │                                    │                                                                 │  ║
║  │                 │                                    ▼                                                                 │  ║
║  │                 │                     ┌────────────────────────────┐                                                   │  ║
║  │                 │                     │   SERVICE WORKER NETWORK    │                                                   │  ║
║  │                 │                     │                            │                                                   │  ║
║  │                 │                     │ • Port Interception         │                                                   │  ║
║  │                 │                     │ • Preview Proxy             │                                                   │  ║
║  │                 │                     │ • localhost Virtualization  │                                                   │  ║
║  │                 │                     └──────────────┬─────────────┘                                                   │  ║
║  └──────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┘  ║
║                                                         │                                                                    ║
║                                                         ▼                                                                    ║
║                                         ┌────────────────────────────────┐                                                   ║
║                                         │       LIVE APP PREVIEW         │                                                   ║
║                                         │                                │                                                   ║
║                                         │ • React / Next.js Apps         │                                                   ║
║                                         │ • Fullstack Preview            │                                                   ║
║                                         │ • Real-time Updates            │                                                   ║
║                                         │ • Browser-only Execution       │                                                   ║
║                                         └────────────────────────────────┘                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                              AI ORCHESTRATION LAYER                                                         ║
║                                                                                                                              ║
║  ┌────────────────────────────┐        ┌────────────────────────────┐        ┌────────────────────────────┐                 ║
║  │      NEXT.JS FRONTEND      │        │      FASTAPI BACKEND       │        │   ANTHROPIC CLAUDE API    │                 ║
║  │                            │        │                            │        │                            │                 ║
║  │ • Prompt Submission        │───────►│ • Clerk JWT Validation     │───────►│ • Structured Planning      │                 ║
║  │ • Authenticated Requests   │        │ • Request Orchestration    │        │ • File Generation          │                 ║
║  │ • Runtime Sync             │        │ • Plan Persistence         │        │ • Task Decomposition       │                 ║
║  │ • Workspace State          │        │ • Runtime Metadata         │        │ • Dependency Analysis      │                 ║
║  └────────────────────────────┘        └────────────────────────────┘        └──────────────┬─────────────┘                 ║
║                                                                                              │                               ║
║                                                                                              ▼                               ║
║                                                                                ┌────────────────────────────┐                ║
║                                                                                │ GENERATED PROJECT OUTPUT   │                ║
║                                                                                │                            │                ║
║                                                                                │ • File Tree Structure      │                ║
║                                                                                │ • package.json             │                ║
║                                                                                │ • React Components         │                ║
║                                                                                │ • Runtime Config           │                ║
║                                                                                └──────────────┬─────────────┘                ║
║                                                                                               │                              ║
║                                                                                               ▼                              ║
║                                                                                ┌────────────────────────────┐                ║
║                                                                                │ WRITTEN INTO VIRTUAL FS    │                ║
║                                                                                └────────────────────────────┘                ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                               BACKEND SERVICE LAYER                                                         ║
║                                                                                                                              ║
║  ┌────────────────────────────┐        ┌────────────────────────────┐        ┌────────────────────────────┐                 ║
║  │      FASTAPI BACKEND       │        │        CLERK AUTH          │        │      ANTHROPIC API         │                 ║
║  │                            │        │                            │        │                            │                 ║
║  │ • REST APIs                │◄──────►│ • JWT Validation           │        │ • AI Plan Generation       │                 ║
║  │ • Project Management       │        │ • Session Management       │        │ • Code Scaffolding         │                 ║
║  │ • File Persistence         │        │ • User Identity            │        │ • Structured Outputs       │                 ║
║  │ • Runtime Metadata         │        │                            │        │ • Prompt Engineering       │                 ║
║  └──────────────┬─────────────┘        └────────────────────────────┘        └────────────────────────────┘                 ║
║                 │                                                                                                            ║
║                 ▼                                                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │                                         POSTGRESQL DATABASE                                                             │  ║
║  │                                                                                                                        │  ║
║  │ • Users                                                                                                                │  ║
║  │ • Projects                                                                                                             │  ║
║  │ • Generated Plans                                                                                                      │  ║
║  │ • File Versions                                                                                                        │  ║
║  │ • Runtime Sessions                                                                                                     │  ║
║  │ • Workspace Metadata                                                                                                   │  ║
║  │ • Prompt Histories                                                                                                     │  ║
║  └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                            RUNTIME SUBSYSTEM INTERACTION MODEL                                               ║
║                                                                                                                              ║
║                           ┌──────────────────────────────┐                                                                   ║
║                           │        MONACO EDITOR         │                                                                   ║
║                           │                              │                                                                   ║
║                           │ • Source Code Editing        │                                                                   ║
║                           │ • Debounced File Writes      │                                                                   ║
║                           │ • Multi-file Workspace       │                                                                   ║
║                           └──────────────┬───────────────┘                                                                   ║
║                                          │                                                                                   ║
║                                          ▼                                                                                   ║
║                                                                                                                              ║
║      ┌────────────────────────┐                 ┌────────────────────────┐                                                   ║
║      │  VIRTUAL FILE SYSTEM   │◄───────────────►│   NODE.JS WASM RUNTIME │                                                   ║
║      │                        │                 │                        │                                                   ║
║      │ • Source Files         │                 │ • Process Execution    │                                                   ║
║      │ • package.json         │                 │ • npm install          │                                                   ║
║      │ • Runtime State        │                 │ • npm run dev          │                                                   ║
║      │ • Dependency Metadata  │                 │ • stdout / stderr      │                                                   ║
║      └────────────┬───────────┘                 └────────────┬───────────┘                                                   ║
║                   │                                          │                                                               ║
║                   ▼                                          ▼                                                               ║
║      ┌────────────────────────┐                 ┌────────────────────────┐                                                   ║
║      │   MODULE GRAPH ENGINE  │                 │  DEV SERVER INSTANCE   │                                                   ║
║      │                        │                 │                        │                                                   ║
║      │ • Incremental Rebuilds │                 │ • localhost:5173       │                                                   ║
║      │ • Dependency Graph     │                 │ • HMR Runtime          │                                                   ║
║      │ • Bundle Updates       │                 │ • Asset Serving        │                                                   ║
║      └────────────┬───────────┘                 └────────────┬───────────┘                                                   ║
║                   └──────────────────┬───────────────────────┘                                                               ║
║                                      │                                                                                       ║
║                                      ▼                                                                                       ║
║                        ┌────────────────────────────────┐                                                                    ║
║                        │    SERVICE WORKER NETWORK      │                                                                    ║
║                        │                                │                                                                    ║
║                        │ • Port Interception            │                                                                    ║
║                        │ • localhost Virtualization     │                                                                    ║
║                        │ • Fetch Proxying               │                                                                    ║
║                        │ • Runtime Request Routing      │                                                                    ║
║                        └────────────────┬───────────────┘                                                                    ║
║                                         │                                                                                    ║
║                                         ▼                                                                                    ║
║                           ┌──────────────────────────────┐                                                                   ║
║                           │       PREVIEW IFRAME         │                                                                   ║
║                           │                              │                                                                   ║
║                           │ • Live Browser Rendering     │                                                                   ║
║                           │ • Hot Reload Updates         │                                                                   ║
║                           │ • Runtime Application UI     │                                                                   ║
║                           └──────────────────────────────┘                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

<!-- DraftDock -->
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                  DRAFTDOCK — REAL-TIME COLLABORATIVE BLOGGING PLATFORM                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                          CLIENT LAYER (REACT + VITE + TAILWIND)                                            ║
║                                                                                                                              ║
║  ┌────────────────────────────┐   ┌────────────────────────────┐   ┌────────────────────────────┐                          ║
║  │      CONTENT PLATFORM      │   │   REAL-TIME COLLABORATION │   │      USER ENGAGEMENT       │                          ║
║  │                            │   │                            │   │                            │                          ║
║  │ • Blog Feed                │   │ • Tiptap Editor            │   │ • Messaging System         │                          ║
║  │ • Explore Page             │   │ • Yjs CRDT State           │   │ • Likes / Comments         │                          ║
║  │ • Tag Navigation           │   │ • Cursor Awareness         │   │ • Notifications            │                          ║
║  │ • Author Profiles          │   │ • Live Presence            │   │ • Follow System            │                          ║
║  │ • Reading History          │   │ • Co-author Sessions       │   │ • Highlights / Bookmarks  │                          ║
║  └──────────────┬─────────────┘   └──────────────┬─────────────┘   └──────────────┬─────────────┘                          ║
║                 │                                │                                │                                        ║
║                 └────────────────────────────────┼────────────────────────────────┘                                        ║
║                                                  │                                                                         ║
║                                                  ▼                                                                         ║
║                                   ┌──────────────────────────────────────┐                                                  ║
║                                   │        PLATFORM DASHBOARD UI         │                                                  ║
║                                   │                                      │                                                  ║
║                                   │ • Draft Management                   │                                                  ║
║                                   │ • Analytics Dashboard                │                                                  ║
║                                   │ • Achievement Tracking               │                                                  ║
║                                   │ • Stripe Subscription UI             │                                                  ║
║                                   │ • Admin Moderation Panel             │                                                  ║
║                                   │ • AI Writing Assistant               │                                                  ║
║                                   └─────────────────┬────────────────────┘                                                  ║
╚═════════════════════════════════════════════════════╪════════════════════════════════════════════════════════════════════════╝
                                                      │
                                                      │ HTTP / REST + WebSockets
                                                      ▼


╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                         SERVER LAYER (NODE.JS / EXPRESS / PRISMA)                                           ║
║                                                                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │                                        CLERK AUTH MIDDLEWARE                                                            │  ║
║  │                                                                                                                        │  ║
║  │ • JWT Validation                                                                                                       │  ║
║  │ • Role Enforcement                                                                                                     │  ║
║  │ • Author / Co-author Permissions                                                                                       │  ║
║  │ • Session Identity                                                                                                     │  ║
║  └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                                                              ║
║                                                                                                                              ║
║  ┌────────────────────────────┐   ┌────────────────────────────┐   ┌────────────────────────────┐                          ║
║  │       REST API LAYER       │   │  REAL-TIME COLLAB SERVER  │   │     INTEGRATION LAYER      │                          ║
║  │                            │   │                            │   │                            │                          ║
║  │ • /blogs                   │   │ • Hocuspocus Server       │   │ • OpenAI Integration       │                          ║
║  │ • /users                   │   │ • Yjs Synchronization     │   │ • Gemini Integration       │                          ║
║  │ • /comments                │   │ • CRDT Merge Engine       │   │ • Stripe Webhooks          │                          ║
║  │ • /likes                   │   │ • Invite Token Auth       │   │ • Nodemailer               │                          ║
║  │ • /analytics               │   │ • Awareness Broadcasting  │   │ • Notification Services    │                          ║
║  │ • /messaging               │   │ • Binary State Streaming  │   │ • Achievement Services     │                          ║
║  └──────────────┬─────────────┘   └──────────────┬─────────────┘   └──────────────┬─────────────┘                          ║
║                 │                                │                                │                                        ║
║                 └────────────────────────────────┼────────────────────────────────┘                                        ║
║                                                  │                                                                         ║
║                                                  ▼                                                                         ║
║                                  ┌───────────────────────────────────────┐                                                 ║
║                                  │       COLLABORATION ENGINE            │                                                 ║
║                                  │                                       │                                                 ║
║                                  │ • Y.Doc Binary Sync                   │                                                 ║
║                                  │ • CRDT Conflict Resolution            │                                                 ║
║                                  │ • Cursor Position Sync                │                                                 ║
║                                  │ • Multi-user Awareness                │                                                 ║
║                                  │ • Live Delta Broadcasting             │                                                 ║
║                                  │ • Session Recovery                    │                                                 ║
║                                  └─────────────────┬─────────────────────┘                                                 ║
╚════════════════════════════════════════════════════╪═════════════════════════════════════════════════════════════════════════╝
                                                     │
                                                     ▼

╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        REAL-TIME SYNCHRONIZATION FLOW                                                       ║
║                                                                                                                              ║
║  ┌─────────────┐                           ┌────────────────────────┐                           ┌────────────────────────┐  ║
║  │   CLIENT 1  │                           │   HOCUSPOCUS SERVER    │                           │ CLIENT 2 / CLIENT N   │  ║
║  └──────┬──────┘                           └────────────┬───────────┘                           └────────────┬───────────┘  ║
║         │                                               │                                                │                 ║
║         │ 1. WebSocket Connect                          │                                                │                 ║
║         │══════════════════════════════════════════════▶│                                                │                 ║
║         │                                               │                                                │                 ║
║         │ 2. Initial Y.Doc Binary Sync                  │                                                │                 ║
║         │◀══════════════════════════════════════════════▶│                                                │                 ║
║         │                                               │                                                │                 ║
║         │ 3. User Types (CRDT Delta)                    │                                                │                 ║
║         │══════════════════════════════════════════════▶│                                                │                 ║
║         │                                               │ 4. Merge CRDT State                            │                 ║
║         │                                               │──────────────────────────────────────────────▶│                 ║
║         │                                               │                                                │                 ║
║         │                                               │ 5. Broadcast Delta                             │                 ║
║         │◀══════════════════════════════════════════════│══════════════════════════════════════════════▶│                 ║
║         │                                               │                                                │                 ║
║         │ 6. Awareness / Cursor Sync                    │                                                │                 ║
║         │◀══════════════════════════════════════════════│══════════════════════════════════════════════▶│                 ║
║                                                                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                         DATABASE & EXTERNAL SERVICES                                                         ║
║                                                                                                                              ║
║  ┌────────────────────────────┐   ┌────────────────────────────┐   ┌────────────────────────────┐                          ║
║  │     POSTGRESQL DATABASE    │   │       REDIS CLUSTER        │   │      EXTERNAL SERVICES     │                          ║
║  │                            │   │                            │   │                            │                          ║
║  │ • Users                    │   │ • Y.Doc Hot Cache          │   │ • Clerk Auth               │                          ║
║  │ • Blogs                    │   │ • Session Presence         │   │ • OpenAI API               │                          ║
║  │ • Comments                 │   │ • Pub/Sub Scaling          │   │ • Gemini API               │                          ║
║  │ • Likes / Follows          │   │ • Rate Limiting            │   │ • Stripe Payments          │                          ║
║  │ • Notifications            │   │ • Collaboration Recovery   │   │ • Nodemailer SMTP          │                          ║
║  │ • Analytics                │   │                            │   │                            │                          ║
║  │ • BlogVersion Snapshots    │   │                            │   │                            │                          ║
║  │ • Binary ydocState         │   │                            │   │                            │                          ║
║  └────────────────────────────┘   └────────────────────────────┘   └────────────────────────────┘                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝