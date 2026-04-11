import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Used by shadcn/ui components to merge className strings safely.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

