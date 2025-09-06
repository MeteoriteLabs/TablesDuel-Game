import { Switch, Route, useParams } from "wouter";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { useGameState } from "@/lib/game-state";
import { socketManager } from "@/lib/socket";
import { queryClient } from "./lib/queryClient";
import Home from "@/pages/home";
import { JoinPage } from "@/pages/join";
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

function RoomJoiner() {
  const params = useParams();
  const roomId = params.roomId;
  const { gameStatus } = useGameState();

  // If we're in the menu state, show the dedicated join page
  if (gameStatus === 'menu' && roomId) {
    return <JoinPage roomId={roomId} />;
  }

  // Otherwise show the normal game router
  return <GameRouter />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameRouter} />
      <Route path="/room/:roomId" component={RoomJoiner} />
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
