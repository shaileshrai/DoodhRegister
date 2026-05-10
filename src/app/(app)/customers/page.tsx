"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  shift: "MORNING" | "EVENING" | "OTHER";
  rate: number | null;
  defaultQuantity: number | null;
  isActive: boolean;
  joinedDate: string;
}

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "MORNING" | "EVENING" | "OTHER">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => { setCustomers(data); setLoading(false); });
  }, []);

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search);
    const matchShift = shiftFilter === "ALL" || c.shift === shiftFilter;
    return matchSearch && matchShift;
  });

  const active = filtered.filter((c) => c.isActive);
  const inactive = filtered.filter((c) => !c.isActive);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{t("customers")}</h1>
        <Link href="/customers/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          {t("addCustomerBtn")}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex rounded-lg overflow-hidden border border-gray-300 flex-wrap">
          {(["ALL", "MORNING", "EVENING", "OTHER"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShiftFilter(s)}
              className={`px-3 py-2 text-sm font-medium transition ${
                shiftFilter === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "ALL" ? t("all") : s === "MORNING" ? `🌅 ${t("morning")}` : s === "EVENING" ? `🌙 ${t("evening")}` : `📦 Other`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{customers.filter((c) => c.isActive).length}</div>
          <div className="text-xs text-gray-500">{t("active")}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-amber-500">{customers.filter((c) => c.isActive && c.shift === "MORNING").length}</div>
          <div className="text-xs text-gray-500">{t("morning")}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-indigo-500">{customers.filter((c) => c.isActive && c.shift === "EVENING").length}</div>
          <div className="text-xs text-gray-500">{t("evening")}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-500">{customers.filter((c) => c.isActive && c.shift === "OTHER").length}</div>
          <div className="text-xs text-gray-500">Other</div>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-10">{t("loading")}</div>
      ) : (
        <div className="space-y-2">
          {active.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))}
          {inactive.length > 0 && (
            <>
              <div className="text-xs text-gray-400 font-medium uppercase pt-2 pb-1 px-1">{t("inactive")}</div>
              {inactive.map((c) => (
                <CustomerCard key={c.id} customer={c} />
              ))}
            </>
          )}
          {filtered.length === 0 && (
            <div className="text-gray-400 text-center py-10">{t("noCustomers")}</div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomerCard({ customer: c }: { customer: Customer }) {
  const { t } = useLang();
  return (
    <Link href={`/customers/${c.id}`} className="block">
      <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition ${c.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${c.shift === "MORNING" ? "bg-amber-400" : c.shift === "EVENING" ? "bg-indigo-400" : "bg-gray-400"}`}>
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800">{c.name}</div>
            <div className="text-xs text-gray-400">{c.mobile}</div>
          </div>
          <div className="text-right text-sm">
            {c.defaultQuantity != null && <div className="font-medium text-gray-700">{c.defaultQuantity} L/day</div>}
            {c.rate != null && <div className="text-xs text-gray-400">₹{c.rate}/L</div>}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full font-medium ${c.shift === "MORNING" ? "bg-amber-100 text-amber-700" : c.shift === "EVENING" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}>
            {c.shift === "MORNING" ? t("morning") : c.shift === "EVENING" ? t("evening") : "Other"}
          </div>
        </div>
      </div>
    </Link>
  );
}
