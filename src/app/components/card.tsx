"use client";

import { Card } from "@/types/board";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";

interface KanbanCardProps {
  card: Card;
  onClick?: (id: string) => void;
  onDelete?: (cardId: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, onClick, onDelete }) => {
  const alerts = useAlerts();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    const confirmed = await alerts.confirmDanger(
      "Delete Card?",
      `Are you sure you want to delete "${card.title}"? This action cannot be undone.`,
      "Yes, delete it!"
    );

    if (confirmed) {
      setIsDeleting(true);
      onDelete?.(card.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0,
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
      onPointerUp={() => !isDragging && onClick?.(card.id)}
      className={`p-3 mb-3 border rounded shadow-sm cursor-grab active:cursor-grabbing transition-colors ${
        isDragging
          ? "bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 shadow-lg"
          : "bg-white dark:bg-dark-elevated border-gray-200 dark:border-dark-border hover:shadow-md"
      }`}
    >
      {/* Drag handle */}
      <div className="w-full flex justify-center mb-2 cursor-grab">
        <div className="w-10 h-1 bg-gray-300 dark:bg-dark-border rounded" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-primary line-clamp-2 flex-1">
          {card.title}
        </h4>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-gray-400 dark:text-dark-secondary hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
          title="Delete card"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex justify-between items-center text-xs mt-2">
        {card.dueDate && (
          <span className="text-red-500 dark:text-red-400">
            Due: {card.dueDate}
          </span>
        )}
        {card.tags[0] && (
          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded text-xs font-medium">
            {card.tags[0]}
          </span>
        )}
      </div>
    </div>
  );
};