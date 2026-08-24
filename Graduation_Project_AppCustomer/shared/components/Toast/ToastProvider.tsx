import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastHost, type ToastVariant } from './ToastHost'

type ToastOptions = {
  message: string
  title?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastContextValue = {
  showToast: (options: ToastOptions | string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [title, setTitle] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [variant, setVariant] = useState<ToastVariant>('warning')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideToast = useCallback(() => {
    setVisible(false)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      const next = typeof options === 'string' ? { message: options } : options
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }

      setTitle(next.title)
      setMessage(next.message)
      setVariant(next.variant ?? 'warning')
      setVisible(true)

      hideTimerRef.current = setTimeout(() => {
        setVisible(false)
        hideTimerRef.current = null
      }, next.durationMs ?? 2800)
    },
    [],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost
        visible={visible}
        title={title}
        message={message}
        variant={variant}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast phải dùng trong ToastProvider')
  }
  return ctx
}
