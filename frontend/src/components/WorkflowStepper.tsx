/**
 * WorkflowStepper Component
 * Vertical sidebar progress indicator for the RAG pipeline workflow
 */

import { Check, Upload, Scissors, Sparkles, Database, Search } from 'lucide-react';

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface WorkflowStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
}

const steps: WorkflowStep[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'chunk', label: 'Chunk', icon: Scissors },
  { id: 'embed', label: 'Embed', icon: Sparkles },
  { id: 'store', label: 'Store', icon: Database },
  { id: 'search', label: 'Search', icon: Search },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  const getStepStatus = (index: number) => {
    if (completedSteps.has(index)) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const canClickStep = (index: number) => {
    // Can click current step or any completed step
    return index === 0 || completedSteps.has(index) || index === currentStep;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Pipeline
      </h3>

      <div className="space-y-1">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          const isClickable = canClickStep(index);

          return (
            <div key={step.id}>
              <button
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={`w-full flex items-center gap-3 ${
                  isClickable ? 'cursor-pointer hover:bg-gray-700/50' : 'cursor-default'
                } rounded-lg p-2 transition-colors`}
              >
                {/* Step Circle */}
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all flex-shrink-0
                    ${
                      status === 'completed'
                        ? 'bg-green-900/30 border-green-500'
                        : status === 'current'
                        ? 'bg-primary-900/30 border-primary-500'
                        : 'bg-gray-700 border-gray-600'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Icon
                      className={`w-4 h-4 ${
                        status === 'current' ? 'text-primary-400' : 'text-gray-500'
                      }`}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${
                      status === 'completed'
                        ? 'text-green-400'
                        : status === 'current'
                        ? 'text-primary-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              </button>

              {/* Connector Line */}
              {!isLast && (
                <div className="ml-6 pl-px">
                  <div
                    className={`w-0.5 h-6 transition-all ${
                      completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
