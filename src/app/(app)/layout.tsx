import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { LangProvider } from "@/lib/i18n";
import { runMigrations } from "@/db/migrate";

// Run DB migrations on first request
let migrated = false;
function ensureMigrated() {
  if (!migrated) {
    runMigrations();
    migrated = true;
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  ensureMigrated();
  return (
    <LangProvider>
      <div className="flex h-full min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </LangProvider>
  );
}
