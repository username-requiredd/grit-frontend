"use client";

import { useState, useMemo } from 'react';
import { Board, BoardMember, BoardInvitation } from '@/types/board';
import { BoardCard } from '../components/BoardCard';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useApi } from '@/hooks/useApi';
import { apiFetch } from '@/lib/apiFetch'; 
import { AlertTriangle, RefreshCw, LayoutGrid, Check, X, Mail } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { SessionDiagnostics } from '@/components/SessionDiagnostics';
const EmptyState = ({ onCreateBoard }: { onCreateBoard: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
    <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shadow-inner mb-6">
      <LayoutGrid className="text-indigo-400 dark:text-indigo-500" size={36} strokeWidth={1.5} />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-primary mb-2">No boards yet</h2>
    <p className="text-sm text-gray-500 dark:text-dark-secondary max-w-xs mb-8 leading-relaxed">
      You don&apos;t have any boards yet. Create your first one to get started.
    </p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
    <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center shadow-inner mb-6">
      <AlertTriangle className="text-red-500 dark:text-red-400" size={36} strokeWidth={1.5} />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-primary mb-2">Something went wrong</h2>
    <p className="text-sm text-gray-500 dark:text-dark-secondary max-w-sm mb-1 leading-relaxed">{message}</p>
    <button onClick={onRetry} className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md transition-all">
      <RefreshCw size={15} /> Try again
    </button>
  </div>
);

export default function BoardsDashboardPage() {
  const alerts = useAlerts(); // Explicitly resolve theme-aware alerts

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'boards' | 'invites'>('boards');

  const { data: boardsData, error: boardsError, isLoading: boardsLoading, refetch: refetchBoards } = useApi<any>('/boards');
  const { data: invitesData, isLoading: invitesLoading, refetch: refetchInvites } = useApi<any>('/invitations');

  const is404 = typeof boardsError === 'string' && boardsError.includes('404');

  const boards: Board[] = useMemo(() => {
    const rawBoards = Array.isArray(boardsData) ? boardsData : boardsData?.boards;
    if (!rawBoards || !Array.isArray(rawBoards)) return [];

    return rawBoards.map((b: any) => {
      const membersList: BoardMember[] = [];
      if (b.owner) membersList.push({ id: b.owner.id, name: b.owner.name || 'Unknown', avatarUrl: b.owner.image || `https://ui-avatars.com/api/?name=${b.owner.name || 'U'}` });
      if (b.members) b.members.forEach((m: any) => {
        if (m.user?.id !== b.owner?.id) membersList.push({ id: m.user.id, name: m.user.name || 'Unknown', avatarUrl: m.user.image || `https://ui-avatars.com/api/?name=${m.user.name || 'U'}` });
      });
      return { id: b.id, title: b.title, description: b.description || '', isStarred: b.isStarred || false, memberIds: membersList.map(m => m.id), members: membersList, lastActivity: b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : 'Recently' };
    });
  }, [boardsData]);

  const invites: BoardInvitation[] = useMemo(() => {
    const rawInvites = Array.isArray(invitesData) ? invitesData : invitesData?.invitations;
    return Array.isArray(rawInvites) ? rawInvites : [];
  }, [invitesData]);

  const filteredBoards = boards.filter(board => board.title.toLowerCase().includes(searchTerm.toLowerCase()) || board.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateBoard = async (title: string, description: string) => {
    const response = await apiFetch('/boards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || 'Failed to create board');
    await refetchBoards();
  };

  const handleInviteAction = async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      const response = await apiFetch(`/invitations/${inviteId}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Failed to ${action} invitation`);
      
      await Promise.all([refetchBoards(), refetchInvites()]);
      
      if (action === 'accept') {
        alerts.success('Joined!', 'You now have access to this board.', 2000);
      }
    } catch (error: any) {
      alerts.error('Action Failed', error.message);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    const confirmed = await alerts.confirmDanger(
      'Delete Board?',
      "This will permanently delete the board, all its columns, cards, and comments. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const response = await apiFetch(`/boards/${boardId}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete board');
      }

      await refetchBoards();

      alerts.success('Deleted!', 'Your board has been deleted.', 1500);
    } catch (error: any) {
      alerts.error('Error', error.message);
    }
  };

  return (
    <>
      <SessionDiagnostics />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-dark-primary">Your Workspace</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
            <ProfileDropdown />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex space-x-6 border-b border-gray-200 dark:border-dark-border mb-6">
            <button 
              onClick={() => setActiveTab('boards')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative ${activeTab === 'boards' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              My Boards
              {activeTab === 'boards' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('invites')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'invites' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Invitations
              {invites.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{invites.length}</span>
              )}
              {activeTab === 'invites' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
            </button>
          </div>

          {activeTab === 'boards' ? (
            <>
              {(!boardsError || is404) && (
                <div className="flex items-center justify-between gap-4 mb-6">
                  <input
                    type="text" placeholder="Search boards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 sm:flex-none p-2 border border-gray-300 dark:border-dark-border rounded-lg w-full sm:w-64 focus:ring-indigo-500 bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
                  />
                  <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">
                    + Create Board
                  </button>
                </div>
              )}

              {boardsError && !is404 ? (
                <ErrorState message={boardsError} onRetry={refetchBoards} />
              ) : boardsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-200 dark:bg-dark-surface rounded-lg animate-pulse" />)}
                </div>
              ) : is404 || filteredBoards.length === 0 ? (
                searchTerm ? <p className="text-center text-gray-500 mt-10">No matching boards found.</p> : <EmptyState onCreateBoard={() => setIsModalOpen(true)} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBoards.map((board) => <BoardCard key={board.id} board={board} onDelete={handleDeleteBoard} />)}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {invitesLoading ? (
                <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-gray-400" /></div>
              ) : invites.length === 0 ? (
                <div className="text-center py-20">
                  <Mail className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No pending invitations</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">When someone shares a board with you, it will appear here.</p>
                </div>
              ) : (
                invites.map((invite) => (
                  <div key={invite.id} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{invite.board.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        Invited by <span className="font-medium text-gray-700 dark:text-gray-300">{invite.invitedBy.name || invite.invitedBy.email}</span> 
                        as <span className="uppercase text-[10px] tracking-wider font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{invite.role}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleInviteAction(invite.id, 'decline')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated transition flex items-center gap-2 text-sm font-medium">
                        <X size={16} /> Decline
                      </button>
                      <button onClick={() => handleInviteAction(invite.id, 'accept')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium">
                        <Check size={16} /> Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <CreateBoardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateBoard} />
    </>
  );
}