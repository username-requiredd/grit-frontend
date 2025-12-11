// hooks/useBoardSocket.ts (Refactored to use getSocket)

import { useEffect } from 'react';
import { initializeSocket,getSocket } from './socketservice';
import { BoardState } from '@/types/board'; 
// ... (interfaces for CardUpdatePayload and MoveErrorPayload remain the same) ...

type SetBoardStateFunction = React.Dispatch<React.SetStateAction<BoardState>>;

/**
 * Custom hook to manage the Socket.IO connection and listeners for the Kanban Board.
 */
export const useBoardSocket = (boardId: string, setBoardState: SetBoardStateFunction) => {
    
    // 1. Connection and Cleanup
    useEffect(() => {
        if (!boardId) return;
        
        // Asynchronously initialize the connection
        initializeSocket(boardId);

    }, [boardId]);


    // 2. Real-Time Listener Setup and Cleanup
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        
        // --- Handlers for Server Broadcasts ---
        // (HandleCardMoved and handleMoveCardError logic remains the same as before)
        const handleCardMoved = (updatedCard: any) => {
            // ... (Your previous state update logic goes here) ...
            setBoardState(prev => {
                // Ensure the card exists in our state before trying to update
                if (!prev.cards[updatedCard.id]) return prev;

                const currentSourceColId = prev.cards[updatedCard.id].columnId;
                
                const nextColumns = prev.columns.map(c => ({ ...c, cardIds: [...c.cardIds] }));
                const nextCards = { ...prev.cards };
                
                // 1. Remove the card from its current column (source)
                const sourceColumn = nextColumns.find(c => c.id === currentSourceColId);
                if (sourceColumn) {
                    sourceColumn.cardIds = sourceColumn.cardIds.filter(id => id !== updatedCard.id);
                }
                
                // 2. Insert the card into the new destination column
                const destColumn = nextColumns.find(c => c.id === updatedCard.columnId);
                if (destColumn && !destColumn.cardIds.includes(updatedCard.id)) {
                    destColumn.cardIds.splice(updatedCard.position, 0, updatedCard.id);
                }

                // 3. Update the card data itself
                nextCards[updatedCard.id] = { ...prev.cards[updatedCard.id], ...updatedCard };
                
                return { ...prev, columns: nextColumns, cards: nextCards };
            });
        };

        const handleMoveCardError = (errorPayload: any) => {
            console.error("Server denied move. Rolling back optimistic update.", errorPayload);
            // TODO: Add actual rollback logic here. For now, we only log.
        };

        // Attach listeners
        socket.on('cardMoved', handleCardMoved);
        socket.on('moveCardError', handleMoveCardError);

        // Clean up listeners when the component unmounts or boardId changes
        return () => {
            socket.off('cardMoved', handleCardMoved);
            socket.off('moveCardError', handleMoveCardError);
        };
    }, [boardId, setBoardState]);

    // Return the global socket instance for manual emits (like moving a card)
    return getSocket();
};