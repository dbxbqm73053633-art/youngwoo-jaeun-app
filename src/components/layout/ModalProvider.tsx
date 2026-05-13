import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

type ModalContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  closeAll: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const closeAll = useCallback(() => {
    setPendingConfirm((current) => {
      current?.resolve(false);
      return null;
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => (
    new Promise<boolean>((resolve) => {
      setPendingConfirm({ ...options, resolve });
    })
  ), []);

  const value = useMemo<ModalContextValue>(() => ({
    confirm,
    closeAll,
  }), [closeAll, confirm]);

  const answer = (confirmed: boolean) => {
    pendingConfirm?.resolve(confirmed);
    setPendingConfirm(null);
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {pendingConfirm ? (
        <div className="confirmModal" role="presentation">
          <div className="confirmModal__backdrop" onClick={() => answer(false)} />
          <section className="confirmModal__panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h2 id="confirm-title">{pendingConfirm.title}</h2>
            <p>{pendingConfirm.message}</p>
            <div className="confirmModal__actions">
              <button className="btn btn--soft" type="button" onClick={() => answer(false)}>
                {pendingConfirm.cancelLabel || "취소"}
              </button>
              <button
                className={`btn ${pendingConfirm.destructive ? "btn--danger" : "btn--primary"}`}
                type="button"
                onClick={() => answer(true)}
              >
                {pendingConfirm.confirmLabel || "확인"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const value = useContext(ModalContext);
  if (!value) throw new Error("useModal must be used inside ModalProvider");
  return value;
}

export function useConfirm() {
  return useModal().confirm;
}
