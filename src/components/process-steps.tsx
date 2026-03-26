"use client";

import { CheckCircle2 } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface ProcessStepsProps {
  steps: Step[];
  currentStep?: number;
}

export function ProcessSteps({ steps, currentStep }: ProcessStepsProps) {
  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card px-4 py-3">
      {steps.map((step, i) => {
        const isCompleted = currentStep !== undefined && i < currentStep;
        const isCurrent = currentStep !== undefined && i === currentStep;

        return (
          <div key={step.label} className="flex items-center gap-1">
            {i > 0 && (
              <div className={`mx-2 h-px w-6 shrink-0 ${isCompleted ? "bg-primary" : "bg-border"}`} />
            )}
            <div className="flex shrink-0 items-center gap-2">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
              )}
              <div className="min-w-0">
                <p className={`whitespace-nowrap text-[13px] font-medium ${
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="whitespace-nowrap text-[11px] text-muted-foreground">{step.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
