import { useEffect } from "react";
import type { ReactNode } from "react";
import { IconX } from "./ui/Icons";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
};

export default function Modal({ open, title, subtitle, children, onClose, footer, wide }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal${wide ? " wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>{title}</div>
            {subtitle && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 6, borderRadius: 6 }}
            title="Fechar"
          >
            <IconX size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {children}
        </div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
