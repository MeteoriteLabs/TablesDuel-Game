import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { useGameState } from "@/lib/game-state";
import { queryClient } from "./lib/queryClient";
import Home from "@/pages/home";
import Lobby from "@/pages/lobby";
import Game from "@/pages/game";
import Results from "@/pages/results";
import NotFound from "@/pages/not-found";

function GameRouter() {
  const { gameStatus } = useGameState();

  switch (gameStatus) {
    case 'menu':
      return <Home />;
    case 'lobby':
      return <Lobby />;
    case 'active':
      return <Game />;
    case 'completed':
      return <Results />;
    default:
      return <Home />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameRouter} />
      <Route path="/room/:roomId" component={() => {
        // TODO: Handle room joining via URL
        return <GameRouter />;
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell>
          <Router />
        </AppShell>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
