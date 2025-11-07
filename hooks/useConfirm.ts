import { useState, useCallback, useRef } from "react"

interface ConfirmOptions {
  title: string
  description: string
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ConfirmOptions>({
    title: "",
    description: "",
  })
  const resolvePromiseRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback(
    (title: string, description: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfig({ title, description })
        setIsOpen(true)
        resolvePromiseRef.current = resolve
      })
    },
    [],
  )

  const handleConfirm = useCallback(() => {
    if (resolvePromiseRef.current) {
      resolvePromiseRef.current(true)
      resolvePromiseRef.current = null
    }
    setIsOpen(false)
  }, [])

  const handleCancel = useCallback(() => {
    if (resolvePromiseRef.current) {
      resolvePromiseRef.current(false)
      resolvePromiseRef.current = null
    }
    setIsOpen(false)
  }, [])

  return {
    confirm,
    isOpen,
    config,
    handleConfirm,
    handleCancel,
  }
}

