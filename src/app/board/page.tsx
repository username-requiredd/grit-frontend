// pages/boards/index.tsx
"use client"
import { useState, useEffect } from 'react';
import { Board, BoardMember } from '@/types/board';
import { BoardCard } from '../components/BoardCard';
import { CreateBoardModal } from '../components/CreateBoardModal';

// --- Mock Data Fetching (Replace with actual API call later) ---
const mockFetchBoards = async (): Promise<Board[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500)); 

  const mockUser1: BoardMember = { id: 'u1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' };
  const mockUser2: BoardMember = { id: 'u2', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?img=2' };
  const mockUser3: BoardMember = { id: 'u3', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?img=3' };

  return [
    {
      id: 'b1',
      title: 'Marketing Launch Q1',
      description: 'Strategy and execution plan for the product launch in Q1. Focus on social media and outreach.',
      isStarred: true,
      memberIds: ['u1', 'u2'],
      members: [mockUser1, mockUser2],
      lastActivity: '3 minutes ago',
    },
    {
      id: 'b2',
      title: 'Backend API Refactor',
      description: 'Overhaul of the REST API endpoints and transition to a GraphQL layer for efficiency.',
      isStarred: false,
      memberIds: ['u1', 'u3', 'u2', 'u4'],
      members: [mockUser1, mockUser3, mockUser2],
      lastActivity: '2 hours ago',
    },
    // Add more mock boards here...
  ];
};

const BoardsDashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    mockFetchBoards().then((data) => {
      setBoards(data);
      setLoading(false);
    });
  }, []);

  const handleCreateBoard = (title: string, description: string) => {
    // 1. Call Backend API to create the board
    console.log('Creating board:', title, description);
    
    // 2. Optimistically update UI (or refetch)
    const newBoard: Board = {
      id: Date.now().toString(), // Temp ID
      title,
      description,
      isStarred: false,
      memberIds: ['currentUserId'],
      members: [{ id: 'currentUserId', name: 'You', avatarUrl: '...' }],
      lastActivity: 'Just now',
    };
    setBoards(prev => [newBoard, ...prev]);
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
    return (
  <>
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Your Boards
        </h1>
      </header>

      {/* Main */}
      <main className="p-4 sm:p-6 lg:p-8">

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search boards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 sm:flex-none p-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:block px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
          >
            + Create New Board
          </button>
        </div>

        {/* Mobile FAB */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center z-50"
        >
          <span className="text-2xl font-light">+</span>
        </button>

        {/* Boards Grid */}
        {loading ? (
          <p className="text-center text-lg text-gray-500">Loading boards...</p>
        ) : filteredBoards.length === 0 ? (
          <p className="text-center text-lg text-gray-500 px-4">No boards found. Create a new one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </main>

    </div>

    <CreateBoardModal 
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onCreate={handleCreateBoard}
    />
  </>
);

};

export default BoardsDashboardPage;