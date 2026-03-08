import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import KidMode from "./components/KidMode";
import ParentMode from "./components/ParentMode";

type AppMode = "home" | "parent" | "kid";

export default function App() {
  const [mode, setMode] = useState<AppMode>("home");

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      {mode === "home" && <HomeScreen onSelectMode={setMode} />}
      {mode === "parent" && <ParentMode onBack={() => setMode("home")} />}
      {mode === "kid" && <KidMode onBack={() => setMode("home")} />}
    </div>
  );
}
