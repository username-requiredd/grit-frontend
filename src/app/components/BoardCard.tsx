"use client";

import { Board } from "@/types/board";
import { Clock, Users, Star, Layout, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";

interface BoardCardProps {
  board: Board;
  onDelete?: (boardId: string) => void;
}

export const BoardCard: React.FC<BoardCardProps> = ({ board, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the Link from triggering
    e.stopPropagation();
    if (onDelete) onDelete(board.id);
  };

  return (
    <Link href={`/board/${board.id}`} className="block group">
      <div className="bg-white dark:bg-dark-surface rounded-xl p-5 shadow-sm hover:shadow-md border border-transparent dark:border-dark-border hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-200 h-full flex flex-col relative overflow-hidden">
        
        {/* 🛠️ NEW: Delete Action Button */}
        {onDelete && (
          <button 
            onClick={handleDelete}
            className="absolute top-3 right-3 p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
            title="Delete Board"
          >
            <Trash2 size={18} />
          </button>
        )}

        {/* Existing Content */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layout size={20} />
          </div>
          {board.isStarred && <Star size={18} className="text-yellow-400 fill-yellow-400" />}
        </div>

        <h3 className="font-semibold text-lg text-gray-900 dark:text-dark-primary mb-2 line-clamp-1 pr-6">
          {board.title}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-dark-secondary line-clamp-2 mb-4 flex-1">
          {board.description || "No description provided."}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-dark-border">
          <div className="flex items-center -space-x-2">
            {board.members?.slice(0, 3).map((member, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-surface overflow-hidden bg-gray-200">
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
              </div>
            ))}
            {(board.members?.length || 0) > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-surface bg-gray-100 dark:bg-dark-elevated flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                +{board.members!.length - 3}
              </div>
            )}
          </div>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-dark-secondary">
            <Clock size={14} className="mr-1" />
            {board.lastActivity}
          </div>
        </div>
      </div>
    </Link>
  );
};