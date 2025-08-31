
import React from 'react';
import type { MeetingNote } from '../types';
import { PlusIcon } from './icons';

interface SidebarProps {
  notes: MeetingNote[];
  currentNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ notes, currentNoteId, onSelectNote, onNewNote }) => {
  const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="w-1/4 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-teal-400">Meeting Scribe AI</h1>
        <button
          onClick={onNewNote}
          className="p-2 rounded-md bg-gray-700 hover:bg-teal-500 text-gray-200 hover:text-white transition-colors duration-200"
          title="New Meeting Note"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {sortedNotes.length > 0 ? (
          <ul>
            {sortedNotes.map(note => (
              <li key={note.id}>
                <button
                  onClick={() => onSelectNote(note.id)}
                  className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-700 transition-colors duration-200 ${
                    note.id === currentNoteId ? 'bg-teal-800/50' : ''
                  }`}
                >
                  <h2 className="font-semibold truncate text-gray-100">{note.title}</h2>
                  <p className="text-sm text-gray-400 truncate mt-1">
                    {note.content || 'No content yet...'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No meetings recorded yet.</p>
            <p>Click the '+' button to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
