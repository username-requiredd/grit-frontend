// types/board.ts

export type BoardMember = {
  id: string;
  name: string;
  avatarUrl: string; // URL to the member's profile image
};

export type Board = {
  id: string;
  title: string;
  description: string;
  isStarred: boolean;
  memberIds: string[]; // List of member IDs
  members: BoardMember[]; // Actual member objects for display
  lastActivity: string; // ISO date string or formatted string
};

export type Card = {
  id: string;
  title: string;
  description: string;
  columnId: string;
  orderIndex: number; // For drag-and-drop persistence
  assigneeId: string | null;
  dueDate: string | null; // ISO Date String
  tags: string[]; // e.g., ['Feature', 'Bug']
};

export type Column = {
  id: string;
  title: string;
  boardId: string;
  cardIds: string[]; // Ordered list of card IDs in this column
  wipLimit: number | null; // Work-In-Progress limit
};

export type BoardState = {
  /** The ordered list of columns in the board. */
  columns: Column[];
  /** A normalized map of all cards, keyed by card ID. */
  cards: Record<string, Card>;
  /** Optional: Details about the board itself (title, members, etc.) */
  boardDetails?: Board; 
};

export type MoveCardPayload = {
  /** The unique ID of the card being moved. */
  cardId: string;
  /** The ID of the column the card is moving *to*. */
  newColumnId: string;
  /** The new vertical index/position of the card within the new column. */
  newIndex: number; 
};