
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import type { MeetingNote } from './types';

const App: React.FC = () => {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem('meeting-notes');
      if (storedNotes) {
        const parsedNotes: MeetingNote[] = JSON.parse(storedNotes);
        setNotes(parsedNotes);
        if (parsedNotes.length > 0) {
            // Select the most recent note on load
            const sortedNotes = [...parsedNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setCurrentNoteId(sortedNotes[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load notes from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('meeting-notes', JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save notes to localStorage", error);
    }
  }, [notes]);

  const handleNewNote = useCallback(() => {
    const newNote: MeetingNote = {
      id: `note_${Date.now()}`,
      title: 'New Meeting',
      content: '',
      summary: '',
      createdAt: new Date().toISOString(),
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setCurrentNoteId(newNote.id);
  }, []);
  
  const handleSelectNote = (id: string) => {
    setCurrentNoteId(id);
  };
  
  const handleSaveNote = useCallback((updatedNote: MeetingNote) => {
    setNotes(prevNotes => 
      prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note)
    );
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prevNotes => {
        const remainingNotes = prevNotes.filter(note => note.id !== id);
        if (currentNoteId === id) {
             const sortedRemaining = [...remainingNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
             setCurrentNoteId(sortedRemaining.length > 0 ? sortedRemaining[0].id : null);
        }
        return remainingNotes;
    });
  }, [currentNoteId]);

  const currentNote = notes.find(note => note.id === currentNoteId) || null;

  return (
    <div className="flex h-screen font-sans">
      <Sidebar 
        notes={notes} 
        currentNoteId={currentNoteId}
        onSelectNote={handleSelectNote}
        onNewNote={handleNewNote}
      />
      <main className="flex-grow w-3/4">
        <NoteEditor 
          note={currentNote}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      </main>
    </div>
  );
};

export default App;
