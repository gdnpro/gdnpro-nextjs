import type React from "react"

interface Props {
  children: React.ReactNode
}

export const MainComponent = ({ children }: Props) => {
  return <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">{children}</div>
}
