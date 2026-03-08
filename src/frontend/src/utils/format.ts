import type React from "react";
import { Frequency } from "../backend.d";

export function formatDollars(cents: bigint): string {
  const amount = Number(cents) / 100;
  const abs = Math.abs(amount);
  const formatted = abs.toFixed(2);
  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function formatFrequency(freq: Frequency): string {
  switch (freq) {
    case Frequency.unlimitedDaily:
      return "Unlimited";
    case Frequency.oncePerDay:
      return "Once a day";
    case Frequency.oncePerWeek:
      return "Once a week";
  }
}

export function formatTimestamp(ts: bigint): string {
  // ICP timestamps are in nanoseconds
  const ms = Number(ts / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Child color swatches - maps colorTag string to CSS class names
const COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string; shadow: string }
> = {
  coral: {
    bg: "bg-[var(--kid-coral)]",
    text: "text-white",
    border: "border-[oklch(0.62_0.18_20)]",
    shadow: "shadow-[0_4px_20px_oklch(0.72_0.18_20/0.35)]",
  },
  sky: {
    bg: "bg-[var(--kid-sky)]",
    text: "text-white",
    border: "border-[oklch(0.58_0.16_240)]",
    shadow: "shadow-[0_4px_20px_oklch(0.68_0.16_240/0.35)]",
  },
  mint: {
    bg: "bg-[var(--kid-mint)]",
    text: "text-white",
    border: "border-[oklch(0.58_0.16_155)]",
    shadow: "shadow-[0_4px_20px_oklch(0.68_0.16_155/0.35)]",
  },
  grape: {
    bg: "bg-[var(--kid-grape)]",
    text: "text-white",
    border: "border-[oklch(0.54_0.18_300)]",
    shadow: "shadow-[0_4px_20px_oklch(0.64_0.18_300/0.35)]",
  },
  sun: {
    bg: "bg-[var(--kid-sun)]",
    text: "text-[oklch(0.22_0.04_50)]",
    border: "border-[oklch(0.72_0.18_90)]",
    shadow: "shadow-[0_4px_20px_oklch(0.82_0.18_90/0.35)]",
  },
  rose: {
    bg: "bg-[var(--kid-rose)]",
    text: "text-white",
    border: "border-[oklch(0.60_0.20_355)]",
    shadow: "shadow-[0_4px_20px_oklch(0.70_0.20_355/0.35)]",
  },
  teal: {
    bg: "bg-[var(--kid-teal)]",
    text: "text-white",
    border: "border-[oklch(0.54_0.16_195)]",
    shadow: "shadow-[0_4px_20px_oklch(0.64_0.16_195/0.35)]",
  },
  peach: {
    bg: "bg-[var(--kid-peach)]",
    text: "text-[oklch(0.22_0.04_50)]",
    border: "border-[oklch(0.66_0.16_50)]",
    shadow: "shadow-[0_4px_20px_oklch(0.76_0.16_50/0.35)]",
  },
};

export const AVAILABLE_COLORS = Object.keys(COLOR_MAP);

export function getColorClasses(colorTag: string) {
  return COLOR_MAP[colorTag] || COLOR_MAP.coral;
}

export function getColorStyle(colorTag: string): React.CSSProperties {
  const colorVarMap: Record<string, string> = {
    coral: "var(--kid-coral)",
    sky: "var(--kid-sky)",
    mint: "var(--kid-mint)",
    grape: "var(--kid-grape)",
    sun: "var(--kid-sun)",
    rose: "var(--kid-rose)",
    teal: "var(--kid-teal)",
    peach: "var(--kid-peach)",
  };
  return {
    backgroundColor: colorVarMap[colorTag] || colorVarMap.coral,
  };
}

// Chore emoji mapping
export function choreEmoji(choreName: string): string {
  const lower = choreName.toLowerCase();
  if (
    lower.includes("sweep") ||
    lower.includes("broom") ||
    lower.includes("floor")
  )
    return "🧹";
  if (
    lower.includes("dish") ||
    lower.includes("plate") ||
    lower.includes("wash")
  )
    return "🍽️";
  if (lower.includes("dog") || lower.includes("pet") || lower.includes("walk"))
    return "🐕";
  if (
    lower.includes("book") ||
    lower.includes("read") ||
    lower.includes("homework") ||
    lower.includes("study")
  )
    return "📚";
  if (
    lower.includes("bed") ||
    lower.includes("room") ||
    lower.includes("tidy") ||
    lower.includes("clean")
  )
    return "🛏️";
  if (
    lower.includes("trash") ||
    lower.includes("garbage") ||
    lower.includes("bin")
  )
    return "🗑️";
  if (
    lower.includes("laundry") ||
    lower.includes("clothes") ||
    lower.includes("fold")
  )
    return "👕";
  if (lower.includes("vacuum")) return "🌀";
  if (
    lower.includes("garden") ||
    lower.includes("plant") ||
    lower.includes("water")
  )
    return "🌱";
  if (
    lower.includes("cook") ||
    lower.includes("meal") ||
    lower.includes("dinner") ||
    lower.includes("lunch")
  )
    return "🍳";
  if (lower.includes("car") || lower.includes("wash")) return "🚗";
  if (lower.includes("tooth") || lower.includes("brush")) return "🪥";
  if (
    lower.includes("mow") ||
    lower.includes("lawn") ||
    lower.includes("grass")
  )
    return "🌿";
  if (lower.includes("exercise") || lower.includes("workout")) return "💪";
  return "⭐";
}
