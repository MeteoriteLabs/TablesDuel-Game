import { Volume2, VolumeX } from "lucide-react";
import { useGameState } from "@/lib/game-state";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { soundEnabled, toggleSound } = useGameState();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">×</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tables Duel</h1>
              <p className="text-xs text-muted-foreground">Master your times tables</p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            data-testid="button-toggle-sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-muted-foreground" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </header>
      <main className="max-w-md mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
