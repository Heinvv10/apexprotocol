import * as React from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastState {
  toasts: Toast[];
}

const TOAST_REMOVE_DELAY = 5000;

let toastCount = 0;
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE;
  return toastCount.toString();
}

// Simple toast state management
const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: "ADD_TOAST" | "REMOVE_TOAST"; toast?: Toast; toastId?: string }) {
  if (action.type === "ADD_TOAST" && action.toast) {
    memoryState = {
      toasts: [...memoryState.toasts, action.toast],
    };
  } else if (action.type === "REMOVE_TOAST") {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
    };
  }
  listeners.forEach((listener) => listener(memoryState));
}

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

export function toast({
  title,
  description,
  variant = "default",
}: Omit<Toast, "id">) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: { id, title, description, variant },
  });

  addToRemoveQueue(id);

  return { id };
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
  };
}
