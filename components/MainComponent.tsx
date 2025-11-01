import type React from "react"

interface Props {
  children: React.ReactNode
}

export const MainComponent = ({ children }: Props) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {children}
    </div>
  )
}
