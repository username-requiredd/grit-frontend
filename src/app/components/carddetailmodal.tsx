"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, BoardMember } from "@/types/board";
import { Socket } from "socket.io-client";

// Interfaces for structured data exchange
interface CommentResponse {
    id: string;
    text: string;
    createdAt: string; // ISO date string
    cardId: string; // Included for listener filtering (though optional if filtering by cardId is implicit)
    user: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
}

// Sidebar Actions (No change needed here)
const SidebarActions = ({ card }: { card: Card }) => (
  <div className="space-y-4 text-sm">
    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Actions</h3>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">👥 Change Members</button>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">🏷️ Edit Labels</button>
    <button className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md">📅 Change Due Date</button>
    <button className="w-full text-left p-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700">🗑️ Archive Card</button>
  </div>
);

// Mock fetch function (KEEP for non-comment activity, but REST calls should replace it)
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
    // Mock activity (excluding initial comments, as they will be fetched separately)
    activity: [
      // { id: 'a1', type: 'comment', user: 'Alice', text: 'Looks good!', timestamp: '2 hours ago' }, // Removed mock comment
      { id: 'a2', type: 'move', user: 'You', text: 'moved card to In Progress', timestamp: '1 hour ago' },
    ],
    members: [{ id: 'u1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' }],
  };
};

interface CardDetailModalProps {
  cardId: string;
  boardId: string; // Critical for the WebSocket join room logic
  socket: Socket; // Critical for real-time connection
  onClose: () => void;
  columnTitle: string;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ cardId, onClose, columnTitle, socket, boardId }) => {
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 💡 REAL-TIME COMMENTING STATE
  const [comments, setComments] = useState<CommentResponse[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState<string>('');
  const [submissionError, setSubmissionError] = useState<string>('');

  // --------------------------------------------------------
  // 💡 REAL-TIME LISTENER HANDLER (Called when server broadcasts 'commentPosted')
  // --------------------------------------------------------
  const handleNewComment = useCallback((comment: CommentResponse) => {
    // Only update state if the comment belongs to the card currently visible
    if (comment.cardId === cardId) {
        setComments((prevComments) => [...prevComments, comment]);
    }
  }, [cardId]);


  // --------------------------------------------------------
  // 💡 DATA FETCHING & SOCKET LISTENER SETUP
  // --------------------------------------------------------
  useEffect(() => {
    let active = true;
    setLoading(true);
    setCardData(null);
    setError('');

    const fetchCardDetail = async () => {
      try {
        // --- 1. REST Calls for Initial Data ---
        // NOTE: Replace mock fetch with actual backend endpoints
        const [carddetailRes, commentRes] = await Promise.allSettled([
          // Use the mock fetch for now, but in production, this should be fetch(`/api/card/${cardId}`)
          fetchDetailedCard(cardId), 
          // Use a dedicated REST endpoint for initial comments
          fetch(`/api/cards/${cardId}/comments`).then(res => res.json()) 
        ]);

        if (carddetailRes.status === 'fulfilled' && active) {
          setCardData(carddetailRes.value);
        } else {
          console.error("Failed to fetch card details!", carddetailRes.reason);
        }

        if (commentRes.status === 'fulfilled' && active) {
          const commentsData: CommentResponse[] = commentRes.value as CommentResponse[];
          // 💡 INITIAL LOAD: Set comments from REST API
          setComments(commentsData); 
        } else {
          console.error("Failed to fetch comments!", commentRes.reason);
        }
        
      } catch (err) {
        setError("Error fetching card details.");
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    // --- 2. SOCKET LISTENER SETUP ---
    // Join the board room (or ensure we are joined)
    if (socket && boardId) {
        // Assuming 'joinBoard' is emitted on initial board load, but safe to emit here too.
        // socket.emit('joinBoard', { boardId }); 
        socket.on('commentPosted', handleNewComment);
    }
    
    fetchCardDetail();

    // 3. Cleanup
    return () => {
      active = false;
      if (socket) {
          socket.off('commentPosted', handleNewComment);
      }
    };
  }, [cardId, socket, handleNewComment, boardId]);


  // --------------------------------------------------------
  // 💡 COMMENT SUBMISSION HANDLER (Emits 'postComment' event)
  // --------------------------------------------------------
  const handleSubmitComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (newComment.trim() === '' || isSubmitting) return;

      setSubmissionError('');
      setIsSubmitting(true);

      const payload = {
          cardId: cardId,
          text: newComment.trim(),
      };

      // Emit the event to the Gateway with an acknowledgment callback
      socket.emit('postComment', payload, (response: any) => {
          setIsSubmitting(false);

          if (response.event === 'error') {
              setSubmissionError(response.data.message || 'Failed to post comment.');
              return;
          }

          // Success: Clear the input field. 
          // The new comment is added to the state automatically by the socket.on('commentPosted') listener.
          setNewComment('');
      });
  };

  // --------------------------------------------------------
  // RENDER LOGIC
  // --------------------------------------------------------
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

        {/* Loading and Error States (Unchanged) */}
        {loading || !cardData ? (
          <div className="p-12 text-center w-full">
            {error ? 
                <p className="text-red-600">{error}</p> : 
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            }
          </div>
        ) : (
          <div className="flex flex-col md:flex-row overflow-y-auto">
            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8">
              {/* Title and Column Info (Unchanged) */}
              <input
                type="text"
                value={cardData.title}
                // ... (Title change handler)
                className="text-xl md:text-3xl font-bold w-full mb-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mb-6">In list: <span className="underline">{columnTitle}</span></p>

              {/* Description and Checklist (Unchanged) */}
              {/* ... */}
              
              {/* 💡 REVISED ACTIVITY/COMMENT SECTION */}
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">Activity</h3>
                
                {/* Comment Input Form */}
                <form onSubmit={handleSubmitComment} className="flex space-x-3 mb-4 items-end">
                    {/* User Avatar Placeholder (Should use current user's avatar) */}
                    <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">U</div>
                    
                    <textarea 
                        placeholder="Write a comment..." 
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none" 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        disabled={isSubmitting}
                        rows={3}
                    />
                    
                    <button 
                        type="submit"
                        disabled={isSubmitting || newComment.trim().length === 0}
                        className="p-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 h-10 flex-shrink-0"
                    >
                        {isSubmitting ? 'Sending...' : 'Send'}
                    </button>
                </form>
                
                {/* Submission Error Display */}
                {submissionError && <p className="text-red-500 text-sm mb-3 ml-10">{submissionError}</p>}


                {/* Combined Comments and Activity Feed */}
                <div className="space-y-3">
                    {/* 💡 1. Display REAL-TIME COMMENTS (from state) */}
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                                {/* Use avatarUrl if available */}
                                {comment.user.name ? comment.user.name[0] : 'U'}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {comment.user.name} 
                                    <span className="text-xs font-normal text-gray-500 ml-2">
                                       {/* Format the timestamp */}
                                       {new Date(comment.createdAt).toLocaleTimeString()}
                                    </span>
                                </p>
                                <p className="text-gray-700">{comment.text}</p>
                            </div>
                        </div>
                    ))}

                    {/* 💡 2. Display OTHER Activity (non-comments from initial data) */}
                    {cardData.activity 
                        .filter((item: any) => item.type !== 'comment') 
                        .map((item: any) => (
                        <div key={item.id} className="flex space-x-3 text-sm opacity-70">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold flex-shrink-0">{item.user[0]}</div>
                            <div>
                                <p className="font-semibold text-gray-900">{item.user} <span className="text-xs font-normal text-gray-500">{item.timestamp}</span></p>
                                <p className="text-gray-700">{item.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
              {/* End REVISED ACTIVITY/COMMENT SECTION */}

            </div>

            {/* Sidebar (Unchanged) */}
            <div className="w-full md:w-64 p-4 md:p-8 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50 flex-shrink-0">
                <SidebarActions card={cardData} />
                {/* ... (Assignee, Due Date, Labels displays) ... */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};