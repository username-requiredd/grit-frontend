// components/BoardCard.tsx
import { Board, BoardMember } from '@/types/board';
import Link from 'next/link';

interface BoardCardProps {
  board: Board;
}

const MemberAvatars: React.FC<{ members: BoardMember[] }> = ({ members }) => (
  <div className="flex -space-x-2 overflow-hidden">
    {members.slice(0, 3).map((member) => (
      <img
        key={member.id}
        className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
        src={member.avatarUrl}
        alt={member.name}
        title={member.name}
      />
    ))}
    {members.length > 3 && (
      <span className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 text-xs font-medium text-gray-700">
        +{members.length - 3}
      </span>
    )}
  </div>
);

export const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  return (
    <Link href={`/board/${board.id}`}>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition duration-300 cursor-pointer flex flex-col justify-between h-48">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-900">{board.title}</h3>
            {/* Star Icon for favorites - portfolio-worthy feature */}
            <svg className={`w-5 h-5 ${board.isStarred ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.817 2.05a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.817-2.05a1 1 0 00-1.175 0l-2.817 2.05c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{board.description}</p>
        </div>
        <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between items-center">
          <MemberAvatars members={board.members} />
          <span className="text-xs text-gray-400">Last activity: {board.lastActivity}</span>
        </div>
      </div>
    </Link>
  );
};