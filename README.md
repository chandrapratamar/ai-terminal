# WebTUI Chat Interface

A Next.js terminal-inspired chat interface for LLMs with multi-model selection and user-provided API keys, styled using the WebTUI CSS library.

## Features

- Terminal UI: Styled entirely with the official WebTUI CSS library for an authentic terminal look and feel.
- Multi-Model Support: Easily switch between OpenAI, Anthropic, and Deepseek models.
- User API Keys: Secure, local storage of your API keys—never sent to any third party.


## Tech Stack

- Next.js 
- React 
- TypeScript
- WebTUI CSS
- AI SDK (Vercel)

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

This project uses WebTUI CSS library to create a terminal-like UI. WebTUI CSS provides utility classes and styling for building terminal-inspired interfaces:

- Uses `box-` attribute for styling containers
- Uses `is-` attribute for styling components
- Uses CSS variables for theming

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/styles` - Global CSS and WebTUI CSS imports

## API Keys

To use the chat interface, you'll need to provide your own API keys for:

- OpenAI
- Anthropic
- Deepseek

These keys are stored locally in your browser and are never sent to any server except the respective AI provider's API endpoints.