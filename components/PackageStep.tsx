
import React, { useCallback, useState } from 'react';
import { VideoData, QuizQuestion, SCORMSettings } from '../types';
import { createScormPackage, testInBrowser } from '../services/scormService';
import { ArrowLeftIcon, CogIcon } from './icons';

interface PackageStepProps {
  videoData: VideoData;
  learningObjectives: string[];
  quizBank: QuizQuestion[];
  settings: SCORMSettings;
  onSettingsChange: (settings: SCORMSettings) => void;
  onBack: () => void;
}

const PackageStep: React.FC<PackageStepProps> = ({ 
  videoData, learningObjectives, quizBank, settings, onSettingsChange, onBack 
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = useCallback(async () => {
        setIsExporting(true);
        try {
            await createScormPackage({ videoData, learningObjectives, quizBank, settings });
        } catch (error) {
            console.error("Failed to create SCORM package:", error);
            alert("Si è verificato un errore durante la creazione del pacchetto SCORM. Controlla la console per i dettagli.");
        } finally {
            setIsExporting(false);
        }
    }, [videoData, learningObjectives, quizBank, settings]);

    const handleTest = useCallback(async () => {
      try {
          await testInBrowser({ videoData, learningObjectives, quizBank, settings });
      } catch (error) {
          console.error("Failed to test in browser:", error);
          alert("Si è verificato un errore durante l'apertura del test. Controlla la console per i dettagli.");
      }
  }, [videoData, learningObjectives, quizBank, settings]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
                </button>
                <div className="text-center flex-grow">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Passo 3: Impacchetta ed Esporta</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configura e scarica il tuo corso SCORM.</p>
                </div>
                <div className="w-8"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Settings Panel */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <CogIcon className="h-6 w-6 text-primary-600 dark:text-primary-400"/>
                      <h3 className="text-lg font-semibold">Impostazioni del Corso</h3>
                    </div>

                    <div>
                        <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titolo del Corso</label>
                        <input type="text" id="courseTitle" value={settings.courseTitle} onChange={e => onSettingsChange({...settings, courseTitle: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Versione SCORM</label>
                        <fieldset className="mt-2">
                            <div className="flex items-center space-x-4">
                                {(['1.2', '2004'] as const).map(version => (
                                    <div key={version} className="flex items-center">
                                        <input id={`scorm-${version}`} name="scormVersion" type="radio" value={version} checked={settings.scormVersion === version} onChange={e => onSettingsChange({...settings, scormVersion: e.target.value as '1.2' | '2004'})} className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                                        <label htmlFor={`scorm-${version}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{version === '2004' ? 'SCORM 2004 3ª Ed.' : 'SCORM 1.2'}</label>
                                    </div>
                                ))}
                            </div>
                        </fieldset>
                    </div>

                    <div>
                        <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numero di Domande</label>
                        <select id="numQuestions" value={settings.numQuestions} onChange={e => onSettingsChange({...settings, numQuestions: parseInt(e.target.value, 10) as SCORMSettings['numQuestions']})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                            {[5, 10, 15, 20].map(num => <option key={num} value={num} disabled={num > quizBank.length}> {num > quizBank.length ? `${num} (non sufficienti)` : num} </option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Punteggio di Superamento (%)</label>
                        <input type="number" id="passingScore" value={settings.passingScore} onChange={e => onSettingsChange({...settings, passingScore: parseInt(e.target.value, 10)})} min="0" max="100" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>

                    <div className="relative flex items-start">
                        <div className="flex h-5 items-center">
                            <input id="randomizeOrder" type="checkbox" checked={settings.randomizeOrder} onChange={e => onSettingsChange({...settings, randomizeOrder: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="randomizeOrder" className="font-medium text-gray-700 dark:text-gray-300">Ordina domande in modo casuale</label>
                        </div>
                    </div>

                    <div className="relative flex items-start">
                        <div className="flex h-5 items-center">
                            <input id="showVideoControls" type="checkbox" checked={settings.showVideoControls} onChange={e => onSettingsChange({...settings, showVideoControls: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="showVideoControls" className="font-medium text-gray-700 dark:text-gray-300">Mostra controlli media nativi</label>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Se disattivato, il media può essere controllato solo tramite il pulsante Play/Pausa (no seek avanti/indietro)</p>
                        </div>
                    </div>
                </div>

                {/* Preview & Actions */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Anteprima del Corso</h3>
                        <div className="mt-4 flex items-start space-x-4">
                            <img src={videoData.thumbnail} alt="Media thumbnail" className="w-24 h-16 object-cover rounded-md" />
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{settings.courseTitle}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Media di {Math.ceil(videoData.duration / 60)} min</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{Math.min(settings.numQuestions, quizBank.length)} domande</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3">
                        <button
                          onClick={handleExport}
                          disabled={isExporting}
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isExporting ? 'Impacchettamento...' : 'Esporta Pacchetto SCORM'}
                        </button>
                        <button
                          onClick={handleTest}
                          className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            Testa nel Browser
                        </button>
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default PackageStep;