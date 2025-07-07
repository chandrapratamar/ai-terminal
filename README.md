# AI Terminal

A Next.js terminal-inspired chat interface for LLMs with multi-model selection and user-provided API keys, styled using the WebTUI CSS library.

## Features

- Terminal UI: Styled entirely with the WebTUI CSS library for an authentic terminal look and feel.
- Multi-Model Support: Easily switch between OpenAI, Anthropic, and Deepseek models.
- User API Keys: Secure, browser-only storage of your API keys—never sent to any third party.
- **IndexedDB Storage**: All chat sessions, settings, and theme preferences are stored in your browser using IndexedDB for robust, asynchronous persistence.

## Tech Stack

- Next.js 
- React 
- TypeScript
- WebTUI CSS
- AI SDK (Vercel)
- idb (IndexedDB wrapper for async browser storage)

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## WebTUI CSS Integration

This project uses the [WebTUI CSS library](https://webtui.ironclad.sh/) to create a terminal-like UI. WebTUI provides utility classes and styling for building terminal-inspired interfaces:

- Uses `box-` attribute for styling containers
- Uses `is-` attribute for styling components
- Uses CSS variables for theming

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/styles` - Global CSS and WebTUI CSS imports
- `/lib/db.ts` - IndexedDB utility for persistent storage

## API Keys & Storage

To use the chat interface, you'll need to provide your own API keys for:

- OpenAI
- Anthropic
- Deepseek

**These keys, along with all chat sessions, settings, and theme preferences, are stored securely in your browser using IndexedDB (via the [idb](https://www.npmjs.com/package/idb) library).**

- No data is sent to any server except the respective AI provider's API endpoints.
- No data is stored on the server or in the cloud.
- All persistence is browser-only and SSR-safe (IndexedDB is only accessed in the browser).

## Notes

- If you clear your browser storage, your chat history and settings will be lost.
- The app is fully SSR-safe: all IndexedDB access is guarded to only run in the browser.