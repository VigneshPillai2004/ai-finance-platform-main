"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
} 