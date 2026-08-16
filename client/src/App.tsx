/** Postcard Archipelago: React stays a minimal picture frame around the playable world. */
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import GameCanvas from "./components/GameCanvas";

function App() {
  return (
    <ErrorBoundary>
      <GameCanvas />
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
