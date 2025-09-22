import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

interface Step {
  id: string;
  title: string;
  status: "completed" | "current" | "pending";
}

interface ProgressTrackerProps {
  steps: Step[];
  className?: string;
}

export function ProgressTracker({ steps, className }: ProgressTrackerProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center space-y-2">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-smooth",
                  {
                    "bg-success border-success text-white shadow-glow": step.status === "completed",
                    "bg-primary border-primary text-white shadow-medium animate-pulse": step.status === "current",
                    "bg-background border-muted text-muted-foreground": step.status === "pending",
                  }
                )}
              >
                {step.status === "completed" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-medium transition-smooth",
                    {
                      "text-success": step.status === "completed",
                      "text-primary": step.status === "current",
                      "text-muted-foreground": step.status === "pending",
                    }
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    "h-0.5 w-full transition-smooth",
                    {
                      "bg-success shadow-soft": steps[index + 1]?.status === "completed",
                      "bg-gradient-to-r from-success to-primary": 
                        step.status === "completed" && steps[index + 1]?.status === "current",
                      "bg-muted": step.status === "pending" || steps[index + 1]?.status === "pending",
                    }
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}