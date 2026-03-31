import React from 'react'

type DrawerContextType = {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const DrawerContext = React.createContext<DrawerContextType>({ open: false })

export function Drawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  return <DrawerContext.Provider value={{ open, onOpenChange }}>{children}</DrawerContext.Provider>
}

export function DrawerContent({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open, onOpenChange } = React.useContext(DrawerContext)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => onOpenChange?.(false)}>
      <div className={`w-full bg-white p-4 text-slate-900 shadow-2xl ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function DrawerHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />
}

export function DrawerTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={className} {...props} />
}

export function DrawerFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />
}
