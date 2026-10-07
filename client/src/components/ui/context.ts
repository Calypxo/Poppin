import { createContext, useContext } from "react";
import type { AlertVariant } from "./Alert";
import type { ConfirmOptions } from "./ConfirmDialog";
export interface UIContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: Record<AlertVariant, (message: string) => void>;
}
export const UIContext = createContext<UIContextValue | null>(null);
export function useUI() {
  const value = useContext(UIContext);
  if (!value) throw new Error("UIProvider is required");
  return value;
}
