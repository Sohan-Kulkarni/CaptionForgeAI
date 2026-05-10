import { ImagePlus, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/[0.72] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="focus-ring flex items-center gap-3 rounded-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="text-base font-bold text-foreground sm:text-lg">CaptionForge AI</span>
        </a>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </nav>
    </header>
  );
}
