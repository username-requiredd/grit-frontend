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
  onCardAdd?: (newCard: Card, columnId: string) => void; // optional callback to parent
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  cardIds,
  cards,
  onCardClick,
  onCardAdd,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const isWipExceeded = column.wipLimit !== null && cardIds.length > column.wipLimit;

  const { setNodeRef } = useDroppable({ id: column.id });

  const handleAddCard = (newCard: Card) => {
    // Update local column state
    cards[newCard.id] = newCard;
    cardIds.push(newCard.id);

    // Notify parent if callback provided
    onCardAdd?.(newCard, column.id);
  };

  return (
    <div className="flex flex-col bg-gray-100 rounded-lg flex-shrink-0 shadow-md w-64 sm:w-72 md:w-80 lg:w-96">
      <div
        className={`p-3 rounded-t-lg font-bold text-sm ${
          isWipExceeded ? "bg-red-200 text-red-800" : "bg-white border-b border-gray-200"
        }`}
      >
        {column.title} ({cardIds.length}{column.wipLimit ? `/${column.wipLimit}` : ""})
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="p-3 min-h-[500px] bg-gray-100">
          {cardIds.map((cardId) => (
            <KanbanCard key={cardId} card={cards[cardId]} onClick={onCardClick} />
          ))}
        </div>
      </SortableContext>

      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm text-gray-500 hover:text-indigo-600 w-full text-left"
        >
          + Add a card
        </button>
      </div>

      {/* Animated Add Card Modal */}
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
