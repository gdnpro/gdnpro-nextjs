"use client"

import { useProgressiveNumber } from "@/hooks/useProgressiveNumber"
import { formatNumber } from "@/libs/formatNumbers"
import { useEffect } from "react"

interface Values {
  decimals?: number
  duration?: number
  final: number
  initial: number
}

export const Counter = ({ decimals, initial, final, duration }: Values) => {
  const [count, setCount] = useProgressiveNumber(duration, decimals, initial)

  useEffect(() => {
    if (typeof window === "undefined") {
      setCount(String(final))
    }
  }, [])

  return <span>+{formatNumber(Number(final))}</span>
}
