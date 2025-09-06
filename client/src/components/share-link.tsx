import { useState } from "react";
import { Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";

export function ShareLink() {
  const { roomId } = useGameState();
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);

  const roomUrl = `${window.location.origin}/room/${roomId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast({
        title: "Link copied!",
        description: "Room link has been copied to clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Please copy the room ID manually: " + roomId,
        variant: "destructive",
      });
    }
  };

  if (!roomId) return null;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
      <div className="text-center space-y-3">
        <div className="text-sm text-muted-foreground">Room ID</div>
        <div className="text-2xl font-mono font-bold text-primary bg-primary/10 rounded-lg py-2 px-4" data-testid="text-room-id">
          {roomId}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={copyLink}
            className="flex-1 py-3 px-4 rounded-lg text-sm font-medium"
            data-testid="button-copy-link"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowQR(!showQR)}
            className="flex-1 py-3 px-4 rounded-lg text-sm font-medium"
            data-testid="button-show-qr"
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </Button>
        </div>
      </div>

      {showQR && (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            QR Code generation would be implemented here
          </p>
        </div>
      )}
    </div>
  );
}
