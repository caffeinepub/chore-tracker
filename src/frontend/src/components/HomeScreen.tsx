import { Coins, Shield, Smile, Star, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import ParentPinDialog from "./ParentPinDialog";

type AppMode = "home" | "parent" | "kid";

interface Props {
  onSelectMode: (mode: AppMode) => void;
}

const floatingEmojis = ["⭐", "🌟", "💰", "🏆", "✅", "🎉", "🌈", "🎊"];

export default function HomeScreen({ onSelectMode }: Props) {
  const [showPinDialog, setShowPinDialog] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Decorative background blobs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--kid-sun)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "var(--kid-sky)" }}
      />
      <div
        className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "var(--kid-rose)" }}
      />

      {/* Floating emoji decorations */}
      {floatingEmojis.map((emoji, i) => (
        <motion.div
          key={emoji}
          className="absolute text-2xl pointer-events-none select-none"
          style={{
            left: `${8 + ((i * 12) % 84)}%`,
            top: `${10 + ((i * 17) % 80)}%`,
          }}
          animate={{
            y: [0, -12, 0],
            rotate: [0, i % 2 === 0 ? 10 : -10, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center gap-10 max-w-lg w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-kid-lg overflow-hidden"
            style={{ background: "oklch(0.76 0.16 75)" }}
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img
              src="/assets/generated/chore-champions-logo-transparent.dim_200x200.png"
              alt="Chore Champions"
              className="w-20 h-20 object-contain"
            />
          </motion.div>
          <div>
            <h1 className="text-5xl font-display font-black tracking-tight text-foreground">
              Chore
              <span className="gold-shimmer"> Champions</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 font-medium">
              Complete chores, earn rewards, be a champion! 🏆
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-6 text-center">
          {[
            {
              icon: Trophy,
              label: "Earn rewards",
              color: "text-[oklch(0.76_0.16_75)]",
            },
            {
              icon: Star,
              label: "Track chores",
              color: "text-[oklch(0.70_0.20_35)]",
            },
            {
              icon: Coins,
              label: "Save money",
              color: "text-[oklch(0.68_0.16_155)]",
            },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className={`w-6 h-6 ${color}`} />
              <span className="text-xs font-semibold text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <motion.button
            data-ocid="mode.kid_button"
            className="flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl cursor-pointer border-2 border-transparent shadow-kid-lg transition-all duration-200"
            style={{
              background: "var(--kid-sky)",
              color: "white",
            }}
            onClick={() => onSelectMode("kid")}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <Smile className="w-12 h-12" strokeWidth={1.8} />
            <div>
              <div className="text-2xl font-display font-black">Kid Mode</div>
              <div className="text-sm opacity-85 font-medium mt-0.5">
                View & complete your chores!
              </div>
            </div>
          </motion.button>

          <motion.button
            data-ocid="mode.parent_button"
            className="flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl cursor-pointer border-2 border-transparent shadow-kid-lg transition-all duration-200"
            style={{
              background: "oklch(0.22 0.04 50)",
              color: "white",
            }}
            onClick={() => setShowPinDialog(true)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <Shield className="w-12 h-12" strokeWidth={1.8} />
            <div>
              <div className="text-2xl font-display font-black">
                Parent Mode
              </div>
              <div className="text-sm opacity-75 font-medium mt-0.5">
                Manage chores & approve rewards
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-4 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </motion.footer>

      <ParentPinDialog
        open={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={() => {
          setShowPinDialog(false);
          onSelectMode("parent");
        }}
      />
    </div>
  );
}
