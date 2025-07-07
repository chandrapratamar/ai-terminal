"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import { useEffect, useRef } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface TerminalMessageProps {
  message: Message
  streaming?: boolean
}

export function TerminalMessage({ message, streaming }: TerminalMessageProps) {
  const [copied, setCopied] = React.useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    marginBottom: "1lh",
    backgroundColor: message.role === "user" ? "var(--background1)" : "var(--background0)",
    borderLeft: message.role === "assistant" ? "2px solid var(--foreground1)" : "2px solid var(--foreground2)",
  }

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5lh 1ch",
    borderBottom: "1px solid var(--background2)",
  }

  const promptStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
    fontSize: "11px",
    color: message.role === "user" ? "var(--foreground2)" : "var(--foreground1)",
  }

  const contentStyle = {
    padding: "1lh 2ch",
    whiteSpace: "pre-wrap" as const,
    fontSize: "13px",
    lineHeight: "1.5",
    overflowX: "auto" as const,
  }

  return (
    <div box-="inset" style={messageContainerStyle}>
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px" }}>
          <span is-="badge" variant-={message.role === "user" ? "foreground2" : "foreground1"}>{message.role === "user" ? "user@aiterminal" : "assistant@aiterminal"}</span>
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
      <div 
        className="prose"
        style={{ padding: "1rem", fontSize: "13px", lineHeight: "1.5", overflowX: "auto" }}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>
        {streaming && message.role === "assistant" && (
          <span style={{
            display: 'inline-block',
            width: '1ch',
            background: 'none',
            animation: 'blink 1s steps(1) infinite',
            color: 'var(--foreground1)',
            fontWeight: 'bold',
            fontSize: '16px',
            marginLeft: '2px',
            verticalAlign: 'middle',
          }}>
            |
          </span>
        )}
      </div>
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
} 