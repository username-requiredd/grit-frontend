"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { CardDetailModal } from "@/app/components/carddetailmodal";
import { ShareBoardModal } from "@/app/components/ShareBoardModal";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { ProfileDropdown } from "@/app/components/ProfileDropdown";
import { BoardState, Board, BoardMember, Column, Card } from "@/types/board";
import { useBoardSocket } from "@/hooks/useBoardSocket";
import { apiFetch } from "@/lib/apiFetch";
import { Users } from "lucide-react";
import { useAlerts } from '@/hooks/useAlerts';

const ERROR_DISPLAY_DURATION = 4000;

const BoardViewPage: React.FC = () => {
  const params = useParams();
  const boardId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [boardState, setBoardState] = useState<BoardState>({ columns: [], cards: {}, pendingOptimisticUpdates: {} });
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const socket = useBoardSocket(boardId, setBoardState);
  const alerts = useAlerts(); // Explicitly resolve theme-aware alerts

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const selectedColumn = useMemo(
    () => selectedCardId 
      ? boardState.columns.find((col) => col.cardIds.includes(selectedCardId))
      : undefined,
    [selectedCardId, boardState.columns]
  );

  const handleCardClick = useCallback((id: string) => setSelectedCardId(id), []);

  const loadBoardData = useCallback(async () => {
    if (!boardId || boardId === 'undefined') {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await apiFetch(`/boards/${boardId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch board data. It may not exist or you lack access.');
      }

      const data = await response.json();
      const board = data.board || data;

      const membersList: BoardMember[] = [];
      if (board.owner) {
        membersList.push({
          id: board.owner.id,
          name: board.owner.name || 'Unknown',
          avatarUrl: board.owner.image || `https://ui-avatars.com/api/?name=${board.owner.name || 'U'}`
        });
      }
      if (board.members) {
        board.members.forEach((m: any) => {
          if (m.user?.id !== board.owner?.id) { 
            membersList.push({
              id: m.user.id,
              name: m.user.name || 'Unknown',
              avatarUrl: m.user.image || `https://ui-avatars.com/api/?name=${m.user.name || 'U'}`
            });
          }
        });
      }

      const boardDetails: Board = {
        id: board.id,
        title: board.title,
        description: board.description || '',
        isStarred: board.isStarred || false,
        memberIds: membersList.map(m => m.id),
        members: membersList,
        lastActivity: board.updatedAt ? new Date(board.updatedAt).toLocaleDateString() : 'Recently',
      };

      const columns: Column[] = [];
      const cards: Record<string, Card> = {};

      if (board.columns) {
        board.columns.forEach((col: any) => {
          const cardIds: string[] = [];
          
          if (col.cards) {
            col.cards.forEach((card: any) => {
              cardIds.push(card.id);
              cards[card.id] = {
                id: card.id,
                title: card.title,
                description: card.description || '',
                columnId: col.id,
                orderIndex: card.orderIndex,
                assigneeId: card.assignee?.id || null,
                dueDate: card.dueDate || null,
                tags: card.tags || []
              };
            });
          }

          columns.push({
            id: col.id,
            title: col.title,
            boardId: board.id,
            cardIds: cardIds,
            wipLimit: col.wipLimit || null,
          });
        });
      }

      setBoardState({
        boardDetails,
        columns,
        cards,
        pendingOptimisticUpdates: {},
      });

    } catch (error: any) {
      console.error("[BoardView] Failed to load board data:", error);
      alerts.error('Board Error', error.message || 'Failed to retrieve the board from the server.');
    } finally {
      setLoading(false);
    }
  }, [boardId, alerts]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  useEffect(() => {
    if (!socket) return;

    const handleConnectError = () => {
      setSocketError("Failed to connect. Changes won't sync.");
      setTimeout(() => setSocketError(null), ERROR_DISPLAY_DURATION);
    };

    const handleDisconnect = () => {
      setSocketError("Disconnected. Reconnecting...");
    };

    const handleConnect = () => {
      setSocketError(null);
      if (boardId) {
        socket.emit('joinBoard', boardId);
      }
    };

    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    };
  }, [socket, boardId]);

  // FIX: Explicit return type Promise<void> defined here
  const handleCreateCard = useCallback(async (title: string, description: string, targetColumnId: string): Promise<void> => {
    try {
      const response = await apiFetch('/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, columnId: targetColumnId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      const { card: dbCard } = await response.json();

      const newCard: Card = {
        id: dbCard.id,
        title: dbCard.title,
        description: dbCard.description || '',
        columnId: dbCard.columnId,
        orderIndex: dbCard.orderIndex,
        assigneeId: dbCard.assigneeId || null,
        dueDate: dbCard.dueDate || null,
        tags: dbCard.tags || []
      };

      setBoardState((prev) => {
        const nextColumns = prev.columns.map(col => {
          if (col.id === targetColumnId) {
            return { ...col, cardIds: [...col.cardIds, newCard.id] };
          }
          return col;
        });

        return {
          ...prev,
          columns: nextColumns,
          cards: { ...prev.cards, [newCard.id]: newCard }
        };
      });

      if (socket?.connected) {
        socket.emit('cardCreated', { card: newCard, boardId });
      }

    } catch (error: any) {
      console.error("[BoardView] Failed to create card:", error);
      // Fire and forget the alert to prevent returning its promise
      alerts.error('Create Failed', 'Could not save the card to the database.');
      throw error; 
    }
  }, [socket, boardId, alerts]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
      const destColumn = boardState.columns.find((c) => c.id === overId);
      if (!destColumn) return;
      destinationIndex = destColumn.cardIds.length;
    } else {
      const overCard = boardState.cards[overId];
      if (!overCard) return;
      destinationColumnId = overCard.columnId;
      const destColumn = boardState.columns.find((c) => c.id === destinationColumnId);
      if (!destColumn) return;
      destinationIndex = destColumn.cardIds.indexOf(overId);
    }

    if (sourceColumnId === destinationColumnId) {
      const sourceColumn = boardState.columns.find((c) => c.id === sourceColumnId);
      if (!sourceColumn) return;
      const currentIndex = sourceColumn.cardIds.indexOf(activeCardId);

      if (currentIndex === destinationIndex) return;
      if (currentIndex < destinationIndex) destinationIndex--;
    }

    if (!socket || !socket.connected) {
      console.error("[BoardView] Socket not connected");
      setSocketError("Not connected. Please wait for reconnection.");
      setTimeout(() => setSocketError(null), ERROR_DISPLAY_DURATION);
      return;
    }

    const rollbackInfo = {
      cardId: activeCardId,
      originalColumnId: sourceColumnId,
      originalPosition: boardState.columns
        .find((c) => c.id === sourceColumnId)
        ?.cardIds.indexOf(activeCardId) ?? 0,
    };

    setBoardState((prev) => {
      const nextColumns = prev.columns.map((c) => {
        if (c.id === sourceColumnId || c.id === destinationColumnId) {
          return { ...c, cardIds: [...c.cardIds] };
        }
        return c; 
      });

      const sourceColumn = nextColumns.find((c) => c.id === sourceColumnId);
      const destColumn = nextColumns.find((c) => c.id === destinationColumnId);

      if (!sourceColumn || !destColumn) return prev;

      sourceColumn.cardIds = sourceColumn.cardIds.filter((id) => id !== activeCardId);
      destColumn.cardIds.splice(destinationIndex, 0, activeCardId);

      const nextCards = {
        ...prev.cards,
        [activeCardId]: { ...prev.cards[activeCardId], columnId: destinationColumnId },
      };

      return { ...prev, columns: nextColumns, cards: nextCards };
    });

    try {
      socket.emit('moveCard', {
        cardId: activeCardId,
        newColumnId: destinationColumnId,
        newPosition: destinationIndex,
        boardId: boardId,
      });
    } catch (error) {
      console.error("[BoardView] Failed to emit moveCard:", error);
      setSocketError("Failed to sync change. Rolling back.");

      setBoardState((prev) => {
        const nextColumns = prev.columns.map((c) => {
          if (c.id === rollbackInfo.originalColumnId || c.id === destinationColumnId) {
            return { ...c, cardIds: [...c.cardIds] };
          }
          return c;
        });

        const origColumn = nextColumns.find((c) => c.id === rollbackInfo.originalColumnId);
        const currColumn = nextColumns.find((c) => c.id === destinationColumnId);

        if (origColumn && currColumn) {
          currColumn.cardIds = currColumn.cardIds.filter((id) => id !== rollbackInfo.cardId);
          origColumn.cardIds.splice(rollbackInfo.originalPosition, 0, rollbackInfo.cardId);
        }

        const nextCards = {
          ...prev.cards,
          [rollbackInfo.cardId]: {
            ...prev.cards[rollbackInfo.cardId],
            columnId: rollbackInfo.originalColumnId,
          },
        };

        return { ...prev, columns: nextColumns, cards: nextCards };
      });

      setTimeout(() => setSocketError(null), ERROR_DISPLAY_DURATION);
    }
  }, [boardState, socket, boardId]);

  // FIX: Explicit return type Promise<void> defined here
  const handleDeleteCard = useCallback(async (cardId: string): Promise<void> => {
    const card = boardState.cards[cardId];
    if (!card) return;

    setBoardState((prev) => {
      const nextColumns = prev.columns.map((c) => {
        if (c.id === card.columnId) {
          return { ...c, cardIds: c.cardIds.filter((id) => id !== cardId) };
        }
        return c;
      });

      const nextCards = { ...prev.cards };
      delete nextCards[cardId];

      return { ...prev, columns: nextColumns, cards: nextCards };
    });

    try {
      const response = await apiFetch(`/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete card' }));
        throw new Error(errorData.error || 'Failed to delete card');
      }

      if (socket?.connected) {
        socket.emit('deleteCard', {
          cardId,
          boardId,
          columnId: card.columnId,
        });
      }
    } catch (error: any) {
      console.error("[BoardView] Failed to delete card:", error);
      
      // Fire and forget the alert so its Promise isn't returned by this function
      alerts.error('Delete Failed', error.message || 'Failed to delete card. Please try again.');

      setBoardState((prev) => {
        const nextColumns = prev.columns.map((c) => {
          if (c.id === card.columnId) {
            return { ...c, cardIds: [...c.cardIds, cardId] };
          }
          return c;
        });

        const nextCards = { ...prev.cards, [cardId]: card };

        return { ...prev, columns: nextColumns, cards: nextCards };
      });
    }
  }, [boardState, socket, boardId, alerts]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-bg overflow-hidden">
        <header className="p-4 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm flex items-center justify-between flex-shrink-0 z-10">
          <div className="h-8 bg-gray-200 dark:bg-dark-elevated rounded w-48 animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-200 dark:bg-dark-elevated rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-dark-elevated rounded w-20 animate-pulse"></div>
          </div>
        </header>

        <div className="flex-1 p-3 md:p-4 bg-indigo-50 dark:bg-dark-bg overflow-x-auto overflow-y-hidden whitespace-nowrap">
          <div className="min-w-full md:max-w-[1400px] md:mx-auto">
            <div className="w-full md:flex md:justify-center">
              <div className="inline-flex items-start gap-4 h-full pb-4">
                {[...Array(4)].map((_, colIndex) => (
                  <div 
                    key={colIndex}
                    className="bg-gray-100 dark:bg-dark-surface rounded-lg p-3 w-72 flex-shrink-0 h-fit border border-transparent dark:border-dark-border"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-dark-border">
                      <div className="h-5 bg-gray-200 dark:bg-dark-elevated rounded w-24 animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-200 dark:bg-dark-elevated rounded-full animate-pulse"></div>
                    </div>

                    <div className="space-y-2">
                      {[...Array(colIndex === 0 ? 3 : colIndex === 1 ? 2 : colIndex === 2 ? 4 : 1)].map((_, cardIndex) => (
                        <div 
                          key={cardIndex}
                          className="bg-white dark:bg-dark-elevated rounded-lg p-3 shadow-sm animate-pulse border border-transparent dark:border-dark-border"
                        >
                          <div className="h-4 bg-gray-200 dark:bg-dark-surface rounded w-3/4 mb-2"></div>
                          
                          <div className="space-y-1.5 mb-3">
                            <div className="h-3 bg-gray-200 dark:bg-dark-surface rounded w-full"></div>
                            <div className="h-3 bg-gray-200 dark:bg-dark-surface rounded w-5/6"></div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
                            <div className="h-3 bg-gray-200 dark:bg-dark-surface rounded w-16"></div>
                            <div className="w-6 h-6 bg-gray-200 dark:bg-dark-surface rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 h-8 bg-gray-200 dark:bg-dark-elevated rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-bg overflow-hidden">
      <header className="p-4 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm flex items-center justify-between flex-shrink-0 z-10">
        
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-primary">
            {boardState.boardDetails?.title || ""}
          </h1>
          
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
          >
            <Users size={16} /> Share
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-dark-secondary">
              {socket?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <ThemeToggle />
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
          <ProfileDropdown />
        </div>
      </header>

      {socketError && (
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400 p-3 flex items-center justify-between">
          <p className="text-sm">{socketError}</p>
          <button
            onClick={() => setSocketError(null)}
            className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-bold"
          >
            ✕
          </button>
        </div>
      )}

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
              onDelete={handleDeleteCard}
              columnTitle={selectedColumn?.title || "Unknown"}
              socket={socket}
              boardId={boardId}
            />
          </div>
        </>
      )}

      <div
        className={`flex-1 p-3 md:p-4 bg-indigo-50 dark:bg-dark-bg overflow-x-auto overflow-y-hidden 
                    whitespace-nowrap touch-pan-x transition-all duration-300
                    ${selectedCardId ? "blur-sm scale-[0.98]" : ""}`}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="min-w-full md:max-w-[1400px] md:mx-auto">
            <div className="w-full md:flex md:justify-center">
              <div className="inline-flex items-start gap-4 h-full pb-4">
               {boardState.columns.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    cardIds={col.cardIds}
                    cards={boardState.cards}
                    onCardClick={handleCardClick}
                    onCardDelete={handleDeleteCard}
                    onCardAdd={handleCreateCard}
                  />
                ))}
              </div>
            </div>
          </div>
        </DndContext>
      </div>

      <ShareBoardModal 
        boardId={boardId} 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
};

export default BoardViewPage;