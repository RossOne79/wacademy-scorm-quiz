import React, { createContext, useContext, ReactNode } from 'react';
import { VideoData, QuizQuestion, SCORMSettings, Step } from '../types';

export interface SessionData {
  timestamp: number;
  currentStep: Step;
  videoData: VideoData | null;
  transcript: string | null;
  learningObjectives: string[];
  quizBank: QuizQuestion[];
  scormSettings: SCORMSettings;
}

export interface QuizHistory {
  timestamp: number;
  objectives: string[];
  questions: QuizQuestion[];
}

interface SessionContextType {
  saveSession: (data: Omit<SessionData, 'timestamp'>) => void;
  loadSession: () => SessionData | null;
  clearSession: () => void;
  getSavedSessions: () => SessionData[];
  saveQuizHistory: (objectives: string[], questions: QuizQuestion[]) => void;
  getQuizHistory: () => QuizHistory[];
  clearQuizHistory: () => void;
}

const SESSION_STORAGE_KEY = 'video-scorm-session';
const SESSIONS_LIST_KEY = 'video-scorm-sessions-list';
const QUIZ_HISTORY_KEY = 'video-scorm-quiz-history';

// Helper sicuri per l'accesso a localStorage in contesti dove lo storage può essere bloccato
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('localStorage non disponibile, dati non persi ma non persistiti:', error);
  }
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage non disponibile, impossibile leggere i dati:', error);
    return null;
  }
};

const safeRemoveItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('localStorage non disponibile, impossibile rimuovere i dati:', error);
  }
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const saveSession = (data: Omit<SessionData, 'timestamp'>) => {
    const sessionData: SessionData = {
      ...data,
      timestamp: Date.now(),
    };
    
    // Save current session (se lo storage è disponibile)
    safeSetItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    
    // Add to sessions list (keep last 10)
    const sessions = getSavedSessions();
    const updatedSessions = [sessionData, ...sessions.slice(0, 9)];
    safeSetItem(SESSIONS_LIST_KEY, JSON.stringify(updatedSessions));
  };

  const loadSession = (): SessionData | null => {
    const stored = safeGetItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const clearSession = () => {
    safeRemoveItem(SESSION_STORAGE_KEY);
  };

  const getSavedSessions = (): SessionData[] => {
    const stored = safeGetItem(SESSIONS_LIST_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  };

  const saveQuizHistory = (objectives: string[], questions: QuizQuestion[]) => {
    const history = getQuizHistory();
    const newEntry: QuizHistory = {
      timestamp: Date.now(),
      objectives,
      questions,
    };
    
    // Keep last 20 generations
    const updatedHistory = [newEntry, ...history.slice(0, 19)];
    safeSetItem(QUIZ_HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const getQuizHistory = (): QuizHistory[] => {
    const stored = safeGetItem(QUIZ_HISTORY_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  };

  const clearQuizHistory = () => {
    safeRemoveItem(QUIZ_HISTORY_KEY);
  };

  return (
    <SessionContext.Provider
      value={{
        saveSession,
        loadSession,
        clearSession,
        getSavedSessions,
        saveQuizHistory,
        getQuizHistory,
        clearQuizHistory,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
