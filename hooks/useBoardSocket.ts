import { useEffect, useState, useRef } from 'react';
import { createBoardSocket, disconnectSocket } from './socketservice';
import { BoardState } from '@/types/board';
import { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

type SetBoardStateFunction = React.Dispatch<React.SetStateAction<BoardState>>;

const isDev = process.env.NODE_ENV === 'development';

export const useBoardSocket = (
  boardId: string,
  setBoardState: SetBoardStateFunction
) => {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);
  const reconnectingRef = useRef(false);

  // Connection and cleanup
  useEffect(() => {
    // 🛠️ FIX: Do not attempt to initialize until authenticated and token is present
    if (!boardId || status !== 'authenticated' || !session) return;

    mountedRef.current = true;
    let socketInstance: Socket | null = null;

    const initSocket = async () => {
      try {
        if (isDev) console.log(`[useBoardSocket] Initializing for board ${boardId}`);

        // 🛠️ FIX: Extract token from session (adjust key if it's stored under session.jwt or similar)
        const token = (session as any).accessToken;

        if (!token) {
          console.error('[useBoardSocket] No access token available');
          return;
        }

        // 🛠️ FIX: Pass token to the socket service to satisfy the WsAuthGuard
        socketInstance = await createBoardSocket(boardId, token);

        if (!mountedRef.current || !socketInstance) {
          if (socketInstance) disconnectSocket(socketInstance);
          return;
        }

        setSocket(socketInstance);
        setIsReady(true);

        // Join the board room
        socketInstance.emit('joinBoard', boardId);

        // Setup reconnection handler
        socketInstance.on('reconnect', () => {
          if (isDev) console.log('[useBoardSocket] Reconnected, rejoining board');
          reconnectingRef.current = false;
          socketInstance?.emit('joinBoard', boardId);
        });

        socketInstance.on('disconnect', (reason) => {
          if (isDev) console.log(`[useBoardSocket] Disconnected: ${reason}`);
          reconnectingRef.current = true;
          setIsReady(false);
        });

        socketInstance.on('connect', () => {
          if (isDev) console.log('[useBoardSocket] Connected');
          setIsReady(true);
        });

      } catch (error) {
        console.error('[useBoardSocket] Failed to initialize:', error);
      }
    };

    initSocket();

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (socketInstance) {
        if (isDev) console.log(`[useBoardSocket] Cleanup for board ${boardId}`);
        socketInstance.emit('leaveBoard', boardId);
        socketInstance.off('reconnect');
        socketInstance.off('disconnect');
        socketInstance.off('connect');
        disconnectSocket(socketInstance);
      }
      setIsReady(false);
      setSocket(null);
    };
  }, [boardId, session, status]);

  // Event listener setup for board updates
  useEffect(() => {
    if (!socket || !isReady) return;

    if (isDev) console.log('[useBoardSocket] Setting up event listeners');

    const handleCardMoved = (payload: any) => {
      if (isDev) console.log('[useBoardSocket] cardMoved:', payload);

      const { cardId, newColumnId, newPosition } = payload;

      setBoardState((prev) => {
        if (!prev.cards[cardId]) {
          console.warn(`Card ${cardId} not found in state`);
          return prev;
        }

        const nextColumns = prev.columns.map((c) => ({ ...c, cardIds: [...c.cardIds] }));
        const nextCards = { ...prev.cards };

        // Remove card from all columns
        nextColumns.forEach((col) => {
          col.cardIds = col.cardIds.filter((id) => id !== cardId);
        });

        // Insert into new column at position
        const destColumn = nextColumns.find((c) => c.id === newColumnId);
        if (destColumn) {
          destColumn.cardIds.splice(newPosition, 0, cardId);
          nextCards[cardId] = {
            ...prev.cards[cardId],
            columnId: newColumnId,
          };
        } else {
          console.warn(`Destination column ${newColumnId} not found`);
          return prev;
        }

        return { ...prev, columns: nextColumns, cards: nextCards };
      });
    };

    // 🛠️ NEW: Handle real-time card creation from teammates
    const handleCardCreated = (newCard: any) => {
      if (isDev) console.log('[useBoardSocket] cardCreated:', newCard);

      setBoardState((prev) => {
        // Prevent duplicate insertions if we were the ones who created it
        if (prev.cards[newCard.id]) return prev;

        const nextColumns = prev.columns.map((c) => {
          if (c.id === newCard.columnId) {
            return { ...c, cardIds: [...c.cardIds, newCard.id] };
          }
          return c;
        });

        return {
          ...prev,
          columns: nextColumns,
          cards: { ...prev.cards, [newCard.id]: newCard },
        };
      });
    };

    // 🛠️ NEW: Handle real-time card updates (text, description, tags) from teammates
    const handleCardUpdated = (payload: any) => {
      if (isDev) console.log('[useBoardSocket] cardUpdated:', payload);

      setBoardState((prev) => {
        if (!prev.cards[payload.cardId]) return prev;

        return {
          ...prev,
          cards: {
            ...prev.cards,
            [payload.cardId]: {
              ...prev.cards[payload.cardId],
              title: payload.title !== undefined ? payload.title : prev.cards[payload.cardId].title,
              description: payload.description !== undefined ? payload.description : prev.cards[payload.cardId].description,
              tags: payload.tags !== undefined ? payload.tags : prev.cards[payload.cardId].tags,
            }
          }
        };
      });
    };

    const handleMoveCardError = (errorPayload: any) => {
      console.error('[useBoardSocket] moveCardError:', errorPayload.message);
    };

    const handleMoveCardSuccess = (payload: any) => {
      if (isDev) console.log('[useBoardSocket] moveCardSuccess:', payload.cardId);
    };

    const handleJoinedBoard = (data: any) => {
      if (isDev) console.log('[useBoardSocket] joinedBoard:', data.boardId);
    };

    const handleCardDeleted = (payload: any) => {
      if (isDev) console.log('[useBoardSocket] cardDeleted:', payload);

      const { cardId, columnId } = payload;

      setBoardState((prev) => {
        if (!prev.cards[cardId]) {
          console.warn(`Card ${cardId} not found in state`);
          return prev;
        }

        const nextColumns = prev.columns.map((c) => {
          if (c.id === columnId) {
            return { ...c, cardIds: c.cardIds.filter((id) => id !== cardId) };
          }
          return c;
        });

        const nextCards = { ...prev.cards };
        delete nextCards[cardId];

        return { ...prev, columns: nextColumns, cards: nextCards };
      });
    };

    // Attach listeners
    socket.on('cardMoved', handleCardMoved);
    socket.on('cardCreated', handleCardCreated); // Attached
    socket.on('cardUpdated', handleCardUpdated); // Attached
    socket.on('moveCardError', handleMoveCardError);
    socket.on('moveCardSuccess', handleMoveCardSuccess);
    socket.on('joinedBoard', handleJoinedBoard);
    socket.on('cardDeleted', handleCardDeleted);

    return () => {
      if (isDev) console.log('[useBoardSocket] Removing event listeners');
      socket.off('cardMoved', handleCardMoved);
      socket.off('cardCreated', handleCardCreated); // Cleaned up
      socket.off('cardUpdated', handleCardUpdated); // Cleaned up
      socket.off('moveCardError', handleMoveCardError);
      socket.off('moveCardSuccess', handleMoveCardSuccess);
      socket.off('joinedBoard', handleJoinedBoard);
      socket.off('cardDeleted', handleCardDeleted);
    };
  }, [socket, isReady, boardId, setBoardState]);

  return socket;
};