'use client'

import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive'

export type Toast = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ToastInput = Omit<Toast, 'id'>

// Basit global store (Zustand veya context yerine minimalist)
let listeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function dispatch(toast: Toast) {
  toasts = [...toasts, toast]
  listeners.forEach((l) => l(toasts))
}

function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  listeners.forEach((l) => l(toasts))
}

export function toast(input: ToastInput) {
  const id = Math.random().toString(36).slice(2)
  dispatch({ ...input, id, open: true, onOpenChange: (open) => { if (!open) remove(id) } })
  setTimeout(() => remove(id), 5000)
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts)

  useState(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((l) => l !== setState)
    }
  })

  return { toasts: state, toast }
}
