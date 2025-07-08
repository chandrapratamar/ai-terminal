"use client"

import { useState, useEffect, useRef } from "react"
import "@webtui/css/components/popover.css"
import "@webtui/css/components/button.css"
import "@webtui/css/components/input.css"
import "@webtui/css/utils/box.css"
import "@webtui/css/components/badge.css"
import { useTheme } from "./theme-provider"

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

function PopoverSelector({ label, options, value, onSelect }: { label: string, options: string[], value: string, onSelect: (v: string) => void }) {
  const popoverRef = useRef<HTMLDetailsElement>(null);
  return (
    <details is-="popover" position-="center" ref={popoverRef} style={{ width: "100%", zIndex: 2000 }}>
      <summary
        is-="button"
        variant-="background1"
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          padding: "0.5lh 1ch",
          border: "none",
          fontSize: "0.7lh",
          borderRadius: "0",
          transition: "background 0.15s",
        }}
      >
        <span style={{ color: "var(--blue)" }}>{value}</span>
        <span style={{ marginLeft: "auto", fontSize: "0.7lh", color: "var(--foreground2)" }}>▼</span>
      </summary>
      <div style={{ minWidth: "20ch", background: "var(--background1)", borderRadius: "0", boxShadow: "none", zIndex: 2000, position: "relative", padding: "0.5lh 1ch" }}>
        {options.map(option => (
          <div
            key={option}
            style={{ cursor: "pointer", padding: "0.5lh 1ch", background: option === value ? "var(--background2)" : "none", fontSize: "0.7lh" }}
            onClick={() => {
              onSelect(option);
              popoverRef.current?.removeAttribute("open");
            }}
          >
            {option}
          </div>
        ))}
      </div>
    </details>
  );
}

export function ChatSettings({ settings, onSettingsChange, onClose, modelOptions }: ChatSettingsProps) {
  const { theme, setTheme } = useTheme()
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
    width: "48ch",
    maxWidth: "90ch",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    transform: isVisible ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s ease",
    padding: "1lh 2ch",
  }

  // Header style
  const headerStyle = {
    backgroundColor: "var(--background1)",
    borderBottom: "1px solid var(--background2)",
    padding: "1lh 2ch 1lh 2ch",
    minHeight: "2lh",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }

  // Body style
  const bodyStyle = {
    padding: "1lh 2ch",
    overflowY: "auto" as const,
    flex: 1,
  }

  // Settings section style
  const sectionStyle = {
    marginBottom: "0.5lh",
  }

  // Section header style
  const sectionHeaderStyle = {
    fontSize: "0.8lh",
    marginBottom: "0.5lh",
    color: "var(--foreground0)",
  }

  // Provider buttons container style
  const providerButtonsStyle = {
    display: "flex",
    gap: "0.25ch",
    marginBottom: "0.5lh",
  }

  // Form group style
  const formGroupStyle = {
    marginBottom: "0.25lh",
  }

  // Label style
  const labelStyle = {
    display: "block",
    marginBottom: "0.05lh",
    color: "var(--foreground1)",
  }

  // Input style
  const inputStyle = {
    backgroundColor: "var(--background1)",
    padding: "0.1lh",
    width: "100%",
    color: "var(--foreground0)",
    fontFamily: "var(--font-family)",
    outline: "none",
  }

  // Select style
  const selectStyle = {
    ...inputStyle,
    height: "1lh",
  }

  // API key input container style
  const apiKeyInputContainerStyle = {
    border: "1px solid var(--background3)",
    borderRadius: "0px",
    backgroundColor: "var(--background0)",
    marginTop: "1lh",
    marginBottom: "1lh",
    position: "relative" as const,
    padding: "1lh 1ch 1lh 1ch",
  }

  // API key label style (to bisect the top border)
  const apiKeyLabelStyle = {
    position: "absolute" as const,
    top: "-0.5lh",
    left: "0.5ch",
    background: "var(--background0)",
    padding: "0 0.25ch",
    fontSize: "0.7lh",
    color: "var(--foreground1)",
    zIndex: 2,
    fontWeight: "bold" as const,
    letterSpacing: "0.02em",
  }

  // API key note style
  const apiKeyNoteStyle = {
    fontSize: "0.5lh",
    color: "var(--foreground2)",
    marginBottom: "1.5lh",
    padding: "0.5lh",
    backgroundColor: "var(--background1)",
    borderLeft: "3px solid var(--yellow)",
  }

  // Button container style
  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.1lh",
    marginTop: "0.1lh",
    padding: "0.1lh",
    borderTop: "1px solid var(--background2)",
    backgroundColor: "var(--background1)",
  }

  // Theme options for dropdown
  const themeOptions = [
    { label: "Dark (Default)", value: "dark" },
    { label: "Light", value: "light" },
    { label: "Catppuccin Mocha", value: "catppuccin-mocha" },
    { label: "Catppuccin Macchiato", value: "catppuccin-macchiato" },
    { label: "Catppuccin Frappe", value: "catppuccin-frappe" },
    { label: "Catppuccin Latte", value: "catppuccin-latte" },
    { label: "Gruvbox Dark Hard", value: "gruvbox-dark-hard" },
    { label: "Gruvbox Dark Medium", value: "gruvbox-dark-medium" },
    { label: "Gruvbox Dark Soft", value: "gruvbox-dark-soft" },
    { label: "Gruvbox Light Hard", value: "gruvbox-light-hard" },
    { label: "Gruvbox Light Medium", value: "gruvbox-light-medium" },
    { label: "Gruvbox Light Soft", value: "gruvbox-light-soft" },
    { label: "Nord", value: "nord" },
  ]

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={sidebarStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: "0.7lh" }}>┌─[ Terminal Settings ]─</h2>
          <button 
            is-="button" 
            size-="small"
            onClick={handleClose}
          >
            
          </button>
        </div>
        <div style={bodyStyle}>
          {/* Theme Selection */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Theme</h3>
            <div style={formGroupStyle}>
              <PopoverSelector
                label="Theme"
                options={themeOptions.map((t) => t.label)}
                value={themeOptions.find((t) => t.value === theme)?.label || ""}
                onSelect={(label) => {
                  const selected = themeOptions.find((t) => t.label === label)
                  if (selected) setTheme(selected.value as any)
                }}
              />
            </div>
          </div>

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
              <PopoverSelector
                label="Model"
                options={modelOptions[tempSettings.provider] || []}
                value={tempSettings.model}
                onSelect={handleModelChange}
              />
            </div>
          </div>

          {/* API Keys */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>API Keys</h3>
            <div style={apiKeyNoteStyle}>
              🔒 API keys are stored locally in your browser and never sent to our servers.
            </div>

            {(["openai", "anthropic", "deepseek"] as const).map((provider) => (
              <div key={provider} style={apiKeyInputContainerStyle}>
                <span style={apiKeyLabelStyle}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key
                </span>
                <div style={{ display: "flex", gap: "0.02lh" }}>
                  <input
                    type={showApiKeys[provider] ? "text" : "password"}
                    is-="input"
                    value={tempSettings.apiKeys[provider]}
                    onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                    placeholder={`Enter your ${provider} API key...`}
                    style={inputStyle}
                  />
                  <button
                    is-="button"
                    size-="small"
                    type="button"
                    onClick={() => toggleApiKeyVisibility(provider)}
                    style={{ minWidth: "9ch", padding: "0.2lh 1ch", fontSize: "0.7lh" }}
                  >
                    {showApiKeys[provider] ? "󰈉 Hide" : "󰈈 Show"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={buttonContainerStyle}>
          <button 
            is-="button"
            onClick={handleClose}
            style={{marginRight: "0.25lh"}}
          >
            󰜺 CANCEL
          </button>
          <button 
            is-="button" 
            variant-="blue"
            onClick={handleSave}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}