export default function WindowChrome({
  filename,
  variant = "default",
  className = "",
  contentClassName = "",
  children,
}: {
  filename: string;
  variant?: "default" | "build-this";
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const borderColor =
    variant === "build-this"
      ? "border-primary/30"
      : "border-border";

  return (
    <div className={`border ${borderColor} bg-surface ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="window-dot bg-[#ff5f57]" />
          <span className="window-dot bg-[#febc2e]" />
          <span className="window-dot bg-[#28c840]" />
        </div>
        <span className="ml-2 text-[11px] font-mono text-muted tracking-wide">
          {filename}
        </span>
      </div>
      {/* Content */}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
