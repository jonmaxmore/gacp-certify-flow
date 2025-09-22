import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "upcoming" | "error";
}

interface AppleProgressProps {
  steps: ProgressStep[];
  className?: string;
}

const AppleProgress = React.forwardRef<HTMLDivElement, AppleProgressProps>(
  ({ steps, className }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        <nav aria-label="Progress">
          <ol className="overflow-hidden">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={cn(
                  stepIdx !== steps.length - 1 ? "pb-8" : "",
                  "relative"
                )}
              >
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className={cn(
                      "absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-border",
                      step.status === "completed" && "bg-success"
                    )}
                    aria-hidden="true"
                  />
                ) : null}
                
                <div className="group relative flex items-start">
                  <span className="flex h-8 items-center" aria-hidden="true">
                    <span
                      className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-apple-smooth",
                        step.status === "completed" &&
                          "border-success bg-success text-success-foreground",
                        step.status === "current" &&
                          "border-primary bg-primary text-primary-foreground shadow-apple-soft",
                        step.status === "upcoming" &&
                          "border-border bg-background text-muted-foreground",
                        step.status === "error" &&
                          "border-destructive bg-destructive text-destructive-foreground"
                      )}
                    >
                      {step.status === "completed" && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {step.status === "current" && (
                        <Circle className="h-4 w-4 fill-current" />
                      )}
                      {step.status === "upcoming" && (
                        <Circle className="h-4 w-4" />
                      )}
                      {step.status === "error" && (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </span>
                  </span>
                  
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span
                      className={cn(
                        "text-sm font-medium transition-apple-smooth",
                        step.status === "completed" && "text-success",
                        step.status === "current" && "text-primary",
                        step.status === "upcoming" && "text-muted-foreground",
                        step.status === "error" && "text-destructive"
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </span>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    );
  }
);

AppleProgress.displayName = "AppleProgress";

export { AppleProgress, type ProgressStep };