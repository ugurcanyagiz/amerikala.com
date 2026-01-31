import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = "", src, alt = "Avatar", fallback, size = "md", status, ...props }, ref) => {
    const sizes = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-14 w-14 text-base",
      xl: "h-20 w-20 text-xl",
    };

    const statusColors = {
      online: "bg-green-500",
      offline: "bg-gray-400",
      away: "bg-yellow-500",
      busy: "bg-red-500",
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
      <div ref={ref} className={`relative inline-block ${className}`} {...props}>
        <div
          className={`
            ${sizes[size]} 
            rounded-full overflow-hidden 
            bg-gradient-to-br from-red-400 to-red-600
            flex items-center justify-center
            font-semibold text-white
            ring-2 ring-white dark:ring-neutral-950
            transition-smooth hover:scale-105
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
              block h-3 w-3 rounded-full 
              ring-2 ring-white dark:ring-neutral-950
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
