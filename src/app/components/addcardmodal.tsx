"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/types/board";
import { v4 as uuidv4 } from "uuid";

interface AddCardModalProps {
  columnId: string;
  onClose: () => void;
  onAdd: (newCard: Card) => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ columnId, onClose, onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [animateOut, setAnimateOut] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;

    const newCard: Card = {
      id: uuidv4(),
      title,
      description,
      columnId,
      orderIndex: 0,
      assigneeId: "",
      dueDate: null,
      tags: [],
    };

    onAdd(newCard);
    closeModal();
  };

  const closeModal = () => {
    setAnimateOut(true);
    setTimeout(onClose, 200); // Match duration of animation
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeModal}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity ${
          animateOut ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] transition-all duration-200
            ${animateOut ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 font-bold text-xl z-10"
          >
            &times;
          </button>

          <h2 className="text-xl font-bold mb-4">Add New Card</h2>

          <div className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Card Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
            <textarea
              placeholder="Card Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
