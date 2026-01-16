interface AdBannerProps {
  position?: "header" | "content" | "sidebar";
  className?: string;
}

export function AdBanner({ position = "content", className = "" }: AdBannerProps) {
  const heightClasses = {
    header: "h-20 md:h-24",
    content: "h-24 md:h-32",
    sidebar: "h-48 md:h-64",
  };

  return (
    <div className={`bg-muted rounded-lg overflow-hidden ${className}`}>
      <div className="text-center py-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Реклама
        </span>
      </div>
      <div
        className={`${heightClasses[position]} bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center`}
      >
        <span className="text-muted-foreground text-sm">Рекламный баннер</span>
      </div>
    </div>
  );
}
