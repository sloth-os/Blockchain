import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, ExternalLink, X } from "lucide-react";
import { sources } from "./content";

export function SourceLink({ id }: { id: string }) {
  const source = sources[id];
  if (!source) return null;
  return (
    <a
      className="source-link"
      href={source.url}
      title={source.title}
      aria-label={`${source.title} — ${source.publisher}`}
      target="_blank"
      rel="noreferrer"
    >
      <ExternalLink size={12} />
      {source.publisher}
      <ArrowUpRight size={12} />
    </a>
  );
}
export function Range({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <label className="range-field">
      <span className="range-label">
        {label}
        <strong>
          {value.toLocaleString()}
          <small> {unit}</small>
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
export function Dialog({
  title,
  onClose,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      className={`dialog ${className}`}
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-header">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
