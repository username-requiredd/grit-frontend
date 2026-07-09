"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface AddCardModalProps {
  columnId: string;
  onClose: () => void;
  onAdd: (title: string, description: string, columnId: string) => Promise<void>;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ columnId, onClose, onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [animateOut, setAnimateOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Pass data to the parent so it can hit the real API
      await onAdd(title, description, columnId);
      closeModal();
    } catch (error) {
      console.error("Failed to add card", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setAnimateOut(true);
    setTimeout(onClose, 200);
  };

  return (
    <>
      <div
        onClick={!isSubmitting ? closeModal : undefined}
        className={`fixed inset-0 bg-black/50 dark:bg-dark-bg/70 backdrop-blur-sm z-40 transition-opacity ${
          animateOut ? "opacity-0" : "opacity-100"
        }`}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md bg-white dark:bg-dark-surface rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] transition-all duration-200
            ${animateOut ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        >
          <button
            onClick={closeModal}
            disabled={isSubmitting}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-dark-elevated hover:bg-gray-100 flex items-center justify-center text-gray-100 font-bold text-xl z-10 disabled:opacity-50"
          >
            &times;
          </button>

          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-primary mb-4">Add New Card</h2>

          <div className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Card Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded bg-white dark:bg-dark-elevated text-gray-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              autoFocus
            />
            <textarea
              placeholder="Card Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded bg-white dark:bg-dark-elevated text-gray-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              rows={4}
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-600 text-gray-100 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting || !title.trim()}
                className="px-4 py-2 flex items-center gap-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Add Card"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};