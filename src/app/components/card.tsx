import { Card } from "@/types/board";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanCardProps {
  card: Card;
  onClick?: (id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    touchAction: "none", // This is crucial for mobile
  };

  // Use pointer up to avoid mobile click conflicts
  const handleClick = (e: React.PointerEvent) => {
    if (!isDragging) {
      onClick?.(card.id);
    }
  };

  return (
    <div
  ref={setNodeRef}
  style={{
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    touchAction: "none", // Crucial for mobile
  }}
  {...attributes}
  {...listeners} // must be attached to the element itself or a handle
  onPointerUp={(e) => !isDragging && onClick?.(card.id)}
  className={`p-3 mb-3 bg-white  rounded shadow-sm ${
    isDragging ? "bg-indigo-50 border-indigo-500 shadow-lg" : "hover:shadow-md"
  } cursor-grab active:cursor-grabbing`}
>

      {/* Drag handle */}
      <div
        {...listeners} // only attach listeners to the small drag handle
        className="w-full flex justify-center mb-2 cursor-grab"
      >
        <div className="w-10 h-1 bg-gray-300 rounded"></div>
      </div>

      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{card.title}</h4>

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
