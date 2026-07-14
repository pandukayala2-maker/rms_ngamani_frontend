import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  className?: string;
}

const baseFieldClasses =
  "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps
>(({ label, error, className, id, ...props }, ref) => (
  <label className="block w-full">
    {label && <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>}
    <input ref={ref} id={id} className={clsx(baseFieldClasses, error && "ring-2 ring-red-500", className)} {...props} />
    {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
  </label>
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps
>(({ label, error, className, ...props }, ref) => (
  <label className="block w-full">
    {label && <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>}
    <textarea ref={ref} className={clsx(baseFieldClasses, "resize-none", error && "ring-2 ring-red-500", className)} {...props} />
    {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
  </label>
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldWrapperProps
>(({ label, error, className, children, ...props }, ref) => (
  <label className="block w-full">
    {label && <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>}
    <select ref={ref} className={clsx(baseFieldClasses, error && "ring-2 ring-red-500", className)} {...props}>
      {children}
    </select>
    {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
  </label>
));
Select.displayName = "Select";
