import { cn } from "@/lib/utils";

interface BurgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function BurgerMenu({ isOpen, onClick, className }: BurgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-8 h-8 flex flex-col justify-center items-center gap-1.5 group",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50 rounded",
        className
      )}
      aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
      aria-expanded={isOpen}
    >
      <span
        className={cn(
          "block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out",
          isOpen && "translate-y-2 rotate-45"
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out",
          isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out",
          isOpen && "-translate-y-2 -rotate-45"
        )}
      />
    </button>
  );
}
