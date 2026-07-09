"use client";

import { Column, Card } from "@/types/board";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./card";
import { useState } from "react";
import { AddCardModal } from "./addcardmodal";

interface KanbanColumnProps {
  column: Column;
  cardIds: string[];
  cards: Record<string, Card>;
  onCardClick?: (id: string) => void;
  onCardAdd?: (title: string, description: string, columnId: string) => Promise<void>;
  onCardDelete?: (cardId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  cardIds,
  cards,
  onCardClick,
  onCardAdd,
  onCardDelete,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const isWipExceeded = column.wipLimit !== null && cardIds.length > column.wipLimit;
  const { setNodeRef } = useDroppable({ id: column.id });

  const handleAddCard = async (title: string, description: string, columnId: string) => {
    if (onCardAdd) {
      await onCardAdd(title, description, columnId);
      setShowAddModal(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 dark:bg-dark-surface rounded-lg flex-shrink-0 shadow-md w-64 sm:w-72 md:w-80 lg:w-96">
      {/* Header */}
      <div
        className={`p-3 rounded-t-lg font-bold text-sm ${
          isWipExceeded
            ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
            : "bg-white dark:bg-dark-elevated border-b border-gray-200 text-gray-900 dark:text-gray-100"
        }`}
      >
        {column.title} ({cardIds.length}{column.wipLimit ? `/${column.wipLimit}` : ""})
      </div>

      {/* Cards */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="p-3 min-h-[500px] bg-gray-100 dark:bg-dark-surface">
          {cardIds.map((cardId) => (
            <KanbanCard
              key={cardId}
              card={cards[cardId]}
              onClick={onCardClick}
              onDelete={onCardDelete}
            />
          ))}
        </div>
      </SortableContext>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-white dark:bg-dark-elevated rounded-b-lg">
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 w-full text-left transition-colors"
        >
          + Add a card
        </button>
      </div>

      {showAddModal && (
        <AddCardModal
          columnId={column.id}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCard}
        />
      )}
    </div>
  );
};