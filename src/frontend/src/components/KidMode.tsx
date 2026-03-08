import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ChildProfile } from "../backend.d";
import { useListChildren } from "../hooks/useQueries";
import { getColorStyle } from "../utils/format";
import KidChoreView from "./KidChoreView";

interface Props {
  onBack: () => void;
}

const CHILD_EMOJIS = [
  "🦁",
  "🐬",
  "🦊",
  "🐼",
  "🦄",
  "🐸",
  "🐯",
  "🐨",
  "🦋",
  "🐙",
];

export default function KidMode({ onBack }: Props) {
  const { data: children, isLoading } = useListChildren();
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);

  if (selectedChild) {
    return (
      <KidChoreView
        child={selectedChild}
        onBack={() => setSelectedChild(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Colorful background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, oklch(0.82 0.18 90 / 0.3) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 80% 80%, oklch(0.68 0.16 240 / 0.2) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 50% 50%, oklch(0.70 0.20 355 / 0.1) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            data-ocid="kid.back_button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors rounded-2xl px-3 py-2 hover:bg-white/60 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative z-10 px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-5xl mb-3">👋</div>
            <h1 className="text-4xl font-display font-black text-foreground">
              Who are you?
            </h1>
            <p className="text-lg text-muted-foreground mt-2 font-medium">
              Tap your name to see your chores!
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 rounded-3xl" />
              ))}
            </div>
          ) : !children?.length ? (
            <div
              data-ocid="kid.empty_state"
              className="text-center py-16 rounded-3xl border-2 border-dashed border-border bg-white/50 backdrop-blur-sm"
            >
              <div className="text-5xl mb-3">😴</div>
              <p className="font-display font-bold text-xl text-foreground">
                No kids yet!
              </p>
              <p className="text-muted-foreground mt-1">
                Ask a parent to add you first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence>
                {children.map((child, idx) => {
                  const emoji = CHILD_EMOJIS[idx % CHILD_EMOJIS.length];
                  return (
                    <motion.button
                      key={child.childId.toString()}
                      data-ocid={`kid.child_card.${idx + 1}`}
                      className="kid-bounce flex flex-col items-center gap-3 p-6 rounded-3xl text-white shadow-kid-lg cursor-pointer border-2 border-white/20 backdrop-blur-sm"
                      style={getColorStyle(child.colorTag)}
                      onClick={() => setSelectedChild(child)}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.4,
                        delay: idx * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      whileTap={{ scale: 0.93 }}
                    >
                      <motion.span
                        className="text-5xl leading-none"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: idx * 0.5,
                          ease: "easeInOut",
                        }}
                      >
                        {emoji}
                      </motion.span>
                      <span className="text-xl font-display font-black leading-tight">
                        {child.name}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-muted-foreground py-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
