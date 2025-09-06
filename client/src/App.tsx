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
  const { 
    setRoomId, 
    setPlayerId, 
    setGameMode, 
    setGameStatus, 
    setPlayers,
    gameStatus,
    playerName 
  } = useGameState();

  useEffect(() => {
    if (roomId && gameStatus === 'menu') {
      // If user hasn't entered their name yet, we need them to do that first
      if (!playerName.trim()) {
        // Stay on home page but set room mode
        setGameMode('2-player');
        setRoomId(roomId);
        return;
      }

      // Connect and join the room
      const joinRoom = async () => {
        try {
          await socketManager.connect();
          
          // Listen for join response
          socketManager.on("room:joined", (data) => {
            setRoomId(data.roomId);
            setPlayerId(data.playerId);
            setGameStatus("lobby");
          });

          socketManager.on("room:state", (data) => {
            setPlayers(data.players);
          });

          socketManager.on("error", (data) => {
            alert(data.message || "Failed to join room");
            setGameStatus("menu");
          });

          socketManager.send("room:join", {
            roomId,
            playerName: playerName.trim(),
          });
        } catch (error) {
          console.error("Error joining room:", error);
          alert("Failed to join room. Please try again.");
          setGameStatus("menu");
        }
      };

      joinRoom();
    }
  }, [roomId, gameStatus, playerName, setRoomId, setPlayerId, setGameMode, setGameStatus, setPlayers]);

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
