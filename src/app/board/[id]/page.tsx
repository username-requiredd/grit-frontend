// pages/board/[id].tsx (FIXED UI Layout)
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { KanbanColumn } from "@/app/components/column";
import { fetchBoardData } from "../../../../utils/mockapi";
import { CardDetailModal } from "@/app/components/carddetailmodal";
import { BoardState } from "@/types/board";
// import { useBoardSocket } from '@/hooks/useBoardSocket'; 
import { useBoardSocket } from "../../../../hooks/useBoardSocket";
const BoardViewPage: React.FC = () => {
  const params = useParams();
  const boardId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [boardState, setBoardState] = useState<BoardState>({ columns: [], cards: {} });
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Initialize Socket Connection and Listeners
  const socket = useBoardSocket(boardId, setBoardState); 

  // --- Desktop & Mobile sensors ---
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
  useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  useSensor(KeyboardSensor)
);

  const selectedColumn =
    selectedCardId &&
    boardState.columns.find((col) => col.cardIds.includes(selectedCardId));

  const handleCardClick = (id: string) => setSelectedCardId(id);

  useEffect(() => {
    if (!boardId) return;
    fetchBoardData(boardId).then((data) => {
      setBoardState({
        boardDetails: data.boardDetails,
        columns: data.columns,
        cards: Object.fromEntries(data.cards.map((c) => [c.id, c])),
      });
      setLoading(false);
    });
  }, [boardId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCardId = String(active.id);
    const overId = String(over.id);
    const activeCard = boardState.cards[activeCardId];
    if (!activeCard) return;

    const sourceColumnId = activeCard.columnId;
    let destinationColumnId = sourceColumnId;
    let destinationIndex = 0;

    const isOverColumn = boardState.columns.some((c) => c.id === overId);

    if (isOverColumn) {
      destinationColumnId = overId;
      const destColumn = boardState.columns.find((c) => c.id === overId)!;
      destinationIndex = destColumn.cardIds.length;
    } else {
      const overCard = boardState.cards[overId];
      if (!overCard) return;
      destinationColumnId = overCard.columnId;
      const destColumn = boardState.columns.find((c) => c.id === destinationColumnId)!;
      destinationIndex = destColumn.cardIds.indexOf(overId);
    }

    if (sourceColumnId === destinationColumnId) {
      const currentIndex = boardState.columns.find((c) => c.id === sourceColumnId)!.cardIds.indexOf(activeCardId);
      if (currentIndex === destinationIndex || currentIndex === destinationIndex - 1) return;
    }

    // Optimistic update
    setBoardState((prev) => {
      const nextColumns = prev.columns.map((c) => ({ ...c, cardIds: [...c.cardIds] }));
      const nextCards = { ...prev.cards };
      const sourceColumn = nextColumns.find((c) => c.id === sourceColumnId)!;
      const destColumn = nextColumns.find((c) => c.id === destinationColumnId)!;

      sourceColumn.cardIds = sourceColumn.cardIds.filter((id) => id !== activeCardId);
      destColumn.cardIds.splice(destinationIndex, 0, activeCardId);

      nextCards[activeCardId] = { ...nextCards[activeCardId], columnId: destinationColumnId };
      return { ...prev, columns: nextColumns, cards: nextCards };
    });
    
    // Socket Emit
    if (socket && socket.connected) {
        socket.emit('moveCard', {
            cardId: activeCardId,
            toColumnId: destinationColumnId,
            toPosition: destinationIndex,
            boardId: boardId,
        });
    } else {
        console.warn("Socket not connected. The move was only optimistic and will not persist/broadcast.");
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading board...</div>;

  return (

  <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

    {/* HEADER */}
    <header className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between flex-shrink-0 z-10">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800">
        {boardState.boardDetails?.title || "Kanban Board"}
      </h1>
    </header>

    {/* MODAL */}
    {selectedCardId && (
      <>
        <div
          onClick={() => setSelectedCardId(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-popIn">
          <CardDetailModal
            cardId={selectedCardId}
            onClose={() => setSelectedCardId(null)}
            columnTitle={selectedColumn?.title || "Unknown"}
          />
        </div>
      </>
    )}

{/* BOARD CONTENT */}
<div
  className={`flex-1 p-3 md:p-4 bg-indigo-50 overflow-x-auto overflow-y-hidden 
              whitespace-nowrap touch-pan-x transition-all duration-300
              ${selectedCardId ? "blur-sm scale-[0.98]" : ""}`}
>
  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    {/* Outer wrapper: allows horizontal scrolling on mobile, centers content on md+ */}
    <div className="min-w-full md:max-w-[1400px] md:mx-auto">
      {/* Centering wrapper on md+: makes the inline-flex group centered */}
      <div className="w-full md:flex md:justify-center">
        {/* IMPORTANT: inline-flex for horizontal flow and scroll on small screens */}
        <div className="inline-flex items-start gap-4 h-full pb-4">
          {boardState.columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cardIds={col.cardIds}
              cards={boardState.cards}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>
    </div>
  </DndContext>
</div>



  </div>


  );
};
    
export default BoardViewPage;

