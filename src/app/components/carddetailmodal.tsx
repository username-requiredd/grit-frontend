// components/modals/CardDetailModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, BoardMember } from "@/types/board";

// --- Placeholder Components ---
const SidebarActions = ({ card }: { card: Card }) => (
  <div className="space-y-4 text-sm">
    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Actions</h3>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">
      👥 Change Members
    </button>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">
      🏷️ Edit Labels
    </button>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">
      📅 Change Due Date
    </button>
    <button className="w-full text-left p-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700">
      🗑️ Archive Card
    </button>
  </div>
);

// Helper to fetch detailed card data
const fetchDetailedCard = async (cardId: string): Promise<Card & { activity: any[]; members: BoardMember[] }> => {
  await new Promise(resolve => setTimeout(resolve, 600)); 
  // Mock detailed response
  return {
    id: cardId,
    title: "Implement Card Detail Modal UI",
    description: "Design and implement the full modal, including the main content area and the action sidebar. Focus on responsiveness.",
    columnId: 'c2',
    orderIndex: 0,
    assigneeId: 'u1',
    dueDate: '2025-12-15',
    tags: ['Frontend', 'Design'],
    
    // Additional data for the modal
    activity: [
      { id: 'a1', type: 'comment', user: 'Alice', text: 'Looks like a solid plan. Focusing on the checklist component first.', timestamp: '2 hours ago' },
      { id: 'a2', type: 'move', user: 'You', text: 'moved this card from To Do to In Progress.', timestamp: '1 hour ago' },
    ],
    members: [{ id: 'u1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' }],
  };
};

interface CardDetailModalProps {
  cardId: string;
  onClose: () => void;
  columnTitle: string;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ cardId, onClose, columnTitle }) => {
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state and fetch data when cardId changes
    setLoading(true);
    setCardData(null);

    fetchDetailedCard(cardId).then(data => {
      setCardData(data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch card details:", err);
      setLoading(false);
    });

    // TODO: Add WebSocket subscription here
    return () => {
      // Cleanup: unsubscribe from WebSocket if needed
    };
  }, [cardId]);

  // Inline editing handler (Simplified)
  const handleTitleChange = (newTitle: string) => {
    setCardData((prev: any) => ({ ...prev, title: newTitle }));
    // TODO: Call API to persist title change
  };

  return (
    // REMOVED: bg-gray-900, bg-opacity-75, and onClick from outer container
    // The parent component now handles the backdrop
    <div className="w-full max-w-4xl mx-auto px-4">
      <div 
        className="relative bg-white rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-xl font-bold p-1 rounded-full bg-white hover:bg-gray-100 z-10"
        >
          &times;
        </button>

        {/* Modal Content */}
        {loading ? (
          <div className="p-12 text-center text-lg">Loading task details...</div>
        ) : !cardData ? (
          <div className="p-12 text-center text-lg text-red-600">Failed to load card details</div>
        ) : (
          <div className="flex">
            {/* Main Content (Left) */}
            <div className="flex-1 p-8">
              {/* Title & Context */}
              <div className="mb-6">
                <input
                  type="text"
                  value={cardData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={() => { /* Persist changes */ }}
                  className="text-3xl font-bold mb-1 w-full p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                />
                <p className="text-sm text-gray-500">In list: <span className="underline">{columnTitle}</span></p>
              </div>

              {/* Description */}
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="p-3 bg-gray-50 rounded-md min-h-[100px] text-gray-700">
                {cardData.description || <span className="text-gray-400 italic">No description</span>}
                <button className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 block">Edit</button>
              </div>
              
              {/* Checklist */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Checklist (0/2)</h3>
                <div className="p-3 bg-white border border-gray-200 rounded-md">
                   <p className="text-gray-500 text-sm">Checklist component goes here.</p>
                </div>
              </div>

              {/* Activity Log & Comments */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Activity</h3>
                
                {/* Comment Input */}
                <div className="flex space-x-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                    U
                  </div>
                  <input
                    placeholder="Write a comment..."
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* Activity List */}
                <div className="space-y-4">
                  {cardData.activity && cardData.activity.length > 0 ? (
                    cardData.activity.map((item: any) => (
                      <div key={item.id} className="flex space-x-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {item.user[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.user} <span className="text-xs font-normal text-gray-500">{item.timestamp}</span>
                          </p>
                          <p className="text-gray-700">{item.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No activity yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="w-64 p-8 border-l border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">Add to Card</h3>
              <SidebarActions card={cardData} />

              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Assignee</h3>
                <div className="flex items-center space-x-2">
                  {cardData.members && cardData.members.length > 0 ? (
                    <>
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src={cardData.members[0].avatarUrl || 'https://via.placeholder.com/150'} 
                        alt={cardData.members[0].name} 
                      />
                      <span className="text-sm font-medium">{cardData.members[0].name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Due Date */}
              {cardData.dueDate && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Due Date</h3>
                  <div className="text-sm text-red-600 font-medium">{cardData.dueDate}</div>
                </div>
              )}

              {/* Tags */}
              {cardData.tags && cardData.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {cardData.tags.map((tag: string, idx: number) => (
                      <span 
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};