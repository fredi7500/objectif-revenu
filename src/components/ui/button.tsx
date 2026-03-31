import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'secondary'
}

export function Button({ className = '', variant = 'default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    default: '',
    outline: '',
    secondary: '',
  }

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
