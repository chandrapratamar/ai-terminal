"use client"

interface ChatSession {
  id: string
  title: string
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    createdAt?: Date
  }>
  createdAt: Date
  updatedAt: Date
}

interface TerminalSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onLoadSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onNewSession: () => void
  isOpen?: boolean
  onClose?: () => void
}

export function TerminalSidebar({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewSession,
  isOpen = true,
  onClose,
}: TerminalSidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return "now"
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const handleLoadSession = (sessionId: string) => {
    onLoadSession(sessionId)
    // Auto-close on mobile after selection
    if (window.innerWidth <= 768 && onClose) {
      onClose()
    }
  }

  const sidebarStyle = {
    display: "flex",
    flexDirection: "column" as const,
    width: "40ch",
    height: "100vh",
    backgroundColor: "var(--background1)",
    //borderRight: "1px solid var(--background2)",
    overflow: "hidden",
    transform: isOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.3s ease",
    position: "fixed" as const,
    top: 0,
    left: 0,
    zIndex: 50,
    padding: "1lh 1ch",
  }

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    padding: "1lh 1ch",
    borderBottom: "1px solid var(--background2)",
    backgroundColor: "var(--background2)",
  }

  const contentStyle = {
    flex: 1,
    overflowY: "auto" as const,
    padding: "1lh 1ch",
  }

  const emptyStateStyle = {
    padding: "2lh 1ch",
    textAlign: "center" as const,
    color: "var(--foreground2)",
    fontSize: "11px",
  }

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle} box-="inset">
        <span is-="badge" variant-="background2">┌─[ Active Sessions ]─</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            is-="button"
            size-="small"
            onClick={onNewSession}
            title="New session"
          >
            󱐏
          </button>
          <button
            is-="button"
            size-="small"
            onClick={onClose || (() => {})}
            title="Close sidebar"
            style={{ marginLeft: 0 }}
          >
            󰅗
          </button>
        </div>
      </div>

      <div style={contentStyle}>
        {sessions.length === 0 ? (
          <div style={{ ...emptyStateStyle, fontFamily: "monospace", whiteSpace: "pre" }}>
{`
┌────────────────────┐
│ No active sessions │
│    Click [+] to    │
│ create new session │
└────────────────────┘
`}
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              box-={currentSessionId === session.id ? "inset" : ""}
              style={{
                padding: "0.75rem",
                marginBottom: "0.5rem",
                cursor: "pointer",
                backgroundColor: currentSessionId === session.id ? "var(--background2)" : "var(--background1)",
                color: currentSessionId === session.id ? "var(--foreground0)" : "var(--foreground1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeft: currentSessionId === session.id ? "2px solid var(--foreground1)" : "none",
              }}
              onClick={() => handleLoadSession(session.id)}
            >
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span is-="badge" variant-={currentSessionId === session.id ? "foreground1" : "background2"}>{session.title}</span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--foreground2)", display: "flex", gap: "0.5rem" }}>
                  <span>{session.messages.length} msgs</span>
                  <span>{formatDate(new Date(session.updatedAt))}</span>
                </div>
              </div>
              <button
                is-="button"
                variant-="foreground2"
                size-="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSession(session.id)
                }}
                title="Delete session"
              >
                󱐑
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 