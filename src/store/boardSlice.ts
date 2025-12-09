// src/store/boardSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BoardState, Card, MoveCardPayload } from '../types/board';

// Initial state reflecting your test data structure
// src/store/boardSlice.ts

const initialState: BoardState = {
  columns: {
    // CRITICAL: Define all expected column IDs, even if they are empty
    'column-TODO': [], 
    'column-INPROGRESS': [],
    'column-DONE': [
      { id: 'card-ABC-1', title: 'Test Card 1', columnId: 'column-DONE', position: 1, creatorId: '167127cb-4960-4d56-ad35-6557a88fe884',description:"Test card" }
    ],
  },
  pendingOptimisticUpdates: {},
};



export const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    // A. OPTIMISTIC UPDATE
    optimisticallyMoveCard: (state, action: PayloadAction<MoveCardPayload>) => {
      const { cardId, fromColumnId, toColumnId, toPosition } = action.payload;

      // 1. Find the card and its current index
      const cardIndex = state.columns[fromColumnId]?.findIndex(c => c.id === cardId);
      if (cardIndex === -1 || !state.columns[fromColumnId]) return;
      
      const [cardToMove] = state.columns[fromColumnId].splice(cardIndex, 1);
      
      if (cardToMove) {
        // 2. Save original state for rollback
        state.pendingOptimisticUpdates[cardId] = {
          originalColumnId: fromColumnId,
          originalPosition: cardIndex,


        };

        // 3. Update the card data and insert into the new column
        cardToMove.columnId = toColumnId;
        cardToMove.position = toPosition;
        
        if (!state.columns[toColumnId]) {
             state.columns[toColumnId] = [];
        }
        state.columns[toColumnId].splice(toPosition, 0, cardToMove);
      }
    },

    // B. REVERT UPDATE (Rollback)
    revertCardMove: (state, action: PayloadAction<{ cardId: string }>) => {
      const { cardId } = action.payload;
      const pendingUpdate = state.pendingOptimisticUpdates[cardId];

      if (pendingUpdate) {
        const { originalColumnId, originalPosition } = pendingUpdate;
        const currentColumnId = pendingUpdate.originalColumnId === originalColumnId ? originalColumnId : originalColumnId; // Simple way to find current column
        
        // Find the card in its *current* (optimistic) location
        const cardIndex = state.columns[cardId]?.findIndex(c => c.id === cardId);
        if (cardIndex === -1 || !state.columns[currentColumnId]) return;

        const [cardToMove] = state.columns[currentColumnId].splice(cardIndex, 1);
        
        if (cardToMove) {
          // Move card back to its original location
          cardToMove.columnId = originalColumnId;
          cardToMove.position = originalPosition;
          state.columns[originalColumnId].splice(originalPosition, 0, cardToMove);
        }
        delete state.pendingOptimisticUpdates[cardId];
      }
    },

addCard: (state, action: PayloadAction<{ 
  columnId: string; 
  cardId: string; 
  title: string; 
  creatorId: string;
  description?: string; // ✅ Add this to the payload type
}>) => {
  const { 
    columnId,
    cardId,
    title,
    creatorId,
    description, // ✅ Now this exists in the payload
  } = action.payload;
  
  // Create the new card object
  const newCard: Card = {
    id: cardId,
    title: title,
    description: description || '', // Now this works
    columnId: columnId,
    position: state.columns[columnId] ? state.columns[columnId].length : 0,
    creatorId: creatorId,
  };

  // Add it to the top of the column array
  if (state.columns[columnId]) {
    state.columns[columnId].unshift(newCard); // Add to the start
  } else {
    state.columns[columnId] = [newCard];
  }
},

    // C. CONFIRMATION/REMOTE UPDATE
    confirmCardMove: (state, action: PayloadAction<Card & { movedByUserId: string }>) => {
      const { id: cardId, movedByUserId } = action.payload;

      if (state.pendingOptimisticUpdates[cardId]) {
        // This is the initiating client's confirmation. Just clear pending state.
        delete state.pendingOptimisticUpdates[cardId];
      } else {
        // This is a remote update. Apply the change forcefully.
        const { columnId: newColumnId, position: newPosition } = action.payload;
        
        // 1. Find and remove card from its current location
        let found = false;
        for (const colId in state.columns) {
            const cardIndex = state.columns[colId].findIndex(c => c.id === cardId);
            if (cardIndex > -1) {
                const [card] = state.columns[colId].splice(cardIndex, 1);
                // 2. Insert into the new location
                if (card) {
                    card.columnId = newColumnId;
                    card.position = newPosition;
                    state.columns[newColumnId].splice(newPosition, 0, card);
                }
                found = true;
                break;
            }
        }
        // If not found, it's a new card creation (not implemented here)
      }
    },
  },
});



export const { optimisticallyMoveCard, revertCardMove, confirmCardMove,addCard } = boardSlice.actions;
export default boardSlice.reducer;