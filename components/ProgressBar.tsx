import React from 'react';
import { Step } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ProgressBarProps {
  currentStep: Step;
  onStepClick?: (step: Step) => void;
  canNavigate?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, onStepClick, canNavigate = false }) => {
  const { theme } = useTheme();

  const steps = [
    { step: Step.Upload, label: 'Upload Media', icon: '📤' },
    { step: Step.Generate, label: 'Genera Quiz', icon: '🤖' },
    { step: Step.Package, label: 'Pacchetto SCORM', icon: '📦' },
  ];

  const handleStepClick = (step: Step) => {
    if (canNavigate && onStepClick && step <= currentStep) {
      if (window.confirm('Vuoi tornare a questo step? I dati non salvati potrebbero andare persi.')) {
        onStepClick(step);
      }
    }
  };

  return (
    <div className="w-full py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -z-10">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                backgroundColor: theme.primaryColor,
              }}
            />
          </div>

          {/* Steps */}
          {steps.map(({ step, label, icon }, index) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            const isClickable = canNavigate && step <= currentStep;

            return (
              <div
                key={step}
                className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
                onClick={() => handleStepClick(step)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'text-white shadow-lg'
                      : isCurrent
                      ? 'text-white shadow-xl scale-110'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                  style={
                    isCompleted || isCurrent
                      ? {
                          backgroundColor: theme.primaryColor,
                          boxShadow: isCurrent ? `0 0 20px ${theme.primaryColor}80` : undefined,
                        }
                      : undefined
                  }
                >
                  {isCompleted ? '✓' : icon}
                </div>
                <span
                  className={`mt-2 text-xs sm:text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'text-gray-900 dark:text-white font-bold'
                      : isCompleted
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {index + 1}/{steps.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
