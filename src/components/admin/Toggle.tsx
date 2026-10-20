export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-brand" : "bg-line"}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-[left] ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}
