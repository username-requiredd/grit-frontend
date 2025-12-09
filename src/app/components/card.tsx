import { Card } from "@/types/board";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface KanbanCardProps {
  card: Card;
  onClick?: (id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm ${
        isDragging ? "shadow-lg bg-indigo-50 border-indigo-500" : "hover:shadow-md"
      } transition duration-150 cursor-grab active:cursor-grabbing`}
      onMouseDown={() => setIsDraggingLocal(false)}
      onMouseMove={() => setIsDraggingLocal(true)}
      onMouseUp={() => {
        if (!isDraggingLocal) {
          onClick?.(card.id);
        }
        setIsDraggingLocal(false);
      }}
    >
      {/* Optional visual drag indicator */}
      <div className="w-full flex justify-center mb-2">
        <div className="w-10 h-1 bg-gray-300 rounded"></div>
      </div>

      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
        {card.title}
      </h4>

      <div className="flex justify-between items-center text-xs mt-2">
        {card.dueDate && <span className="text-red-500">Due: {card.dueDate}</span>}
        {card.tags[0] && (
          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium">
            {card.tags[0]}
          </span>
        )}
      </div>
    </div>
  );
};