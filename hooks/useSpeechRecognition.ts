import { useState, useRef, useEffect, useCallback } from 'react';

// Fix: Add type definitions for the Web Speech API, which are not standard in TypeScript's DOM library.
interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
  error: string | null;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  permissionStatus: PermissionStatus;
}

const getSpeechRecognition = (): SpeechRecognitionStatic | undefined => {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
};

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const hasRecognitionSupport = !!getSpeechRecognition();

  useEffect(() => {
    if (!navigator.permissions) {
      setPermissionStatus('unavailable');
      return;
    }

    const checkPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(permission.state);
        permission.onchange = () => {
          setPermissionStatus(permission.state);
        };
      } catch (err) {
        console.error("Error checking microphone permission:", err);
        setPermissionStatus('unavailable');
      }
    };

    checkPermission();
  }, []);

  const handleResult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      setTranscript(prev => (prev ? prev + ' ' : '') + finalTranscript);
    }
  };

  const handleError = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === 'no-speech') {
        // User was silent, which is fine. Don't show an error.
        return;
    }
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      setError("마이크 접근이 거부되었습니다. 브라우저 사이트 설정에서 권한을 허용한 후 새로고침 해주세요.");
      setPermissionStatus('denied');
    } else if (event.error === 'network') {
      setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.");
    }
    else {
      setError(`음성 인식 오류: ${event.error}`);
    }
    setIsListening(false);
  };
  
  const handleEnd = () => {
    setIsListening(false);
  };

  const startListening = useCallback(() => {
    if (!hasRecognitionSupport || isListening) return;

    if (permissionStatus === 'denied') {
        setError("마이크 접근 권한이 없습니다. 브라우저 설정에서 권한을 허용해주세요.");
        return;
    }

    setError(null);
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'ko-KR';
    
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  }, [hasRecognitionSupport, isListening, permissionStatus]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return { isListening, transcript, startListening, stopListening, hasRecognitionSupport, error, setTranscript, permissionStatus };
};