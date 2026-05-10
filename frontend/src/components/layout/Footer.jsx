import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/70 py-8">
      <div className="mx-auto flex w-full max-w-7xl px-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>CaptionForge AI. Built with React, FastAPI, and BLIP.</span>
        </div>
      </div>
    </footer>
  );
}
