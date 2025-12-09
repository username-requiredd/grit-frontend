import { Column, Card } from "@/types/board";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./card";

interface KanbanColumnProps {
  column: Column;
  cardIds: string[];
  cards: Record<string, Card>;
  onCardClick?: (id: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, 
  cardIds, 
  cards,
  onCardClick
}) => {
  const isWipExceeded = column.wipLimit !== null && cardIds.length > column.wipLimit;
  
  // ✅ Make the column a droppable target
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col bg-gray-100 rounded-lg w-72 flex-shrink-0 shadow-md">
      <div
        className={`p-3 rounded-t-lg font-bold text-sm ${
          isWipExceeded ? "bg-red-200 text-red-800" : "bg-white border-b border-gray-200"
        }`}
      >
        {column.title} ({cardIds.length}{column.wipLimit ? `/${column.wipLimit}` : ""})
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        {/* ✅ Attach the droppable ref here */}
        <div ref={setNodeRef} className="p-3 min-h-[500px] bg-gray-100">
          {cardIds.map((cardId) => (
            <KanbanCard 
              key={cardId} 
              card={cards[cardId]} 
              onClick={onCardClick}
            />
          ))}
        </div>
      </SortableContext>

      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <button className="text-sm text-gray-500 hover:text-indigo-600 w-full text-left">
          + Add a card
        </button>
      </div>
    </div>
  );
};