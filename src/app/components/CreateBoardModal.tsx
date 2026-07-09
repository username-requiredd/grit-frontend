"use client";
import React, { useState } from "react";
import { Loader2 } from "lucide-react"; // Make sure lucide-react is installed

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Change to Promise so the modal can wait for the API call
  onCreate: (title: string, description: string) => Promise<void>; 
}

export const CreateBoardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation
    if (!title.trim()) {
      setError("Board title is required");
      return;
    }

    // 2. Loading State
    setIsLoading(true);
    setError("");

    try {
      // 3. Await the parent's API call
      await onCreate(title.trim(), description.trim());
      
      // 4. Success cleanup
      setTitle("");
      setDescription("");
      onClose();
    } catch (err: any) {
      // 5. Error handling
      setError(err.message || "Failed to create board. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Dark Overlay + Blur */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-dark-bg/70 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative z-[70] w-full max-w-md bg-white dark:bg-dark-surface rounded-xl shadow-2xl p-6 animate-scaleIn">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-primary mb-4">
          Create New Board
        </h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Board title *"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(""); // Clear error on type
            }}
            disabled={isLoading}
            className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary placeholder:text-gray-500 disabled:opacity-50 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />

          <textarea
            placeholder="Board description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full p-3 h-24 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary placeholder:text-gray-500 resize-none disabled:opacity-50 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-primary hover:bg-gray-50 dark:hover:bg-dark-elevated transition disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Board"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};