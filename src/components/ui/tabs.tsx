import React from 'react'

type TabsContextType = {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType>({
  value: '',
  onValueChange: () => {},
})

export function Tabs({
  value,
  onValueChange,
  className = '',
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={className}>{children}</div>
}

export function TabsTrigger({
  value,
  className = '',
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext)
  const active = currentValue === value

  return (
    <button
      type="button"
      data-state={active ? 'active' : 'inactive'}
      className={className}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}
