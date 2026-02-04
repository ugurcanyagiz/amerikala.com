import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = "", src, alt = "Avatar", fallback, size = "md", status, ...props }, ref) => {
    const sizes: Record<string, { container: string; status: string }> = {
      xs: { container: "h-6 w-6 text-[10px]", status: "h-1.5 w-1.5" },
      sm: { container: "h-8 w-8 text-xs", status: "h-2 w-2" },
      md: { container: "h-10 w-10 text-sm", status: "h-2.5 w-2.5" },
      lg: { container: "h-12 w-12 text-base", status: "h-3 w-3" },
      xl: { container: "h-16 w-16 text-lg", status: "h-3.5 w-3.5" },
    };

    const statusColors: Record<string, string> = {
      online: "bg-[var(--color-success)]",
      offline: "bg-[var(--color-ink-tertiary)]",
      away: "bg-[var(--color-warning)]",
      busy: "bg-[var(--color-error)]",
    };

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div ref={ref} className={`relative inline-flex ${className}`} {...props}>
        <div
          className={`
            ${sizes[size].container}
            rounded-full overflow-hidden
            bg-[var(--color-primary-light)]
            flex items-center justify-center
            font-medium text-[var(--color-primary)]
            ring-2 ring-[var(--color-surface)]
          `}
        >
          {src ? (
            <img src={src} alt={alt} className="h-full w-full object-cover" />
          ) : (
            <span>{fallback ? getInitials(fallback) : "?"}</span>
          )}
        </div>
        {status && (
          <span
            className={`
              absolute bottom-0 right-0
              ${sizes[size].status}
              rounded-full
              ring-2 ring-[var(--color-surface)]
              ${statusColors[status]}
            `}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
