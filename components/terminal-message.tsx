"use client"

import { useState } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface TerminalMessageProps {
  message: Message
}

export function TerminalMessage({ message }: TerminalMessageProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const messageContainerStyle = {
    marginBottom: "1rem",
    backgroundColor: message.role === "user" ? "var(--background1)" : "var(--background0)",
    borderLeft: message.role === "assistant" ? "2px solid var(--foreground1)" : "2px solid var(--foreground2)",
  }

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid var(--background2)",
  }

  const promptStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "11px",
    color: message.role === "user" ? "var(--foreground2)" : "var(--foreground1)",
  }

  const contentStyle = {
    padding: "1rem",
    whiteSpace: "pre-wrap" as const,
    fontSize: "13px",
    lineHeight: "1.5",
    overflowX: "auto" as const,
  }

  return (
    <div box-="inset" style={messageContainerStyle}>
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px" }}>
          <span is-="badge" variant-={message.role === "user" ? "foreground2" : "foreground1"}>{message.role === "user" ? "user@webtui" : "assistant@webtui"}</span>
          <span>~</span>
          <span>{new Date().toLocaleTimeString("en-US", { hour12: false })}</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            is-="button" 
            size-="small" 
            variant-="background2"
            onClick={copyToClipboard} 
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? "[COPIED]" : "[COPY]"}
          </button>
        </div>
      </div>
      <div style={{ padding: "1rem", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.5", overflowX: "auto" }}>{message.content}</div>
    </div>
  )
} 