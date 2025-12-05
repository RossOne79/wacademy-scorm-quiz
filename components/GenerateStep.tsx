import React, { useState, useEffect, useCallback } from 'react';
import { VideoData, QuizQuestion, Difficulty, QuestionType } from '../types';
import { generateQuizAndObjectives } from '../services/geminiService';
import { ArrowLeftIcon } from './icons';
import ThemedButton from './ThemedButton';
import { getApiKey } from '../services/geminiKeyStorage';
import { useToast } from '../contexts/ToastContext';

interface GenerateStepProps {
  videoData: VideoData;
  transcript: string | null;
  onQuizGenerated: (objectives: string[], questions: QuizQuestion[]) => void;
  onBack: () => void;
}

const GenerateStep: React.FC<GenerateStepProps> = ({ videoData, transcript, onQuizGenerated, onBack }) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState('generating_ai');
  const [error, setError] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editingObjective, setEditingObjective] = useState<number | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const runGeneration = useCallback(async () => {
    // Controlla se la chiave API è presente
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("Inserisci prima la tua chiave API Gemini nell'header per generare il quiz.");
      setStatus('error');
      showToast("Inserisci prima la tua chiave Gemini nell'header", 'error');
      return;
    }

    setStatus('generating_ai');
    setError(null);
    try {
      const result = await generateQuizAndObjectives(videoData, transcript, apiKey);
      if (result) {
        setObjectives(result.learningObjectives);
        setQuestions(result.quizBank);
        // Select all questions by default
        setSelectedQuestions(new Set(result.quizBank.map((_, i) => i)));
        setStatus('complete');
      } else {
        throw new Error("Received no data from AI service.");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Si è verificato un errore durante la generazione AI.";
      setError(errorMessage);
      setStatus('error');
      showToast(errorMessage, 'error');
    }
  }, [videoData, transcript, showToast]);

  useEffect(() => {
    runGeneration();
  }, [runGeneration]);

  const handleRegenerate = () => {
    setObjectives([]);
    setQuestions([]);
    setSelectedQuestions(new Set());
    setEditingQuestion(null);
    setEditingObjective(null);
    runGeneration();
  };
  
  const handleProceed = () => {
    const selectedQuestionsArray = questions.filter((_, i) => selectedQuestions.has(i));
    onQuizGenerated(objectives, selectedQuestionsArray);
  };

  const toggleQuestionSelection = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map((_, i) => questions.indexOf(_))));
    }
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newQuestions = [...questions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    
    // Update selected indices
    const newSelected = new Set<number>();
    selectedQuestions.forEach(oldIndex => {
      if (oldIndex === draggedIndex) {
        newSelected.add(index);
      } else if (oldIndex < draggedIndex && oldIndex >= index) {
        newSelected.add(oldIndex + 1);
      } else if (oldIndex > draggedIndex && oldIndex <= index) {
        newSelected.add(oldIndex - 1);
      } else {
        newSelected.add(oldIndex);
      }
    });
    
    setQuestions(newQuestions);
    setSelectedQuestions(newSelected);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const filteredQuestions = questions.filter(q => {
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
        </button>
        <div className="text-center flex-grow">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Passo 2: Genera Quiz</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">L'IA sta creando i contenuti dal tuo media.</p>
        </div>
        <div className="w-8"></div>
      </div>
      
      {status === 'generating_ai' && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-16 h-16 border-4 border-primary-500 border-dashed rounded-full animate-spin"></div>
            <p>{transcript ? 'Analisi della trascrizione e generazione dei contenuti...' : 'Analisi del contesto media e generazione dei contenuti...'}</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p>{error}</p>
            <button onClick={handleRegenerate} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Riprova Generazione
            </button>
        </div>
      )}

      {status === 'complete' && (
        <div className="space-y-8">
            {/* Obiettivi di Apprendimento */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Obiettivi di Apprendimento</h3>
                <ul className="space-y-2">
                    {objectives.map((obj, i) => (
                        <li key={i} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                            {editingObjective === i ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={obj}
                                        onChange={(e) => updateObjective(i, e.target.value)}
                                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setEditingObjective(null)}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        ✓
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="flex-1 text-gray-600 dark:text-gray-300">{obj}</span>
                                    <button
                                        onClick={() => setEditingObjective(i)}
                                        className="text-sm text-blue-500 hover:text-blue-700"
                                    >
                                        Modifica
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Filtri e Statistiche */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold">Domande del Quiz</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedQuestions.size} di {questions.length} selezionate
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'all')}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                        >
                            <option value="all">Tutte le difficoltà</option>
                            <option value="easy">Facile</option>
                            <option value="medium">Media</option>
                            <option value="hard">Difficile</option>
                        </select>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as QuestionType | 'all')}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                        >
                            <option value="all">Tutti i tipi</option>
                            <option value="mcq">Scelta Multipla</option>
                            <option value="true_false">Vero/Falso</option>
                            <option value="short_answer">Risposta Breve</option>
                        </select>
                        <button
                            onClick={toggleSelectAll}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {selectedQuestions.size === filteredQuestions.length ? 'Deseleziona' : 'Seleziona'} Tutto
                        </button>
                    </div>
                </div>

                {/* Lista Domande */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredQuestions.map((q, displayIndex) => {
                        const actualIndex = questions.indexOf(q);
                        const isSelected = selectedQuestions.has(actualIndex);
                        const isEditing = editingQuestion === actualIndex;
                        
                        return (
                            <div
                                key={actualIndex}
                                draggable
                                onDragStart={() => handleDragStart(actualIndex)}
                                onDragOver={(e) => handleDragOver(e, actualIndex)}
                                onDragEnd={handleDragEnd}
                                className={`p-4 border-2 rounded-md transition-all cursor-move ${
                                    isSelected 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-gray-200 dark:border-gray-700'
                                } ${draggedIndex === actualIndex ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleQuestionSelection(actualIndex)}
                                        className="mt-1 w-5 h-5 cursor-pointer"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            {isEditing ? (
                                                <textarea
                                                    value={q.stem}
                                                    onChange={(e) => updateQuestion(actualIndex, 'stem', e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                    rows={2}
                                                    autoFocus
                                                />
                                            ) : (
                                                <p className="flex-1 font-semibold text-gray-900 dark:text-white">
                                                    {actualIndex + 1}. {q.stem}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => setEditingQuestion(isEditing ? null : actualIndex)}
                                                className={`px-2 py-1 text-sm rounded ${
                                                    isEditing 
                                                        ? 'bg-green-500 text-white hover:bg-green-600' 
                                                        : 'text-blue-500 hover:text-blue-700'
                                                }`}
                                            >
                                                {isEditing ? '✓' : 'Modifica'}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className={`px-2 py-1 rounded ${
                                                q.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            }`}>
                                                {q.difficulty === 'easy' ? 'Facile' : q.difficulty === 'medium' ? 'Media' : 'Difficile'}
                                            </span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                                                {q.type === 'mcq' ? 'Scelta Multipla' : q.type === 'true_false' ? 'Vero/Falso' : 'Risposta Breve'}
                                            </span>
                                            {q.tags.map((tag, ti) => (
                                                <span key={ti} className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <strong>Risposta:</strong> {q.correct_answer}
                                        </p>
                                        {transcript && q.source_timestamps.length > 0 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                📍 Timestamp: {q.source_timestamps.map(([start, end]) => 
                                                    `${Math.floor(start/60)}:${String(Math.floor(start%60)).padStart(2, '0')}`
                                                ).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Azioni */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <ThemedButton variant="secondary" onClick={handleRegenerate} className="w-full sm:w-auto">
                    Rigenera
                </ThemedButton>
                <ThemedButton
                    onClick={handleProceed}
                    disabled={selectedQuestions.size === 0}
                    className="w-full sm:w-auto"
                >
                    Procedi all'Impacchettamento ({selectedQuestions.size} domande)
                </ThemedButton>
            </div>
        </div>
      )}
    </div>
  );
};

export default GenerateStep;