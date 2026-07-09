import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BoardState, Card, MoveCardPayload } from '../types/board';

// Initial state matching BoardState type definition
const initialState: BoardState = {
  columns: [
    { id: 'column-TODO', title: 'To Do', boardId: '', cardIds: [], wipLimit: null },
    { id: 'column-INPROGRESS', title: 'In Progress', boardId: '', cardIds: [], wipLimit: null },
    { id: 'column-DONE', title: 'Done', boardId: '', cardIds: ['card-ABC-1'], wipLimit: null },
  ],
  cards: {
    'card-ABC-1': { 
      id: 'card-ABC-1', 
      title: 'Test Card 1', 
      description: 'Test card',
      columnId: 'column-DONE', 
      orderIndex: 0, 
      assigneeId: null,
      dueDate: null,
      tags: []
    }
  },
  pendingOptimisticUpdates: {},
};

export const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    // A. OPTIMISTIC UPDATE
    optimisticallyMoveCard: (state, action: PayloadAction<MoveCardPayload>) => {
      // FIX: Destructure 'newPosition' instead of 'newIndex' to match MoveCardPayload type
      const { cardId, newColumnId, newPosition } = action.payload;

      // 1. Find the card
      const card = state.cards[cardId];
      if (!card) return;
      
      const fromColumnId = card.columnId;
      
      // 2. Save original state for rollback
      const fromColumn = state.columns.find(c => c.id === fromColumnId);
      if (!fromColumn) return;
      
      const originalPosition = fromColumn.cardIds.indexOf(cardId);
      state.pendingOptimisticUpdates[cardId] = {
        originalColumnId: fromColumnId,
        originalPosition,
      };

      // 3. Remove from old column
      fromColumn.cardIds = fromColumn.cardIds.filter(id => id !== cardId);

      // 4. Add to new column
      const toColumn = state.columns.find(c => c.id === newColumnId);
      if (!toColumn) return;
      
      // FIX: Use 'newPosition' here
      toColumn.cardIds.splice(newPosition, 0, cardId);
      
      // 5. Update card's columnId
      state.cards[cardId].columnId = newColumnId;
    },

    // B. REVERT UPDATE (Rollback)
    revertCardMove: (state, action: PayloadAction<{ cardId: string }>) => {
      const { cardId } = action.payload;
      const pendingUpdate = state.pendingOptimisticUpdates[cardId];

      if (!pendingUpdate) return;
      
      const { originalColumnId, originalPosition } = pendingUpdate;
      const card = state.cards[cardId];
      if (!card) return;

      // Find current column and remove card
      const currentColumn = state.columns.find(c => c.id === card.columnId);
      if (currentColumn) {
        currentColumn.cardIds = currentColumn.cardIds.filter(id => id !== cardId);
      }

      // Add back to original column at original position
      const originalColumn = state.columns.find(c => c.id === originalColumnId);
      if (originalColumn) {
        originalColumn.cardIds.splice(originalPosition, 0, cardId);
        state.cards[cardId].columnId = originalColumnId;
      }

      delete state.pendingOptimisticUpdates[cardId];
    },

    addCard: (state, action: PayloadAction<{ 
      columnId: string; 
      cardId: string; 
      title: string; 
      creatorId: string;
      description?: string;
    }>) => {
      const { 
        columnId,
        cardId,
        title,
        creatorId,
        description,
      } = action.payload;
      
      // Create the new card object
      const newCard: Card = {
        id: cardId,
        title: title,
        description: description || '',
        columnId: columnId,
        orderIndex: 0,
        assigneeId: creatorId,
        dueDate: null,
        tags: []
      };

      // Add to cards record
      state.cards[cardId] = newCard;

      // Add to the column's cardIds array at the beginning
      const column = state.columns.find(c => c.id === columnId);
      if (column) {
        column.cardIds.unshift(cardId);
      }
    },

    // C. CONFIRMATION/REMOTE UPDATE
    confirmCardMove: (state, action: PayloadAction<Card & { movedByUserId: string }>) => {
      const { id: cardId, columnId: newColumnId, orderIndex: newIndex, movedByUserId } = action.payload;

      if (state.pendingOptimisticUpdates[cardId]) {
        // This is the initiating client's confirmation. Just clear pending state.
        delete state.pendingOptimisticUpdates[cardId];
      } else {
        // This is a remote update. Apply the change forcefully.
        const card = state.cards[cardId];
        if (!card) return;

        // 1. Remove from current column
        const currentColumn = state.columns.find(c => c.id === card.columnId);
        if (currentColumn) {
          currentColumn.cardIds = currentColumn.cardIds.filter(id => id !== cardId);
        }

        // 2. Add to new column
        const newColumn = state.columns.find(c => c.id === newColumnId);
        if (newColumn) {
          newColumn.cardIds.splice(newIndex, 0, cardId);
          state.cards[cardId].columnId = newColumnId;
          state.cards[cardId].orderIndex = newIndex;
        }
      }
    },
  },
});

export const { optimisticallyMoveCard, revertCardMove, confirmCardMove, addCard } = boardSlice.actions;
export default boardSlice.reducer;