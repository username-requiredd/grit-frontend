// utils/mockApi.ts

import { Board, Column, Card } from '@/types/board';

// Mock Data Structure:
// Board b1 has 3 columns (c1, c2, c3)
// c1: To Do (2 cards: card1, card2)
// c2: In Progress (1 card: card3)

const mockCards: Card[] = [
  { id: 'card1', title: 'Setup database schema', description: 'Design models for Card, Column, and Activity.', columnId: 'c1', orderIndex: 0, assigneeId: 'u1', dueDate: '2025-12-15', tags: ['Backend'] },
  { id: 'card2', title: 'Implement DND library', description: 'Integrate react-beautiful-dnd in the Board View.', columnId: 'c1', orderIndex: 1, assigneeId: 'u2', dueDate: '2025-12-18', tags: ['Frontend'] },
  { id: 'card3', title: 'Design Board Dashboard', description: 'Finalize Tailwind styling for the /boards page.', columnId: 'c2', orderIndex: 0, assigneeId: 'u1', dueDate: '2025-12-12', tags: ['Design', 'Frontend'] },
  { id: 'card4', title: 'Testing', description: 'Write unit tests for authentication endpoints.', columnId: 'c3', orderIndex: 0, assigneeId: 'u3', dueDate: null, tags: ['Testing'] },
];

const mockColumns: Column[] = [
  { id: 'c1', title: 'To Do', boardId: 'b1', cardIds: ['card1', 'card2'], wipLimit: 3 },
  { id: 'c2', title: 'In Progress', boardId: 'b1', cardIds: ['card3'], wipLimit: 2 },
  { id: 'c3', title: 'Done', boardId: 'b1', cardIds: ['card4'], wipLimit: null },
];

export const fetchBoardData = async (boardId: string) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

  // In a real app, you would fetch all columns and cards related to boardId
  return {
    boardDetails: { id: boardId, title: 'Marketing Launch Q1', isStarred: true, lastActivity: '2 hours ago' /* ... other fields */ },
    columns: mockColumns,
    cards: mockCards,
  };
};

export const updateCardPosition = async (cardId: string, newColumnId: string, newIndex: number) => {
  console.log(`API Call: Moving card ${cardId} to column ${newColumnId} at index ${newIndex}`);
  // In a real application, this API call also triggers a WebSocket broadcast.
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true };
};