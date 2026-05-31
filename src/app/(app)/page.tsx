"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { today } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface ShiftEntry {
  customer: { id: number; name: string; shift: string; defaultQuantity: number; mobile: string };
  isPresent: boolean;
  quantityTaken: number;
  record: { id: number } | null;
}

interface AbsentCustomer {
  id: number;
  name: string;
  mobile: string;
  defaultQuantity: number;
  shift: string;
}

interface ShiftStats {
  expected: number;
  taken: number;
  presentCount: number;
  absentList: AbsentCustomer[];
  notTakenList: AbsentCustomer[];
  remainingToGive: number;
}

export default function DashboardPage() {
  const { t } = useLang();
  const [morningData, setMorningData] = useState<ShiftEntry[]>([]);
  const [eveningData, setEveningData] = useState<ShiftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [absentModal, setAbsentModal] = useState<{ shift: string; customers: AbsentCustomer[] } | null>(null);
  const date = today();
  const now = new Date();

  useEffect(() => {
    async function load() {
      const [mRes, eRes] = await Promise.all([
        fetch(`/api/attendance?date=${date}&shift=MORNING`),
        fetch(`/api/attendance?date=${date}&shift=EVENING`),
      ]);
      if (mRes.ok) setMorningData(await mRes.json());
      if (eRes.ok) setEveningData(await eRes.json());
      setLoading(false);
    }
    load();
  }, []);

  function shiftStats(data: ShiftEntry[]): ShiftStats {
    const expected = data.reduce((s, e) => s + e.customer.defaultQuantity, 0);
    const taken = data.filter((e) => e.isPresent).reduce((s, e) => s + e.quantityTaken, 0);
    const presentCount = data.filter((e) => e.isPresent).length;
    // Pending delivery — no record yet
    const absentList = data.filter((e) => e.record === null).map((e) => ({
      id: e.customer.id,
      name: e.customer.name,
      mobile: e.customer.mobile,
      defaultQuantity: e.customer.defaultQuantity,
      shift: e.customer.shift,
    }));
    // Explicitly marked Not Taken — for visibility only, NOT counted in "still to give"
    const notTakenList = data.filter((e) => e.record !== null && !e.isPresent).map((e) => ({
      id: e.customer.id,
      name: e.customer.name,
      mobile: e.customer.mobile,
      defaultQuantity: e.customer.defaultQuantity,
      shift: e.customer.shift,
    }));
    const remainingToGive = absentList.reduce((s, e) => s + (e.defaultQuantity ?? 0), 0);
    return { expected, taken, presentCount, absentList, notTakenList, remainingToGive };
  }

  const ms = shiftStats(morningData);
  const es = shiftStats(eveningData);

  if (loading) return <div className="p-6 text-gray-400">{t("loading")}</div>;

  return (
    <div className="p-3 md:p-6 pb-20 md:pb-6 space-y-3 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-lg md:text-xl font-bold text-slate-700">{t("dashboard")}</h1>
        <p className="text-slate-400 text-xs md:text-sm">
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Shift cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ShiftCard
          icon="🌅"
          label={t("morningShift")}
          shift="MORNING"
          stats={ms}
          total={morningData.length}
          scheme="morning"
          onAbsentClick={() => setAbsentModal({ shift: t("morningShift"), customers: ms.absentList })}
          t={t}
        />
        <ShiftCard
          icon="🌙"
          label={t("eveningShift")}
          shift="EVENING"
          stats={es}
          total={eveningData.length}
          scheme="evening"
          onAbsentClick={() => setAbsentModal({ shift: t("eveningShift"), customers: es.absentList })}
          t={t}
        />
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: "/attendance",    label: t("attendance"),  icon: "✅", bg: "bg-sky-50   border-sky-200   text-sky-800"   },
            { href: "/customers/new", label: t("addCustomer"), icon: "➕", bg: "bg-teal-50  border-teal-200  text-teal-800"  },
            { href: "/billing",       label: t("viewBills"),   icon: "🧾", bg: "bg-violet-50 border-violet-200 text-violet-800" },
            { href: "/expenses",      label: t("addExpense"),  icon: "💸", bg: "bg-rose-50  border-rose-200  text-rose-800"  },
          ].map((q) => (
            <Link key={q.href} href={q.href}
              className={`border rounded-xl p-3 text-center active:shadow-sm transition ${q.bg}`}>
              <div className="text-xl md:text-2xl mb-0.5">{q.icon}</div>
              <div className="text-[10px] md:text-xs font-semibold leading-tight">{q.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Absent modal */}
      {absentModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 p-4 pb-24 md:pb-4"
          onClick={() => setAbsentModal(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-800">{t("notTakingToday")}</div>
                <div className="text-xs text-gray-400">
                  {absentModal.shift} · {absentModal.customers.length} {t("customers").toLowerCase()}
                </div>
              </div>
              <button onClick={() => setAbsentModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-gray-50">
              {absentModal.customers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-2 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                    ${c.shift === "MORNING" ? "bg-amber-400" : "bg-indigo-400"}`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.mobile} · {c.defaultQuantity}L/day</div>
                  </div>
                  <a href={`tel:${c.mobile}`}
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition">
                    📞 Call
                  </a>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button onClick={() => setAbsentModal(null)}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SCHEMES = {
  morning: {
    card:       "bg-amber-50  border border-amber-200",
    header:     "bg-amber-100 border-b border-amber-200",
    iconBg:     "bg-amber-200",
    iconText:   "text-amber-800",
    title:      "text-amber-900",
    sub:        "text-amber-600",
    statBg:     "bg-white border border-amber-100",
    statVal:    "text-slate-700",
    statLbl:    "text-slate-400",
    highlight:  "bg-amber-100 border border-amber-300",
    hlVal:      "text-amber-800",
    hlLbl:      "text-amber-600",
    bar:        "bg-amber-200",
    barFill:    "bg-amber-500",
    barText:    "text-amber-700",
    absentBg:   "bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100",
    absentSub:  "text-orange-500",
    allOkBg:    "bg-green-50 border border-green-200 text-green-700",
    btn:        "bg-amber-600 hover:bg-amber-700 text-white",
  },
  evening: {
    card:       "bg-indigo-50 border border-indigo-200",
    header:     "bg-indigo-100 border-b border-indigo-200",
    iconBg:     "bg-indigo-200",
    iconText:   "text-indigo-800",
    title:      "text-indigo-900",
    sub:        "text-indigo-500",
    statBg:     "bg-white border border-indigo-100",
    statVal:    "text-slate-700",
    statLbl:    "text-slate-400",
    highlight:  "bg-indigo-100 border border-indigo-300",
    hlVal:      "text-indigo-800",
    hlLbl:      "text-indigo-600",
    bar:        "bg-indigo-200",
    barFill:    "bg-indigo-500",
    barText:    "text-indigo-700",
    absentBg:   "bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100",
    absentSub:  "text-orange-500",
    allOkBg:    "bg-green-50 border border-green-200 text-green-700",
    btn:        "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
} as const;

function ShiftCard({
  icon, label, shift, stats, scheme, total, onAbsentClick, t,
}: {
  icon: string;
  label: string;
  shift: string;
  stats: ShiftStats;
  scheme: keyof typeof SCHEMES;
  total: number;
  onAbsentClick: () => void;
  t: (k: Parameters<ReturnType<typeof useLang>["t"]>[0]) => string;
}) {
  const s = SCHEMES[scheme];
  const pct = stats.expected > 0 ? Math.round((stats.taken / stats.expected) * 100) : 0;

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm ${s.card}`}>
      {/* Header strip */}
      <div className={`flex items-center justify-between px-4 py-3 ${s.header}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${s.iconBg}`}>
            {icon}
          </div>
          <div>
            <div className={`font-bold text-base leading-tight ${s.title}`}>{label}</div>
            <div className={`text-xs ${s.sub}`}>{total} {t("customers").toLowerCase()}</div>
          </div>
        </div>
        <Link
          href={`/attendance?shift=${shift}`}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${s.btn}`}
        >
          {t("markAttendance")} →
        </Link>
      </div>

      {/* Stats grid */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Regular stats */}
          <StatBox label={t("expected")} value={`${stats.expected.toFixed(2)} L`}
            bg={s.statBg} valColor={s.statVal} lblColor={s.statLbl} />
          <StatBox label={t("taken")} value={`${stats.taken.toFixed(2)} L`}
            bg={s.statBg} valColor={s.statVal} lblColor={s.statLbl} />

          {/* Present count */}
          <StatBox
            label={t("present")}
            value={`${stats.presentCount} / ${total}`}
            bg={s.statBg} valColor={s.statVal} lblColor={s.statLbl}
          />

          {/* Remaining — highlighted only when non-zero */}
          <StatBox
            label={t("remainingToGive")}
            value={`${stats.remainingToGive.toFixed(2)} L`}
            bg={stats.remainingToGive > 0 ? s.highlight : s.statBg}
            valColor={stats.remainingToGive > 0 ? s.hlVal : s.statVal}
            lblColor={stats.remainingToGive > 0 ? s.hlLbl : s.statLbl}
          />
        </div>

        {/* Progress bar */}
        <div>
          <div className={`flex justify-between text-xs mb-1 font-medium ${s.barText}`}>
            <span>{t("taken")}</span>
            <span>{pct}%</span>
          </div>
          <div className={`rounded-full h-2.5 ${s.bar}`}>
            <div
              className={`rounded-full h-2.5 transition-all duration-500 ${s.barFill}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        {/* Absent row */}
        {stats.absentList.length > 0 ? (
          <button onClick={onAbsentClick}
            className={`w-full text-left rounded-xl px-3 py-2.5 transition ${s.absentBg}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs">{t("notTakingToday")} ({stats.absentList.length})</span>
              <span className={`text-[10px] ${s.absentSub}`}>📞 Tap to call →</span>
            </div>
            <div className="text-[11px] mt-0.5 opacity-75 truncate">
              {stats.absentList.map((c) => c.name).join(", ")}
            </div>
          </button>
        ) : (
          <div className={`rounded-xl px-3 py-2.5 text-xs text-center font-medium ${s.allOkBg}`}>
            ✅ All deliveries recorded
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, bg, valColor, lblColor }: {
  label: string; value: string;
  bg: string; valColor: string; lblColor: string;
}) {
  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <div className={`text-[11px] font-medium leading-none mb-1 ${lblColor}`}>{label}</div>
      <div className={`text-lg font-bold leading-tight ${valColor}`}>{value}</div>
    </div>
  );
}
