"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useLang();

  const NAV = [
    { href: "/", label: t("dashboard"), icon: "🏠" },
    { href: "/attendance", label: t("attendance"), icon: "✅" },
    { href: "/customers", label: t("customers"), icon: "👥" },
    { href: "/billing", label: t("billing"), icon: "🧾" },
    { href: "/expenses", label: t("expenses"), icon: "💸" },
    { href: "/reports", label: t("reports"), icon: "📊" },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐄</span>
          <span className="font-bold text-gray-800">{t("dairyAdmin")}</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Language toggle */}
      <div className="px-3 pb-2">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => setLang("en")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium transition",
              lang === "en" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
            )}
          >
            English
          </button>
          <button
            onClick={() => setLang("hi")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium transition",
              lang === "hi" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
            )}
          >
            हिंदी
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
        >
          <span>🚪</span> {t("logout")}
        </button>
      </div>
    </aside>
  );
}
