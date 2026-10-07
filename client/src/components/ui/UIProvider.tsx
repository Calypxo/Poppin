import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import ConfirmDialog, { type ConfirmOptions } from "./ConfirmDialog";
import Alert, { type AlertVariant } from "./Alert";
import { UIContext } from "./context";
interface Notice {
  id: number;
  variant: AlertVariant;
  message: string;
}
function Toast({
  notice,
  dismiss,
}: {
  notice: Notice;
  dismiss: (id: number) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pause = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const resume = () => {
    pause();
    timer.current = setTimeout(() => dismiss(notice.id), 6500);
  };
  useEffect(() => {
    timer.current = setTimeout(() => dismiss(notice.id), 6500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dismiss, notice.id]);
  return (
    <div
      className="poppin-toast"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) resume();
      }}
    >
      <Alert variant={notice.variant} onDismiss={() => dismiss(notice.id)}>
        {notice.message}
      </Alert>
    </div>
  );
}
export default function UIProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolve = useRef<((value: boolean) => void) | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const sequence = useRef(0);
  const location = useLocation();
  const close = useCallback((value: boolean) => {
    resolve.current?.(value);
    resolve.current = null;
    setDialog(null);
  }, []);
  useEffect(() => () => close(false), [location.key, close]);
  const dismiss = useCallback(
    (id: number) =>
      setNotices((current) => current.filter((notice) => notice.id !== id)),
    [],
  );
  const value = useMemo(
    () => ({
      confirm: (options: ConfirmOptions) =>
        new Promise<boolean>((done) => {
          resolve.current?.(false);
          resolve.current = done;
          setDialog(options);
        }),
      toast: Object.fromEntries(
        (["success", "error", "warning", "info"] as const).map((variant) => [
          variant,
          (message: string) => {
            const id = ++sequence.current;
            setNotices((current) => [
              ...current.slice(-2),
              { id, variant, message },
            ]);
          },
        ]),
      ) as Record<AlertVariant, (message: string) => void>,
    }),
    [],
  );
  return (
    <UIContext.Provider value={value}>
      {children}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          open
          onClose={() => close(false)}
          onConfirm={() => close(true)}
        />
      )}
      {createPortal(
        <div className="poppin-toast-stack" aria-label="Notifications">
          {notices.map((notice) => (
            <Toast key={notice.id} notice={notice} dismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </UIContext.Provider>
  );
}
