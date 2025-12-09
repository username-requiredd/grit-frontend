"use client";

import React, { useState, useEffect } from "react";
import { Card, BoardMember } from "@/types/board";

// Sidebar Actions
const SidebarActions = ({ card }: { card: Card }) => (
  <div className="space-y-4 text-sm">
    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Actions</h3>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">👥 Change Members</button>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">🏷️ Edit Labels</button>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">📅 Change Due Date</button>
    <button className="w-full text-left p-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700">🗑️ Archive Card</button>
  </div>
);

// Mock fetch function
const fetchDetailedCard = async (cardId: string): Promise<Card & { activity: any[]; members: BoardMember[] }> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return {
    id: cardId,
    title: "Implement Card Detail Modal UI",
    description: "Design and implement the full modal...",
    columnId: 'c2',
    orderIndex: 0,
    assigneeId: 'u1',
    dueDate: '2025-12-15',
    tags: ['Frontend', 'Design'],
    activity: [
      { id: 'a1', type: 'comment', user: 'Alice', text: 'Looks good!', timestamp: '2 hours ago' },
      { id: 'a2', type: 'move', user: 'You', text: 'moved card to In Progress', timestamp: '1 hour ago' },
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
    setLoading(true);
    setCardData(null);

    fetchDetailedCard(cardId).then(data => {
      setCardData(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [cardId]);

  const handleTitleChange = (newTitle: string) => {
    setCardData((prev: any) => ({ ...prev, title: newTitle }));
  };

  return (
    <div className="w-full h-full md:h-auto max-w-4xl mx-auto px-2 md:px-4 flex items-center justify-center">
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-h-[95vh] md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Fixed */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-5 md:top-4 md:right-4 text-gray-500 hover:text-gray-900 text-2xl md:text-xl font-bold p-1 rounded-full bg-white hover:bg-gray-100 z-10 shadow-md"
        >
          &times;
        </button>

        {loading ? (
          <div className="p-12 text-center w-full">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-lg text-gray-600 animate-pulse">Loading task details...</p>
            </div>
          </div>
        ) : !cardData ? (
          <div className="p-12 text-center w-full">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg text-red-600 font-medium">Failed to load card details</p>
              <p className="text-sm text-gray-500">Please try again later</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row overflow-y-auto">
            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8">
              <input
                type="text"
                value={cardData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl md:text-3xl font-bold w-full mb-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mb-6">In list: <span className="underline">{columnTitle}</span></p>

              {/* Description */}
              <h3 className="text-base md:text-lg font-semibold mb-2">Description</h3>
              <div className="p-3 bg-gray-50 rounded-md min-h-[100px] text-sm md:text-base text-gray-700 mb-6">
                {cardData.description || <span className="text-gray-400 italic">No description</span>}
              </div>

              {/* Checklist */}
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold mb-2">Checklist (0/2)</h3>
                <div className="p-3 bg-white border border-gray-200 rounded-md text-gray-500 text-sm">Checklist placeholder</div>
              </div>

              {/* Activity */}
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">Activity</h3>
                <div className="flex space-x-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">U</div>
                  <input placeholder="Write a comment..." className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                </div>
                <div className="space-y-3">
                  {cardData.activity.map((item: any) => (
                    <div key={item.id} className="flex space-x-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">{item.user[0]}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.user} <span className="text-xs font-normal text-gray-500">{item.timestamp}</span></p>
                        <p className="text-gray-700">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-64 p-4 md:p-8 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50 flex-shrink-0">
              <h3 className="text-xs md:text-sm font-semibold uppercase text-gray-500 mb-4">Add to Card</h3>
              <SidebarActions card={cardData} />

              <div className="mt-6">
                <h3 className="text-xs md:text-sm font-semibold uppercase text-gray-500 mb-2">Assignee</h3>
                <div className="flex items-center space-x-2">
                  {cardData.members.length > 0 ? (
                    <>
                      <img className="h-8 w-8 rounded-full" src={cardData.members[0].avatarUrl} alt={cardData.members[0].name} />
                      <span className="text-sm font-medium">{cardData.members[0].name}</span>
                    </>
                  ) : <span className="text-sm text-gray-500">Unassigned</span>}
                </div>
              </div>

              {cardData.dueDate && (
                <div className="mt-6">
                  <h3 className="text-xs md:text-sm font-semibold uppercase text-gray-500 mb-2">Due Date</h3>
                  <div className="text-sm text-red-600 font-medium">{cardData.dueDate}</div>
                </div>
              )}

              {cardData.tags.length > 0 && (
                <div className="mt-6 mb-6">
                  <h3 className="text-xs md:text-sm font-semibold uppercase text-gray-500 mb-2">Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {cardData.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{tag}</span>
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