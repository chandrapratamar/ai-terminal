"use client"

import { useState, useEffect } from "react"
import "@webtui/css/components/popover.css"
import "@webtui/css/components/button.css"
import "@webtui/css/components/input.css"
import "@webtui/css/utils/box.css"
import "@webtui/css/components/badge.css"

interface Settings {
  provider: "openai" | "anthropic" | "deepseek"
  model: string
  apiKeys: {
    openai: string
    anthropic: string
    deepseek: string
  }
}

interface ChatSettingsProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onClose: () => void
  modelOptions: Record<string, string[]>
}

// Dropdown component for context7/WebTUI style
interface DropdownProps {
  label: string
  items: string[]
  value: string
  onSelect: (value: string) => void
  id?: string
  position?: string
}

function Dropdown({ label, items, value, onSelect, id, position = "bottom baseline-right" }: DropdownProps) {
  return (
    <details is-="popover" position-={position} style={{ width: "100%" }}>
      <summary is-="button" style={{ width: "100%", textAlign: "left" }}>
        {value || label}
      </summary>
      <div style={{ padding: 0, width: "100%", background: "var(--background1)" }}>
        {items.map((item) => (
          <button
            key={item}
            is-="button"
            variant-={value === item ? "blue" : "background1"}
            style={{
              textAlign: "left",
              width: "100%",
              borderRadius: 0,
              border: "none",
              margin: 0,
              boxShadow: "none",
              padding: "0.75lh 1ch"
            }}
            onClick={() => onSelect(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </details>
  )
}

export function ChatSettings({ settings, onSettingsChange, onClose, modelOptions }: ChatSettingsProps) {
  const [tempSettings, setTempSettings] = useState<Settings>({
    ...settings,
    apiKeys: { ...settings.apiKeys }
  })
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    anthropic: false,
    deepseek: false,
  })
  const [isVisible, setIsVisible] = useState(false)

  // Animation effect - slide in when component mounts
  useEffect(() => {
    // Small delay to trigger the animation
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10)
    return () => clearTimeout(timer)
  }, [])

  const handleProviderChange = (provider: "openai" | "anthropic" | "deepseek") => {
    setTempSettings((prev) => ({
      ...prev,
      provider,
      model: modelOptions[provider]?.[0] || "",
    }))
  }

  const handleModelChange = (model: string) => {
    setTempSettings((prev) => ({ ...prev, model }))
  }

  const handleApiKeyChange = (provider: keyof Settings["apiKeys"], value: string) => {
    setTempSettings((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: value,
      },
    }))
  }

  const handleSave = () => {
    onSettingsChange(tempSettings)
    handleClose()
  }

  const handleClose = () => {
    setIsVisible(false)
    // Delay the actual close to allow the animation to complete
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const toggleApiKeyVisibility = (provider: keyof typeof showApiKeys) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  // Overlay style
  const overlayStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "flex-end",
    zIndex: 1000,
    opacity: isVisible ? 1 : 0,
    transition: "opacity 0.3s ease",
  }

  // Sidebar content style
  const sidebarStyle = {
    backgroundColor: "var(--background0)",
    borderLeft: "1px solid var(--background2)",
    width: "350px",
    maxWidth: "90%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    transform: isVisible ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s ease",
  }

  // Header style
  const headerStyle = {
    backgroundColor: "var(--background1)",
    borderBottom: "1px solid var(--background2)",
    padding: "0.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }

  // Body style
  const bodyStyle = {
    padding: "0.5rem",
    overflowY: "auto" as const,
    flex: 1,
  }

  // Settings section style
  const sectionStyle = {
    marginBottom: "1.5rem",
  }

  // Section header style
  const sectionHeaderStyle = {
    fontSize: "14px",
    marginBottom: "0.75rem",
    color: "var(--foreground0)",
  }

  // Provider buttons container style
  const providerButtonsStyle = {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  }

  // Form group style
  const formGroupStyle = {
    marginBottom: "1rem",
  }

  // Label style
  const labelStyle = {
    display: "block",
    marginBottom: "0.5rem",
    color: "var(--foreground1)",
  }

  // Input style
  const inputStyle = {
    backgroundColor: "var(--background1)",
    border: "1px solid var(--background2)",
    borderRadius: "4px",
    padding: "0.5rem",
    width: "100%",
    color: "var(--foreground0)",
    fontFamily: "var(--font-family)",
  }

  // Select style
  const selectStyle = {
    ...inputStyle,
    height: "36px",
  }

  // API key input container style
  const apiKeyInputStyle = {
    display: "flex",
    gap: "0.5rem",
  }

  // API key note style
  const apiKeyNoteStyle = {
    fontSize: "12px",
    color: "var(--foreground2)",
    marginBottom: "1rem",
    padding: "0.5rem",
    backgroundColor: "var(--background1)",
    borderLeft: "3px solid var(--yellow)",
  }

  // Button container style
  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
    marginTop: "0.5rem",
    padding: "0.5rem",
    borderTop: "1px solid var(--background2)",
    backgroundColor: "var(--background1)",
  }

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={sidebarStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: "16px" }}>┌─[ Terminal Configuration ]─</h2>
          <button 
            is-="button" 
            size-="small"
            onClick={handleClose}
          >
            [X]
          </button>
        </div>
        <div style={bodyStyle}>
          {/* Provider Selection */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>AI Provider</h3>
            <div style={providerButtonsStyle}>
              {(["openai", "anthropic", "deepseek"] as const).map((provider) => (
                <button
                  key={provider}
                  is-="button"
                  variant-={tempSettings.provider === provider ? "blue" : "background1"}
                  onClick={() => handleProviderChange(provider)}
                >
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Model</h3>
            <div style={formGroupStyle}>
              <div style={{ position: "relative", zIndex: 10, isolation: "isolate" }}>
                <Dropdown
                  label="Select Model \uF0D7"
                  items={modelOptions[tempSettings.provider] || []}
                  value={tempSettings.model}
                  onSelect={handleModelChange}
                  id="model-dropdown"
                  position="bottom baseline-right"
                />
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>API Keys</h3>
            <div style={apiKeyNoteStyle}>
              🔒 API keys are stored locally in your browser and never sent to our servers.
            </div>

            {(["openai", "anthropic", "deepseek"] as const).map((provider) => (
              <label key={provider} box-="square" style={{ display: "block", marginBottom: "1rem" }}>
                <div className="row" style={{ marginBottom: "0.1rem" }}>
                  <span is-="badge" variant-="background0">
                    {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.1rem" }}>
                  <input
                    type={showApiKeys[provider] ? "text" : "password"}
                    is-="input"
                    value={tempSettings.apiKeys[provider]}
                    onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                    placeholder={`Enter your ${provider} API key...`}
                    style={{ flex: 1 }}
                  />
                  <button
                    is-="button"
                    size-="small"
                    type="button"
                    onClick={() => toggleApiKeyVisibility(provider)}
                  >
                    {showApiKeys[provider] ? "[HIDE]" : "[SHOW]"}
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div style={buttonContainerStyle}>
          <button 
            is-="button"
            onClick={handleClose}
            style={{marginRight: "0.5rem"}}
          >
            [CANCEL]
          </button>
          <button 
            is-="button" 
            variant-="blue"
            onClick={handleSave}
          >
           [SAVE]
          </button>
        </div>
      </div>
    </div>
  )
} 