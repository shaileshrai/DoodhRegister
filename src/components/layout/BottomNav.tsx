"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();

  const NAV = [
    { href: "/", label: t("dashboard"), icon: "🏠" },
    { href: "/attendance", label: t("attendance"), icon: "✅" },
    { href: "/customers", label: t("customers"), icon: "👥" },
    { href: "/billing", label: t("billing"), icon: "🧾" },
    { href: "/expenses", label: t("expenses"), icon: "💸" },
    { href: "/reports", label: t("reports"), icon: "📊" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      {/* Language toggle strip on mobile */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setLang("en")}
          className={cn(
            "flex-1 py-1 text-[10px] font-medium transition",
            lang === "en" ? "bg-blue-600 text-white" : "text-gray-400"
          )}
        >
          English
        </button>
        <button
          onClick={() => setLang("hi")}
          className={cn(
            "flex-1 py-1 text-[10px] font-medium transition",
            lang === "hi" ? "bg-blue-600 text-white" : "text-gray-400"
          )}
        >
          हिंदी
        </button>
      </div>
      <div className="flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center py-2 text-[10px]",
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                ? "text-blue-600"
                : "text-gray-500"
            )}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="mt-0.5 leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
