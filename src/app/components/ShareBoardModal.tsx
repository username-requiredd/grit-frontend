"use client";

import React, { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAlerts } from "@/hooks/useAlerts";

interface ShareBoardModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareBoardModal: React.FC<ShareBoardModalProps> = ({ boardId, isOpen, onClose }) => {
  const alerts = useAlerts(); // Explicitly resolve theme-aware alerts
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to invite user");

      alerts.success("User Invited!", `${email} has been added to the board.`, 2000);
      
      setEmail("");
      onClose();
    } catch (error: any) {
      alerts.error("Invitation Failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <UserPlus size={20} className="text-indigo-600" /> Share Board
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-light">&times;</button>
        </div>
        
        <form onSubmit={handleInvite} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full p-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-elevated text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-elevated text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="editor">Editor (Can edit cards and columns)</option>
              <option value="viewer">Viewer (Read-only access)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting || !email} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};