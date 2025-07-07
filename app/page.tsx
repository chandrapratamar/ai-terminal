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
  const [sidebarOpen, setSidebarOpen] = useState(true)
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

  const { theme } = useTheme()

  // Track if we need to trigger handleSubmit for a new session
  const [pendingFirstSubmit, setPendingFirstSubmit] = useState(false);

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
      "claude-3-sonnet-20240229", 
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
  const { messages: chatMessages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    body: {
      model: settings.model,
      provider: settings.provider,
      apiKey: settings.apiKeys[settings.provider],
    },
    onResponse: (response) => {
      if (response.status === 401) {
        setApiKeyRequired(true)
        return
      }
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
    overflow: "hidden",
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
  }

  // Terminal header style
  const headerStyle = {
    backgroundColor: "var(--background1)",
    borderBottom: "1px solid var(--background2)",
    padding: "1lh 2ch 1lh 2ch",
    minHeight: "2lh",
  }

  // Title bar style
  const titleBarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1lh 2ch",
    backgroundColor: "var(--background2)",
    borderBottom: "1px solid var(--background1)",
    minHeight: "2lh",
  }

  // Menu bar style
  const menuBarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1lh 2ch",
    backgroundColor: "var(--background1)",
    borderBottom: "1px solid var(--background2)",
    fontSize: "1em",
    minHeight: "2lh",
  }

  // Terminal output style
  const outputStyle = {
    flex: 1,
    overflowY: "auto" as const,
    padding: "1lh 2ch",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    fontSize: "inherit",
  }

  // Terminal input area style
  const inputAreaStyle = {
    borderTop: "1px solid var(--background2)",
    backgroundColor: "var(--background1)",
    padding: "1lh 2ch",
    width: "100%",
    boxSizing: "border-box" as const,
  }

  // Terminal input container style
  const inputContainerStyle = {
    display: "flex",
    gap: "1ch",
    backgroundColor: "var(--background0)",
    border: "1px solid var(--background2)",
    padding: "1lh 2ch",
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

  // Add this near other style logic
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

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
                    width: "12px", 
                    height: "12px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--red)",
                    border: "1px solid var(--background3)",
                  }}></div>
                  <div style={{ 
                    width: "12px", 
                    height: "12px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--yellow)",
                    border: "1px solid var(--background3)",
                  }}></div>
                  <div style={{ 
                    width: "12px", 
                    height: "12px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--green)",
                    border: "1px solid var(--background3)",
                  }}></div>
                </div>
                <h1 style={{ 
                  fontSize: "12px", 
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
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button 
                  is-="button" 
                  size-="small"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? "Hide" : ""}
                </button>
                <button 
                  is-="button" 
                  size-="small"
                  onClick={createNewSession}
                >
                  󱐏
                </button>
                <button 
                  is-="button" 
                  size-="small"
                  onClick={() => setSettingsOpen(true)}
                >
                  &#xe690;
                </button>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem",
                backgroundColor: "var(--background2)",
                padding: "0.25rem 0.5rem",
                fontSize: "10px",
              }}>
                
                <span style={{ 
                  color: settings.provider === "openai" ? "var(--green)" : 
                         settings.provider === "anthropic" ? "var(--blue)" : "var(--yellow)" 
                }}>
                  {settings.provider}
                </span>
                <span>|</span>
                  <span>{settings.model}</span>
              </div>
            </div>
          </div>

          {/* Terminal Output */}
          <div style={outputStyle}>
            {apiKeyRequired ? (
              <div style={emptyStateStyle}>
                <div box-="inset" style={{ padding: "2rem", maxWidth: "500px" }}>
                  <h2>API Key Required</h2>
                  <p>Please set your {settings.provider} API key in the settings to continue.</p>
                  <button 
                    is-="button" 
                    variant-="blue"
                    onClick={() => setSettingsOpen(true)}
                    style={{ marginTop: "1rem" }}
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
                  marginBottom: "1rem",
                  fontSize: "clamp(8px, 2vw, 16px)",
                  lineHeight: 1,
                }}>
{`
╭──────────────╮
      │ AI TERMINAL  │   >_ 
╰──────────────╯
`}
                </div>
                <h1>Welcome to AI Terminal</h1>
                <p>Start a conversation with an AI assistant using your API keys.</p>
                
                <div style={quickCommandsStyle}>
                  <div box-="square" style={{ 
                    padding: "0.75rem", 
                    cursor: "pointer",
                    backgroundColor: "var(--background1)",
                    border: "1px solid var(--background2)",
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
                    padding: "0.75rem", 
                    cursor: "pointer",
                    backgroundColor: "var(--background1)",
                    border: "1px solid var(--background2)",
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
                    padding: "0.75rem", 
                    cursor: "pointer",
                    backgroundColor: "var(--background1)",
                    border: "1px solid var(--background2)",
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
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Terminal Input Area */}
          <div style={inputAreaStyle}>
            <form 
              onSubmit={handleFormSubmit}
              suppressHydrationWarning={true}
            >
              <div style={inputContainerStyle}>
                <div style={promptStyle}>user@webtui:~$</div>
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
                    height: "40px",
                    outline: "none",
                    fontFamily: "var(--font-family)",
                    fontSize: "var(--font-size)",
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
                <button 
                  is-="button" 
                  variant-="blue" 
                  type="submit" 
                  disabled={status === "streaming" || status === "submitted" || !input.trim()}
                  className="exec-btn"
                >
                  [󰿄]
                </button>
              </div>
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
