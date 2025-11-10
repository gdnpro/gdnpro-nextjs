"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"

interface LanguageSelectorProps {
  variant?: "light" | "dark"
}

export default function LanguageSelector({ variant = "light" }: LanguageSelectorProps) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use fallback language for initial render to match server
  const currentLang = mounted ? i18n.language : "es"
  const currentLanguage = languages.find((lang) => lang.code === currentLang) || languages[1]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
    // Update HTML lang attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = langCode
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors ${
          variant === "dark"
            ? "text-gray-400 hover:text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
        aria-label={
          mounted ? `Select language - Current: ${currentLanguage.name}` : "Select language"
        }
        aria-expanded={isOpen}
        title={mounted ? currentLanguage.name : undefined}
      >
        <i
          className={`ri-global-line text-xl transition-transform ${isOpen ? "rotate-180" : ""}`}
        ></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50 ${
                currentLang === lang.code ? "bg-cyan-50 text-cyan-700" : "text-gray-700"
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
              {currentLang === lang.code && <i className="ri-check-line ml-auto text-cyan-600"></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
