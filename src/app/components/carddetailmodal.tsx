"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, BoardMember } from "@/types/board";
import { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { Save, Trash2, Loader2, Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAlerts } from "@/hooks/useAlerts";

interface CommentResponse {
  id: string;
  text: string;
  createdAt: string;
  cardId: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl?: string;
  };
}

interface DetailedCard extends Card {
  activity: any[];
  members: BoardMember[];
}

const SidebarActions = ({
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  hasChanges,
  saveError,
}: {
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  hasChanges: boolean;
  saveError: string;
}) => (
  <div className="space-y-3 text-sm">
    <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-dark-secondary mb-2">
      Actions
    </h3>

    <button
      onClick={onSave}
      disabled={isSaving || !hasChanges}
      className="w-full flex items-center gap-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-dark-elevated dark:disabled:text-gray-500 text-white rounded-md transition-colors disabled:cursor-not-allowed"
    >
      {isSaving ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Saving...
        </>
      ) : (
        <>
          <Save size={16} /> Save Changes
        </>
      )}
    </button>

    {saveError && (
      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{saveError}</p>
    )}

    <button
      onClick={onDelete}
      disabled={isDeleting || isSaving}
      className="w-full flex items-center gap-2 p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-dark-elevated dark:disabled:text-gray-500 text-white rounded-md transition-colors disabled:cursor-not-allowed"
    >
      {isDeleting ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Deleting...
        </>
      ) : (
        <>
          <Trash2 size={16} /> Delete Card
        </>
      )}
    </button>
  </div>
);

interface CardDetailModalProps {
  cardId: string;
  boardId: string;
  socket: Socket | null;
  onClose: () => void;
  onDelete?: (cardId: string) => void | Promise<void>; 
  columnTitle: string;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  cardId,
  onClose,
  onDelete,
  columnTitle,
  socket,
  boardId,
}) => {
  const { status } = useSession();
  const alerts = useAlerts(); // Explicitly resolve theme-aware alerts
  
  const [cardData, setCardData] = useState<DetailedCard | null>(null);
  const [originalCardData, setOriginalCardData] = useState<DetailedCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState<string>("");
  const [submissionError, setSubmissionError] = useState<string>("");
  const [newTag, setNewTag] = useState<string>("");
  const [socketConnected, setSocketConnected] = useState(
    socket?.connected || false
  );

  const hasChanges =
    cardData &&
    originalCardData &&
    (cardData.title !== originalCardData.title ||
      cardData.description !== originalCardData.description ||
      cardData.tags?.length !== originalCardData.tags?.length ||
      !cardData.tags?.every((t) => originalCardData.tags?.includes(t)));

  const handleSaveCard = async () => {
    if (!cardData || !hasChanges) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const response = await apiFetch(`/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cardData.title,
          description: cardData.description,
          tags: cardData.tags,
        }),
      });

      if (!response.ok) throw new Error("Failed to save card");

      const { card } = await response.json();

      const updatedCard = { ...cardData, ...card };
      setCardData(updatedCard);
      setOriginalCardData(updatedCard);

      if (socket?.connected) {
        socket.emit("cardUpdated", {
          cardId,
          boardId,
          title: card.title,
          description: card.description,
          tags: card.tags,
        });
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes");
      setTimeout(() => setSaveError(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    const confirmed = await alerts.confirmDanger(
      "Delete Card?",
      `Are you sure you want to delete "${cardData?.title}"? This action cannot be undone.`,
      "Yes, delete it!"
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // 🛠️ FIX: Delegate to the parent to prevent the double API request 404 error
      if (onDelete) {
        await onDelete(cardId);
      } else {
        // Fallback just in case no parent handler was provided
        const response = await apiFetch(`/cards/${cardId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete card");

        if (socket?.connected) {
          socket.emit("deleteCard", {
            cardId,
            boardId,
            columnId: cardData?.columnId,
          });
        }
      }
      
      onClose(); // Safely close the modal on success
      
    } catch (err: any) {
      setIsDeleting(false); // Stop the spinner if it fails
      
      // Fallback error alert if there's no parent to handle the UI error feedback
      if (!onDelete) {
        alerts.error("Delete Failed", err.message || "Failed to delete card.");
      }
    }
  };
  const handleAddTag = () => {
    if (!cardData || !newTag.trim()) return;
    if (!cardData.tags?.includes(newTag.trim())) {
      setCardData({ ...cardData, tags: [...(cardData.tags || []), newTag.trim()] });
    }
    // FIX: Use the setter function instead of the string variable
    setNewTag(""); 
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!cardData) return;
    setCardData({
      ...cardData,
      tags: cardData.tags?.filter((t) => t !== tagToRemove) || [],
    });
  };

  useEffect(() => {
    if (!socket) return;
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    setSocketConnected(socket.connected);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const handleNewComment = useCallback(
    (comment: CommentResponse) => {
      if (comment.cardId === cardId) {
        setComments((prev) => [...prev, comment]);
        setIsSubmitting((isCurrentlySubmitting) => {
          // Only wipe the input box if WE were the ones waiting for a submission
          if (isCurrentlySubmitting) {
            setNewComment("");
            setSubmissionError("");
          }
          return false; // Always unlock the UI
        });
      }
    },
    [cardId]
  );

  const handleCommentError = useCallback((payload: { message: string }) => {
    setIsSubmitting(false);
    setSubmissionError(payload.message || "Failed to post comment.");
  }, []);

  const handleSocketException = useCallback((err: any) => {
    setIsSubmitting(false);
    setSubmissionError(err?.message || "Server rejected the request (Unauthorized).");
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("commentPosted", handleNewComment);
    socket.on("commentError", handleCommentError);
    socket.on("exception", handleSocketException);
    return () => {
      socket.off("commentPosted", handleNewComment);
      socket.off("commentError", handleCommentError);
      socket.off("exception", handleSocketException);
    };
  }, [socket, handleNewComment, handleCommentError, handleSocketException]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;
    setLoading(true);

    const fetchCardDetail = async () => {
      try {
        const [cardRes, commentRes] = await Promise.allSettled([
          apiFetch(`/cards/${cardId}`).then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          }),
          apiFetch(`/cards/${cardId}/comments`).then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          }),
        ]);

        if (cardRes.status === "fulfilled" && active) {
          setCardData(cardRes.value.card);
          setOriginalCardData(cardRes.value.card);
        } else {
          if (active) setError("Failed to load card details");
        }

        if (commentRes.status === "fulfilled" && active) {
          setComments(commentRes.value);
        }
      } catch {
        if (active) setError("Error fetching card details.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCardDetail();

    return () => {
      active = false;
    };
  }, [cardId, status]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !socket || !socketConnected) return;

    setIsSubmitting(true);
    setSubmissionError("");

    // Emit cleanly. Do NOT add a callback function at the end.
    socket.emit("postComment", { cardId, text: newComment.trim(), boardId });
    
    // Fallback: If the server stays totally silent, safely unlock the UI
    setTimeout(() => {
      setIsSubmitting((prev) => {
        if (prev) {
          setSubmissionError("Request timed out. Please check your connection.");
          return false;
        }
        return prev;
      });
    }, 5000);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffMins = Math.floor(
      (new Date().getTime() - date.getTime()) / 60000
    );
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full h-full md:h-auto max-w-4xl mx-auto px-2 md:px-4 flex items-center justify-center">
      <div
        className="relative bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-dark-elevated rounded-full w-8 h-8 flex items-center justify-center font-bold z-10 transition-colors"
        >
          &times;
        </button>

        {loading || !cardData ? (
          <div className="p-12 text-center w-full">
            {error ? (
              <p className="text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <p className="animate-pulse text-gray-700 dark:text-gray-300">Loading...</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row overflow-y-auto">
            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8">
              <input
                type="text"
                value={cardData.title}
                onChange={(e) =>
                  setCardData({ ...cardData, title: e.target.value })
                }
                className="text-xl md:text-3xl font-bold w-full mb-2 p-1 rounded bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                In list: <span className="underline">{columnTitle}</span>
              </p>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <textarea
                  value={cardData.description || ""}
                  onChange={(e) =>
                    setCardData({ ...cardData, description: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-md focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-dark-elevated text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  rows={4}
                  placeholder="Add a detailed description..."
                />
              </div>

              {/* Activity / Comments */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity</h3>
                
                <form
                  onSubmit={handleSubmitComment}
                  className="flex space-x-3 mb-2"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-200 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-800 dark:text-indigo-200">
                    U
                  </div>
                  <input
                    type="text"
                    placeholder={
                      socketConnected
                        ? "Write a comment..."
                        : "Connecting…"
                    }
                    className="flex-1 p-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-elevated text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmitting || !socketConnected}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !socketConnected || !newComment.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300 dark:disabled:bg-dark-elevated disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors min-w-[70px] flex justify-center items-center"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Send"}
                  </button>
                </form>

                {submissionError && (
                  <p className="text-xs text-red-600 dark:text-red-400 ml-11 mb-4">
                    {submissionError}
                  </p>
                )}

                <div className="space-y-4 mt-6">
                  {comments.map((c) => (
                    <div key={c.id} className="flex space-x-3">
                      <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-900/40 flex justify-center items-center font-bold text-sm text-blue-800 dark:text-blue-200 uppercase flex-shrink-0">
                        {c.user?.name ? c.user.name.charAt(0) : "U"}
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-elevated p-3 rounded-lg flex-1 border border-transparent dark:border-dark-border">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          {c.user?.name || "Unknown User"}{" "}
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">
                            {formatTimestamp(c.createdAt)}
                          </span>
                        </p>
                        <p className="text-sm mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-64 p-4 md:p-8 bg-gray-50 dark:bg-dark-elevated border-l border-gray-100 dark:border-dark-border flex-shrink-0">
              <SidebarActions
                onSave={handleSaveCard}
                onDelete={handleDeleteCard}
                isSaving={isSaving}
                isDeleting={isDeleting}
                hasChanges={!!hasChanges}
                saveError={saveError}
              />

              {/* Labels */}
              <div className="mt-8">
                <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-dark-secondary mb-2">
                  Labels
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cardData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium flex items-center gap-1 group border border-transparent dark:border-indigo-800/50"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-indigo-400 dark:text-indigo-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New label..."
                    className="w-full text-xs p-1.5 border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <button
                    onClick={handleAddTag}
                    className="p-1.5 bg-gray-200 dark:bg-dark-surface dark:border dark:border-dark-border dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};