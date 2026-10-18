import type { LucideIcon } from "lucide-react";

const VARIANTS = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  plain: "border border-line text-ink hover:bg-surface-2",
};

const SIZES = {
  lg: "h-12 px-4 text-[15px]",
  sm: "h-10 px-3 text-sm",
};

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  pressed?: boolean;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function ActionButton({
  icon: Icon,
  label,
  href,
  external,
  onClick,
  pressed,
  variant = "plain",
  size = "lg",
}: ActionButtonProps) {
  const className = `inline-flex flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,transform] active:scale-[0.97] ${VARIANTS[variant]} ${SIZES[size]}`;
  const content = (
    <>
      <Icon size={18} aria-hidden="true" />
      {label}
    </>
  );

  if (href) {
    return (
      <a href={href} className={className} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} className={className}>
      {content}
    </button>
  );
}
