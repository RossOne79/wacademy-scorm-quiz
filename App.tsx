import React, { useState, useCallback, useEffect } from 'react';
import { Step, QuizQuestion, SCORMSettings, VideoData } from './types';
import UploadStep from './components/UploadStep';
import GenerateStep from './components/GenerateStep';
import PackageStep from './components/PackageStep';
import { Header } from './components/Header';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import ThemeCustomizer from './components/ThemeCustomizer';
import ProgressBar from './components/ProgressBar';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';

// Session Restore Modal Component
const SessionRestoreModal: React.FC<{
  isOpen: boolean;
  onRestore: () => void;
  onNewSession: () => void;
}> = ({ isOpen, onRestore, onNewSession }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-fade-in">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Sessione Precedente Trovata
        </h2>
        
        {/* Description */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          È stata trovata una sessione di lavoro salvata. Vuoi continuare da dove avevi interrotto?
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onNewSession}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Nuova Sessione
          </button>
          <button
            onClick={onRestore}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Ripristina
          </button>
        </div>
      </div>
    </div>
  );
};

const MainAppContent: React.FC = () => {
  const { showToast } = useToast();
  const { saveSession, loadSession, clearSession, saveQuizHistory, getQuizHistory } = useSession();
  const [currentStep, setCurrentStep] = useState<Step>(Step.Upload);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [quizBank, setQuizBank] = useState<QuizQuestion[]>([]);
  const [scormSettings, setScormSettings] = useState<SCORMSettings>({
    scormVersion: '1.2',
    courseTitle: 'Il Mio Corso SCORM',
    numQuestions: 10,
    randomizeOrder: true,
    passingScore: 80,
    attemptLimit: 0,
    showVideoControls: false,
  });
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<any>(null);

  // Auto-save session on state changes
  useEffect(() => {
    if (videoData) {
      saveSession({
        currentStep,
        videoData,
        transcript,
        learningObjectives,
        quizBank,
        scormSettings,
      });
    }
  }, [currentStep, videoData, transcript, learningObjectives, quizBank, scormSettings]);

  // Load session on mount
  useEffect(() => {
    const session = loadSession();
    if (session && session.videoData) {
      setPendingSession(session);
      setShowRestoreModal(true);
    }
  }, []);

  const handleRestoreSession = () => {
    if (pendingSession) {
      setCurrentStep(pendingSession.currentStep);
      setVideoData(pendingSession.videoData);
      setTranscript(pendingSession.transcript);
      setLearningObjectives(pendingSession.learningObjectives);
      setQuizBank(pendingSession.quizBank);
      setScormSettings(pendingSession.scormSettings);
      showToast('Sessione ripristinata con successo!', 'success');
    }
    setShowRestoreModal(false);
    setPendingSession(null);
  };

  const handleNewSession = () => {
    clearSession();
    setShowRestoreModal(false);
    setPendingSession(null);
  };

  const handleVideoProcessed = useCallback((data: VideoData, transcriptContent: string | null) => {
    setVideoData(data);
    setTranscript(transcriptContent);
    setScormSettings(prev => ({ ...prev, courseTitle: data.file.name.replace(/\.[^/.]+$/, "") }));
    setCurrentStep(Step.Generate);
  }, []);

  const handleQuizGenerated = useCallback((objectives: string[], questions: QuizQuestion[]) => {
    setLearningObjectives(objectives);
    setQuizBank(questions);
    saveQuizHistory(objectives, questions);
    setCurrentStep(Step.Package);
    showToast(`Quiz generato con ${questions.length} domande!`, 'success');
  }, [saveQuizHistory, showToast]);

  const handleBack = () => {
    if (currentStep > Step.Upload) {
      setCurrentStep(currentStep - 1);
      showToast('Tornato allo step precedente', 'info');
    }
  };

  const handleStepNavigation = (step: Step) => {
    setCurrentStep(step);
  };

  const handleClearSession = () => {
    if (window.confirm('Vuoi davvero cancellare la sessione corrente?')) {
      clearSession();
      setCurrentStep(Step.Upload);
      setVideoData(null);
      setTranscript(null);
      setLearningObjectives([]);
      setQuizBank([]);
      setScormSettings({
        scormVersion: '1.2',
        courseTitle: 'Il Mio Corso SCORM',
        numQuestions: 10,
        randomizeOrder: true,
        passingScore: 80,
        attemptLimit: 0,
        showVideoControls: false,
      });
      showToast('Sessione cancellata', 'info');
    }
  };

  const handleRestoreHistory = (index: number) => {
    const history = getQuizHistory();
    if (history[index]) {
      setLearningObjectives(history[index].objectives);
      setQuizBank(history[index].questions);
      setShowHistoryMenu(false);
      showToast('Quiz ripristinato dalla cronologia', 'success');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.Upload:
        return <UploadStep onVideoProcessed={handleVideoProcessed} />;
      case Step.Generate:
        if (!videoData) return null;
        return <GenerateStep videoData={videoData} transcript={transcript} onQuizGenerated={handleQuizGenerated} onBack={handleBack} />;
      case Step.Package:
        if (!videoData || quizBank.length === 0) return null;
        return <PackageStep 
            videoData={videoData}
            learningObjectives={learningObjectives}
            quizBank={quizBank}
            settings={scormSettings}
            onSettingsChange={setScormSettings}
            onBack={handleBack}
        />;
      default:
        return <UploadStep onVideoProcessed={handleVideoProcessed} />;
    }
  };

  const quizHistory = getQuizHistory();

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <Header />
      
      {/* Progress Bar */}
      <ProgressBar 
        currentStep={currentStep} 
        onStepClick={handleStepNavigation}
        canNavigate={videoData !== null}
      />
        
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        {/* Theme Customizer */}
        <button
          onClick={() => setIsThemeCustomizerOpen(true)}
          className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
          title="Personalizza Tema"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </button>
        
        {/* Session Menu */}
        {videoData && (
          <button
            onClick={handleClearSession}
            className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
            title="Nuova Sessione"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        
        {/* Quiz History */}
        {quizHistory.length > 0 && currentStep === Step.Generate && (
          <div className="relative">
            <button
              onClick={() => setShowHistoryMenu(!showHistoryMenu)}
              className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
              title="Cronologia Quiz"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {showHistoryMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">Cronologia Generazioni</h3>
                </div>
                <div className="p-2">
                  {quizHistory.map((entry, index) => (
                    <button
                      key={entry.timestamp}
                      onClick={() => handleRestoreHistory(index)}
                      className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.questions.length} domande
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.timestamp).toLocaleString('it-IT')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ThemeCustomizer 
        isOpen={isThemeCustomizerOpen} 
        onClose={() => setIsThemeCustomizerOpen(false)} 
      />

      {/* Session Restore Modal */}
      <SessionRestoreModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreSession}
        onNewSession={handleNewSession}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SessionProvider>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="max-w-md w-full mx-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Video<span className="text-primary-600 dark:text-primary-400">→</span>Quiz SCORM
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Accedi per iniziare a creare pacchetti SCORM dai tuoi video
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <SignInButton mode="modal">
                      <button className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg">
                        Accedi
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="w-full px-6 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                        Registrati
                      </button>
                    </SignUpButton>
                  </div>
                </div>
              </div>
            </div>
          </SignedOut>
          <SignedIn>
            <MainAppContent />
          </SignedIn>
        </SessionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;