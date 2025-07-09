"use client"

import { useState, useEffect, useRef } from "react"
import { TerminalSidebar } from "@/components/terminal-sidebar"
import { TerminalMessage } from "@/components/terminal-message"
import { ChatSettings } from "@/components/chat-settings"
import { useChat } from "@ai-sdk/react"
import '../styles/chat.css'
import { useTheme } from "../components/theme-provider"
import { getFromDB, setToDB } from '../lib/db'

// Define interfaces
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface Settings {
  provider: "openai" | "anthropic" | "deepseek"
  model: string
  apiKeys: {
    openai: string
    anthropic: string
    deepseek: string
  }
}

export default function Home() {
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKeyRequired, setApiKeyRequired] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    provider: "openai",
    model: "gpt-4o",
    apiKeys: {
      openai: "",
      anthropic: "",
      deepseek: "",
    }
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { theme } = useTheme()

  // Track if we need to trigger handleSubmit for a new session
  const [pendingFirstSubmit, setPendingFirstSubmit] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth <= 600);
    setMounted(true);
  }, []);

  // Model options by provider
  const modelOptions: Record<string, string[]> = {
    openai: [
      "gpt-4o", 
      "gpt-4o-mini", 
      "gpt-4-turbo", 
      "gpt-3.5-turbo",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano"
    ],
    anthropic: [
      "claude-3-opus-20240229", 
      "claude-3-haiku-20240307",
      "claude-3-5-sonnet-20240620",
      "claude-3-5-sonnet-20241022",
      "claude-3-7-sonnet-20250219",
      "claude-4-sonnet-20250514",
      "claude-4-opus-20250514"
    ],
    deepseek: [
      "deepseek-chat",
      "deepseek-coder",
      "deepseek-reasoner"
    ]
  }

  // Chat hook
  const { messages: chatMessages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: "/api/chat",
    body: {
      model: settings.model,
      provider: settings.provider,
      apiKey: settings.apiKeys[settings.provider],
    },
    onResponse: (response) => {
      if (response.status === 401) {
        setApiKeyRequired(true)
        setErrorMessage("API key is required. Please enter your API key in settings.");
        return
      }
      if (response.status === 400) {
        setErrorMessage("Invalid API key. Please check your key in settings.");
        return;
      }
      if (response.status === 429) {
        setErrorMessage("Quota exceeded. Please check your plan or API usage.");
        return;
      }
      setErrorMessage(null);
    },
    onError: (err) => {
      // fallback for any other error
      setErrorMessage(err?.message || "An error occurred. Please try again.");
    },
    onFinish: (message) => {
      if (!currentSessionId) return
      setSessions((prevSessions) => {
        return prevSessions.map((session) => {
          if (session.id === currentSessionId) {
            const updatedMessages = [
              ...session.messages,
              {
                id: message.id,
                role: message.role as "user" | "assistant",
                content: message.content,
              },
            ]
            return {
              ...session,
              messages: updatedMessages,
              title: updatedMessages.length === 2 ? generateSessionTitle(updatedMessages[0].content) : session.title,
              updatedAt: new Date(),
            }
          }
          return session
        })
      })
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Load settings and sessions from IndexedDB
  useEffect(() => {
    getFromDB('chat-settings', 'settings').then(savedSettings => {
      if (savedSettings) setSettings(savedSettings);
    });
    getFromDB('chat-sessions', 'sessions').then(savedSessions => {
      if (savedSessions) setSessions(savedSessions);
    });
  }, []);

  // Save settings to IndexedDB
  useEffect(() => {
    setToDB('chat-settings', 'settings', settings);
  }, [settings]);

  // Save sessions to IndexedDB
  useEffect(() => {
    setToDB('chat-sessions', 'sessions', sessions);
  }, [sessions]);

  // Effect to handle first message submit after session state is ready
  useEffect(() => {
    if (pendingFirstSubmit && currentSessionId) {
      // Create a fake event to pass to handleSubmit
      const event = new Event('submit', { bubbles: true, cancelable: true });
      handleSubmit(event as any);
      setPendingFirstSubmit(false);
    }
  }, [pendingFirstSubmit, currentSessionId]);

  // Helper functions
  const generateSessionTitle = (message: string) => {
    const words = message.split(" ").slice(0, 5)
    return words.join(" ") + (words.length < 5 ? "" : "...")
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Session",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setApiKeyRequired(false)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Create a new session if none exists
    if (!currentSessionId) {
      const newSessionId = Date.now().toString();
      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: input,
      };
      const newSession: ChatSession = {
        id: newSessionId,
        title: generateSessionTitle(input),
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
      setPendingFirstSubmit(true); // Mark that we need to submit after state updates
      return;
    }

    // Add user message to the current session
    setSessions((prevSessions) => {
      return prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          const updatedMessages = [
            ...session.messages,
            {
              id: Date.now().toString(),
              role: "user" as const,
              content: input,
            },
          ]
          return {
            ...session,
            messages: updatedMessages,
            title: session.messages.length === 0 ? generateSessionTitle(input) : session.title,
            updatedAt: new Date(),
          }
        }
        return session
      })
    })

    // Submit to AI
    handleSubmit(e)
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
    }
  }

  // Current session messages
  const currentSession = sessions.find((session) => session.id === currentSessionId)
  const sessionMessages = currentSession?.messages || []

  // Determine which messages to display
  let displayMessages = sessionMessages
  let isStreaming = status === "streaming"
  if (isStreaming && chatMessages.length > 0) {
    // Show all user messages from session, and the currently streaming assistant message from chatMessages
    // Find the last assistant message in chatMessages
    const lastAssistant = [...chatMessages].reverse().find(m => m.role === "assistant")
    if (lastAssistant) {
      displayMessages = [
        ...sessionMessages,
        {
          id: lastAssistant.id,
          role: "assistant",
          content: lastAssistant.content,
          streaming: true,
        },
      ]
    }
  }

  // Main container style
  const containerStyle = {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "var(--background0)",
    fontFamily: "var(--font-family, monospace)",
    fontSize: "var(--font-size, 16px)",
    gap: "0ch",
  }

  // Main content wrapper style for centering
  const mainContentWrapperStyle = {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
  }

  // Main content style (WEBTUI authentic)
  const mainContentStyle = {
    display: "flex",
    flexDirection: "column" as const,
    width: "100vw",
    margin: "0",
    boxSizing: "border-box" as const,
    overflowY: typeof window !== 'undefined' && window.innerWidth <= 600 ? 'auto' as const : undefined,
  }

  // Terminal header style
  const headerStyle = {
    backgroundColor: "var(--background1)",
    borderBottom: "1px solid var(--background2)",
    padding: "0.5lh 1ch 0.5lh 1ch",
    minHeight: "1.2lh",
  }

  // Title bar style
  const titleBarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5lh 1ch",
    backgroundColor: "var(--background2)",
    borderBottom: "1px solid var(--background1)",
    minHeight: "1.2lh",
  }

  // Menu bar style
  const menuBarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5lh 1ch",
    backgroundColor: "var(--background1)",
    borderBottom: "1px solid var(--background2)",
    fontSize: "0.95em",
    minHeight: "1.2lh",
  }

  // Terminal output style
  const outputStyle = {
    flex: 1,
    overflowY: "auto" as const,
    padding: "1lh 2ch",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    fontSize: "inherit",
    paddingBottom: isMobile ? '7lh' : undefined,
  }

  // Terminal input area style
  const inputAreaStyle = {
    borderTop: "1px solid var(--background2)",
    backgroundColor: "var(--background1)",
    padding: "0.5lh 1ch",
    width: "100%",
    boxSizing: "border-box" as const,
    position: isMobile ? 'fixed' as const : 'static' as const,
    left: isMobile ? 0 : undefined,
    right: isMobile ? 0 : undefined,
    bottom: isMobile ? 0 : undefined,
    zIndex: 100,
    fontSize: '0.9em',
  }

  // Terminal input container style
  const inputContainerStyle = {
    display: "flex",
    gap: "1ch",
    backgroundColor: "var(--background0)",
    padding: isMobile ? "0.5lh 1ch" : "1lh 2ch",
    width: "100%",
    boxSizing: "border-box" as const,
    alignItems: "center",
  }

  // Terminal prompt style
  const promptStyle = {
    color: "var(--foreground2)",
    userSelect: "none" as const,
    whiteSpace: "nowrap" as const,
    display: "flex",
    alignItems: "center",
    paddingRight: "1ch",
    minWidth: "12ch",
  }

  // Empty state style
  const emptyStateStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "20lh",
    textAlign: "center" as const,
    color: "var(--foreground2)",
  }

  // Quick commands style
  const quickCommandsStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1lh",
    marginTop: "2lh",
    width: "100%",
    maxWidth: "60ch",
  }

  // Helper function to shorten model names for display
  function getShortModelName(model: string) {
    // Remove trailing version/date or extra dashes
    // e.g., 'claude-3-opus-20240229' => 'claude-3-opus'
    // e.g., 'gpt-4o-mini' => 'gpt-4o-mini'
    // e.g., 'claude-3-sonnet-20240620' => 'claude-3-sonnet'
    return model.replace(/(-\d{6,}|-\d{8,})$/, '').replace(/(-\d{6,}|-\d{8,})$/, '');
  }

  // Only render after mount to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      {sidebarOpen && (
        <TerminalSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onLoadSession={setCurrentSessionId}
          onDeleteSession={handleDeleteSession}
          onNewSession={createNewSession}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      {/* Main Content Wrapper (centers content) */}
      <div style={mainContentWrapperStyle}>
        <div style={mainContentStyle}>
          {/* Terminal Header */}
          <div style={headerStyle}>
            <div style={titleBarStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <div style={{ 
                    width: "1lh", 
                    height: "1lh", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--red)",
                    border: "1px solid var(--background3)",
                  }}></div>
                  <div style={{ 
                    width: "1lh", 
                    height: "1lh", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--yellow)",
                    border: "1px solid var(--background3)",
                  }}></div>
                  <div style={{ 
                    width: "1lh", 
                    height: "1lh", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--green)",
                    border: "1px solid var(--background3)",
                  }}></div>
                </div>
                <h1 style={{ 
                  fontSize: "0.7lh", 
                  margin: 0, 
                  fontWeight: "normal",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  ┌─[ AI Terminal v0.1.2 ] - {currentSession?.title || "No Session"}
                </h1>
              </div>
            </div>

            <div style={menuBarStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25lh" }}>
                <button 
                  is-="button" 
                  size-="small"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{ fontSize: "0.6lh", padding: "0.1lh 0.2lh" }}
                >
                   Sessions
                </button>
                <button 
                  is-="button" 
                  size-="small"
                  onClick={createNewSession}
                  style={{ fontSize: "0.6lh", padding: "0.1lh 0.2lh" }}
                >
                  󱐏 New
                </button>
                <button 
                  is-="button" 
                  size-="small"
                  onClick={() => setSettingsOpen(true)}
                  style={{ fontSize: "0.6lh", padding: "0.1lh 0.2lh" }}
                >
                  &#xe690; Settings
                </button>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.25lh",
                backgroundColor: "var(--background2)",
                padding: "0.1lh 0.2lh",
                fontSize: "0.6lh",
              }}>
                
                <span style={{ 
                  color: settings.provider === "openai" ? "var(--green)" : 
                         settings.provider === "anthropic" ? "var(--blue)" : "var(--yellow)" 
                }}>
                  {settings.provider}
                </span>
                <span>|</span>
                  <span>{getShortModelName(settings.model)}</span>
              </div>
            </div>
          </div>

          {/* Terminal Output */}
          <div style={outputStyle}>
            {apiKeyRequired ? (
              <div style={emptyStateStyle}>
                <div box-="inset" style={{ padding: "1lh", maxWidth: "20ch" }}>
                  <h2>API Key Required</h2>
                  <p>Please set your {settings.provider} API key in the settings to continue.</p>
                  <button 
                    is-="button" 
                    variant-="blue"
                    onClick={() => setSettingsOpen(true)}
                    style={{ marginTop: "1lh", fontSize: "0.7lh" }}
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            ) : displayMessages.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={{
                  fontFamily: "monospace",
                  whiteSpace: "pre",
                  color: "var(--blue)",
                  marginBottom: "0.5lh",
                  fontSize: "clamp(0.7lh, 0.7lh, 0.7lh)",
                  lineHeight: 1,
                }}>
{`
╭──────────────╮
      │ AI TERMINAL  │   >_ 
╰──────────────╯
`}
                </div>
                <h1 style={{ fontSize: "0.7lh" }}>Welcome to AI Terminal</h1>
                <p style={{ fontSize: "0.7lh" }}>Start a conversation with an AI assistant using your API keys.</p>
                
                <div style={quickCommandsStyle}>
                  <div box-="square" style={{ 
                    padding: "1.1ch", 
                    cursor: "pointer",
                    backgroundColor: "var(--background2)",
                    color: "var(--foreground0)",
                    fontWeight: "bold",
                  }} onClick={() => {
                    const event = {
                      target: { value: "What are the best practices for creating accessible web applications?" }
                    } as React.ChangeEvent<HTMLTextAreaElement>;
                    handleInputChange(event);
                    inputRef.current?.focus();
                  }}>
                    $ What are the best practices for creating accessible web applications?
                  </div>
                  
                  <div box-="square" style={{ 
                    padding: "1.1ch", 
                    cursor: "pointer",
                    backgroundColor: "var(--background2)",
                    color: "var(--foreground0)",
                    fontWeight: "bold",
                  }} onClick={() => {
                    const event = {
                      target: { value: "Explain the differences between REST and GraphQL APIs." }
                    } as React.ChangeEvent<HTMLTextAreaElement>;
                    handleInputChange(event);
                    inputRef.current?.focus();
                  }}>
                    $ Explain the differences between REST and GraphQL APIs.
                  </div>
                  
                  <div box-="square" style={{ 
                    padding: "1.1ch", 
                    cursor: "pointer",
                    backgroundColor: "var(--background2)",
                    color: "var(--foreground0)",
                    fontWeight: "bold",
                  }} onClick={() => {
                    const event = {
                      target: { value: "What are some strategies for optimizing website performance?" }
                    } as React.ChangeEvent<HTMLTextAreaElement>;
                    handleInputChange(event);
                    inputRef.current?.focus();
                  }}>
                    $ What are some strategies for optimizing website performance?
                  </div>
                </div>
              </div>
            ) : (
              <>
                {displayMessages.map((message, idx) => (
                  <TerminalMessage key={message.id}
                    message={message}
                    streaming={isStreaming && idx === displayMessages.length - 1 && message.role === "assistant"}
                  />
                ))}
                {errorMessage && (
                  <div
                    style={{
                      background: "var(--background2)",
                      color: "var(--red, #ff5555)",
                      border: "1px solid var(--red, #ff5555)",
                      padding: "1lh 2ch",
                      margin: "1lh 0",
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.9em',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1ch',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                    role="alert"
                  >
                    <span style={{fontWeight: 'bold', fontSize: '1.2em'}}>[ERROR]</span>
                    <span>{errorMessage}</span>
                    <button
                      is-="button"
                      size-="small"
                      style={{ marginLeft: 'auto', color: 'var(--red, #ff5555)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => setErrorMessage(null)}
                      title="Dismiss error"
                    >
                      [X]
                    </button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Terminal Input Area */}
          <div style={inputAreaStyle}>
            <form 
              onSubmit={handleFormSubmit}
              suppressHydrationWarning={true}
              style={{ display: 'flex', gap: '1ch', alignItems: 'center' }}
            >
              <div style={inputContainerStyle}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  suppressHydrationWarning={true}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    color: "var(--foreground0)",
                    resize: "none",
                    outline: "none",
                    fontFamily: "var(--font-family)",
                    fontSize: "0.7lh",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleFormSubmit(e)
                    }
                  }}
                  disabled={status === "streaming" || status === "submitted"}
                />
              </div>
              <button 
                is-="button"
                variant-="blue"
                size-="medium"
                type="submit"
                disabled={status === "streaming" || status === "submitted" || !input.trim()}
                className="exec-btn"
                style={{ paddingLeft: '1.25ch', paddingTop: '2ch', paddingBottom:'2ch', paddingRight: '1.25ch', display: 'flex', alignItems: 'center' }}
              >
                [󰿄] SEND
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <ChatSettings
          settings={settings}
          onSettingsChange={(newSettings) => {
            setSettings(newSettings)
            setApiKeyRequired(false)
          }}
          onClose={() => setSettingsOpen(false)}
          modelOptions={modelOptions}
        />
      )}
    </div>
  )
} 