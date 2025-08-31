import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { MeetingNote } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { summarizeText } from '../services/geminiService';
import { MicIcon, StopIcon, PlayIcon, SparklesIcon, SaveIcon, TrashIcon } from './icons';

interface NoteEditorProps {
  note: MeetingNote | null;
  onSave: (note: MeetingNote) => void;
  onDelete: (id: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport, error: speechError, setTranscript, permissionStatus } = useSpeechRecognition();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSummary(note.summary);
      setTranscript('');
      setIsDirty(false);
    }
  }, [note, setTranscript]);
  
  useEffect(() => {
    if (transcript) {
        setContent(prev => (prev ? prev + ' ' : '') + transcript);
        setTranscript('');
        setIsDirty(true);
    }
  }, [transcript, setTranscript]);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = useCallback(() => {
    if (note) {
      onSave({ ...note, title, content, summary });
      setIsDirty(false);
    }
  }, [note, title, content, summary, onSave]);
  
  const handleDelete = () => {
    if (note && window.confirm(`"${note.title}" 노트를 삭제하시겠습니까?`)) {
      onDelete(note.id);
    }
  };

  const handleSummarize = async () => {
    if (!content) return;
    setIsSummarizing(true);
    const generatedSummary = await summarizeText(content);
    setSummary(generatedSummary);
    setIsSummarizing(false);
    setIsDirty(true);
  };
  
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (content) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (!note) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-800">
        <div className="text-center text-gray-500">
          <h2 className="text-2xl font-bold">회의 노트를 선택하거나</h2>
          <p>새 노트를 만들어 시작하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col bg-gray-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="회의 제목"
          className="bg-transparent text-3xl font-bold w-full focus:outline-none text-gray-100"
        />
        <div className="flex items-center space-x-2">
            {isDirty && (
                 <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white transition-colors duration-200" title="변경 사항 저장">
                    <SaveIcon className="w-5 h-5" />
                    <span>저장</span>
                 </button>
            )}
            <button onClick={handleDelete} className="p-2 rounded-md bg-gray-700 hover:bg-red-600 text-gray-200 hover:text-white transition-colors duration-200" title="노트 삭제">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-900/50 rounded-lg">
          {hasRecognitionSupport ? (
            isListening ? (
              <button onClick={stopListening} className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors duration-200 animate-pulse" title="녹음 중지">
                <StopIcon className="w-5 h-5" />
                <span>녹음 중지</span>
              </button>
            ) : (
              <button 
                onClick={startListening} 
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed" 
                title="녹음 시작"
                disabled={permissionStatus === 'denied'}
              >
                <MicIcon className="w-5 h-5" />
                <span>녹음 시작</span>
              </button>
            )
          ) : <p className="text-sm text-yellow-400">이 브라우저에서는 음성 인식을 지원하지 않습니다.</p>}
          
          <button onClick={handleSpeak} className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white transition-colors duration-200" disabled={!content} title={isSpeaking ? "읽기 중지" : "음성으로 읽기"}>
              {isSpeaking ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              <span>{isSpeaking ? '중지' : '읽기'}</span>
          </button>
          
          <button onClick={handleSummarize} className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-md text-white transition-colors duration-200" disabled={isSummarizing || !content} title="AI로 요약하기">
              <SparklesIcon className="w-5 h-5" />
              <span>{isSummarizing ? '요약 중...' : '요약'}</span>
          </button>
      </div>
      {permissionStatus === 'denied' && (
        <p className="text-red-400 text-sm mb-2">마이크 접근이 거부되었습니다. 음성 인식을 사용하려면 브라우저 설정에서 권한을 허용해주세요.</p>
      )}
      {speechError && <p className="text-red-400 text-sm mb-2">{speechError}</p>}
      
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
            <label htmlFor="content" className="text-sm font-medium text-gray-400 mb-2">음성 기록</label>
            <textarea
                id="content"
                ref={contentRef}
                value={content}
                onChange={handleContentChange}
                placeholder="녹음을 시작하거나 노트를 직접 입력하세요..."
                className="flex-grow w-full p-4 bg-gray-900 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
        </div>
        <div className="flex flex-col">
            <label htmlFor="summary" className="text-sm font-medium text-gray-400 mb-2">AI 요약</label>
            <div id="summary" className="flex-grow w-full p-4 bg-gray-900 rounded-md text-gray-200 prose prose-invert prose-sm max-w-none overflow-y-auto">
                {isSummarizing ? (
                     <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                     </div>
                ) : (
                    summary ? <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} /> : <p className="text-gray-500">요약 내용이 여기에 표시됩니다...</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;