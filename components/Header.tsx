
import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, VideoCameraIcon } from './icons';
import { UserButton } from '@clerk/clerk-react';
import { getApiKey, setApiKey, clearApiKey, hasApiKey } from '../services/geminiKeyStorage';
import { useToast } from '../contexts/ToastContext';

export const Header: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showApiKeyMenu, setShowApiKeyMenu] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && prefersDark));
    setHasKey(hasApiKey());
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      showToast('Inserisci una chiave API valida', 'error');
      return;
    }
    if (setApiKey(apiKeyInput)) {
      setHasKey(true);
      setApiKeyInput('');
      setShowApiKeyMenu(false);
      showToast('Chiave API salvata solo sul tuo browser', 'success');
    } else {
      showToast('Errore nel salvataggio della chiave', 'error');
    }
  };

  const handleRemoveApiKey = () => {
    clearApiKey();
    setHasKey(false);
    setApiKeyInput('');
    setShowApiKeyMenu(false);
    showToast('Chiave API rimossa', 'info');
  };

  const handleOpenMenu = () => {
    const currentKey = getApiKey();
    setApiKeyInput(currentKey || '');
    setShowApiKeyMenu(true);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <VideoCameraIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Video<span className="text-primary-600 dark:text-primary-400">→</span>Quiz SCORM
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* API Key Menu */}
            <div className="relative">
              <button
                onClick={handleOpenMenu}
                className={`p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  hasKey ? 'text-green-600 dark:text-green-400' : ''
                }`}
                aria-label="Gestisci chiave API Gemini"
                title={hasKey ? 'Chiave API configurata' : 'Configura chiave API'}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>
              
              {showApiKeyMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowApiKeyMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Chiave API Gemini</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        La chiave è salvata solo nel tuo browser (localStorage) e inviata cifrata via HTTPS solo per generare il quiz.
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Chiave API
                        </label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="Inserisci la tua chiave API"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveApiKey}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition-colors"
                        >
                          {hasKey ? 'Aggiorna' : 'Salva'}
                        </button>
                        {hasKey && (
                          <button
                            onClick={handleRemoveApiKey}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="Attiva/disattiva modalità scura"
            >
              {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
};