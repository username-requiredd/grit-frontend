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
import { fetchBoardData, updateCardPosition } from "../../../../utils/mockapi";
import { CardDetailModal } from "@/app/components/carddetailmodal";
import { BoardState } from "@/types/board";

const BoardViewPage: React.FC = () => {
  const params = useParams();
  const boardId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  const [boardState, setBoardState] = useState<BoardState>({
    columns: [],
    cards: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // --- Mobile gestures ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 5 },
    })
  );

  const selectedColumn =
    selectedCardId &&
    boardState.columns.find((col) => col.cardIds.includes(selectedCardId));

  const handleCardClick = (id: string) => setSelectedCardId(id);

  // Load board data
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

  // Drag End Handler
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
      const destColumn = boardState.columns.find(
        (c) => c.id === overId
      )!;
      destinationIndex = destColumn.cardIds.length;
    } else {
      const overCard = boardState.cards[overId];
      if (!overCard) return;

      destinationColumnId = overCard.columnId;
      const destColumn = boardState.columns.find(
        (c) => c.id === destinationColumnId
      )!;
      destinationIndex = destColumn.cardIds.indexOf(overId);
    }

    // Prevent useless updates
    if (sourceColumnId === destinationColumnId) {
      const currentIndex = boardState.columns
        .find((c) => c.id === sourceColumnId)!
        .cardIds.indexOf(activeCardId);

      if (
        currentIndex === destinationIndex ||
        currentIndex === destinationIndex - 1
      ) {
        return;
      }
    }

    // Optimistic update
    setBoardState((prev) => {
      const nextColumns = prev.columns.map((c) => ({
        ...c,
        cardIds: [...c.cardIds],
      }));

      const nextCards = { ...prev.cards };

      const sourceColumn = nextColumns.find((c) => c.id === sourceColumnId)!;
      const destColumn = nextColumns.find((c) => c.id === destinationColumnId)!;

      // Remove and reinsert
      sourceColumn.cardIds = sourceColumn.cardIds.filter((id) => id !== activeCardId);
      destColumn.cardIds.splice(destinationIndex, 0, activeCardId);

      nextCards[activeCardId] = {
        ...nextCards[activeCardId],
        columnId: destinationColumnId,
      };

      return { ...prev, columns: nextColumns, cards: nextCards };
    });

    updateCardPosition(activeCardId, destinationColumnId, destinationIndex).catch(
      (err) => console.error("Backend update failed:", err)
    );
  };

  if (loading)
    return <div className="p-8 text-center text-xl">Loading board...</div>;

  return (
    <div className="h-screen flex flex-col relative">
      {/* HEADER */}
      <header className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {boardState.boardDetails?.title || "Kanban Board"}
        </h1>
      </header>

     {/* ===== MODAL + OVERLAY ===== */}
{selectedCardId && (
  <>
    {/* BACKDROP (Blur + Dim + Fade) */}
    <div
      onClick={() => setSelectedCardId(null)}
      className="
        fixed inset-0 
        bg-[#0000005f] 
        backdrop-blur-sm
        z-40 
        animate-fadeIn
      "
    />

    {/* MODAL */}
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-popIn">
      <CardDetailModal
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
        columnTitle={selectedColumn?.title || 'Unknown'}
      />
    </div>
  </>
)}


      {/* ===== BOARD CONTENT (gets blurred + scaled on modal open) ===== */}
      <div
        className={`
          flex-grow transition-all duration-300
          ${selectedCardId ? "blur-sm scale-[0.98]" : "blur-0 scale-100"}
        `}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-grow p-4 overflow-x-auto whitespace-nowrap bg-indigo-50 touch-pan-x">
            <div className="inline-flex h-full items-start gap-4">
              {boardState.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cardIds={column.cardIds}
                  cards={boardState.cards}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export default BoardViewPage;
