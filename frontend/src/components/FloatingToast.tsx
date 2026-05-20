import { useEffect, useRef, useState, type CSSProperties } from "react";

type FloatingToastProps = {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
  variant?: "success" | "error";
  index?: number;
};

export function FloatingToast({
  message,
  onDismiss,
  durationMs = 3200,
  variant = "success",
  index = 0
}: FloatingToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const toastStyle = {
    ["--toast-duration"]: `${durationMs}ms`,
    ["--toast-offset"]: `${1.75 + index * 5.75}rem`
  } as CSSProperties;

  useEffect(() => {
    setIsVisible(true);

    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, durationMs);

    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, [durationMs, message]);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    dismissTimerRef.current = window.setTimeout(() => {
      onDismiss();
    }, 220);

    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, [isVisible, onDismiss]);

  return (
    <div
      className={`floating-toast floating-toast-${variant} ${isVisible ? "floating-toast-visible" : "floating-toast-hidden"}`}
      role="status"
      aria-live="polite"
      style={toastStyle}
    >
      <div className="floating-toast-card">
        <span>{message}</span>
        <span className="floating-toast-wick" aria-hidden="true" />
      </div>
    </div>
  );
}
