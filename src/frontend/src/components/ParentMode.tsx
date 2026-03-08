import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  MinusCircle,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useListPendingCompletions } from "../hooks/useQueries";
import ApprovalsTab from "./parent/ApprovalsTab";
import ChildrenTab from "./parent/ChildrenTab";
import ChoresTab from "./parent/ChoresTab";
import DeductionsTab from "./parent/DeductionsTab";

interface Props {
  onBack: () => void;
}

export default function ParentMode({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState("children");
  const { data: pendingCompletions } = useListPendingCompletions();
  const pendingCount = pendingCompletions?.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-2 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.22 0.04 50)" }}
            >
              <span className="text-white text-sm">🔒</span>
            </div>
            <h1 className="font-display font-black text-xl text-foreground">
              Parent Mode
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 mb-6 bg-muted rounded-2xl p-1 h-auto gap-1">
            <TabsTrigger
              data-ocid="parent.children_tab"
              value="children"
              className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Children</span>
            </TabsTrigger>
            <TabsTrigger
              data-ocid="parent.chores_tab"
              value="chores"
              className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">Chores</span>
            </TabsTrigger>
            <TabsTrigger
              data-ocid="parent.approvals_tab"
              value="approvals"
              className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Approvals</span>
              {pendingCount > 0 && (
                <Badge
                  className="h-5 min-w-5 text-xs px-1.5 rounded-full"
                  style={{
                    background: "var(--kid-rose)",
                    color: "white",
                    border: "none",
                  }}
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              data-ocid="parent.deductions_tab"
              value="deductions"
              className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <MinusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Deductions</span>
            </TabsTrigger>
          </TabsList>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="children" className="mt-0">
              <ChildrenTab />
            </TabsContent>
            <TabsContent value="chores" className="mt-0">
              <ChoresTab />
            </TabsContent>
            <TabsContent value="approvals" className="mt-0">
              <ApprovalsTab />
            </TabsContent>
            <TabsContent value="deductions" className="mt-0">
              <DeductionsTab />
            </TabsContent>
          </motion.div>
        </Tabs>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
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
