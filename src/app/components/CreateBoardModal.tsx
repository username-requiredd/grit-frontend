"use client";
import React, { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
}

export const CreateBoardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title, description);
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* --- Dark Overlay + Blur --- */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* --- Modal Card --- */}
      <div className="relative z-[70] w-full max-w-md bg-white rounded-xl shadow-2xl p-6 animate-scaleIn">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Create New Board
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Board title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />

          <textarea
            placeholder="Board description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 h-24 border border-gray-300 rounded-lg resize-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Create Board
          </button>
        </form>
      </div>
    </div>
  );
};
