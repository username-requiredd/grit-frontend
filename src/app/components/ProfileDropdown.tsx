"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';

export const ProfileDropdown = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:scale-105"
      >
        {session.user.image ? (
          <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
        ) : (
          <span className="text-indigo-700 dark:text-indigo-300 font-bold uppercase text-sm">
            {session.user.name ? session.user.name.charAt(0) : "U"}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden z-50 animate-fadeIn">
          <div className="p-4 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-elevated">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session.user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{session.user.email}</p>
          </div>
          <div className="p-2">
            {/* 🛠️ MERGED LINK */}
            <Link href="/profile" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-md transition-colors">
              <Settings size={16} /> Profile & Settings
            </Link>
          </div>
          <div className="p-2 border-t border-gray-100 dark:border-dark-border">
            <button 
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors font-medium"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};