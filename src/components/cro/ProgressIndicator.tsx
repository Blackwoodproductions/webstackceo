import { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface Step {
  label: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  title?: string;
  subtitle?: string;
}

/**
 * Progress Indicator - Shows users how close they are to completing goals
 * Used in onboarding flows and checkout
 */
export const ProgressIndicator = memo(function ProgressIndicator({
  steps,
  title,
  subtitle,
}: ProgressIndicatorProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h4 className="font-semibold text-foreground">{title}</h4>}
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle} ({completedCount}/{steps.length} complete)
            </p>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-cyan-500 rounded-full"
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              {step.completed ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </motion.div>
              ) : step.current ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-primary/20">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                  <Circle className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <span
                className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                  step.completed
                    ? 'text-emerald-500'
                    : step.current
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector arrow */}
            {index < steps.length - 1 && (
              <ArrowRight
                className={`w-4 h-4 mx-2 flex-shrink-0 ${
                  steps[index + 1]?.completed || steps[index + 1]?.current
                    ? 'text-primary'
                    : 'text-muted-foreground/30'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ProgressIndicator;
