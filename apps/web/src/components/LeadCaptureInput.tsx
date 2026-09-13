"use client";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  onDebouncedChange?: (value: string) => void;
}

export function LeadCaptureInput({ label, onDebouncedChange, onChange, ...props }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input
        className="w-full border border-line rounded-lg px-3 py-2 bg-surface text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        onChange={(e) => {
          onChange?.(e);
          onDebouncedChange?.(e.target.value);
        }}
        {...props}
      />
    </div>
  );
}
