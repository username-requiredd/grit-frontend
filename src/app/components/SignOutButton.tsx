"use client"

import { signOut } from "next-auth/react"

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className={className || "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"}
    >
      Sign Out
    </button>
  )
}
