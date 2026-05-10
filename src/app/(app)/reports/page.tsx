"use client";
import { useEffect, useState } from "react";
import { formatCurrency, MONTH_NAMES } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from "recharts";

interface MonthlyReport {
  year: number;
  month: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalQuantity: number;
  paidCount: number;
  dueCount: number;
  expenseByCategory: Record<string, number>;
  billCount: number;
}

interface YearlyReport {
  year: number;
  months: Array<{ year: number; month: number; totalRevenue: number; totalExpenses: number; netProfit: number }>;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

interface TrendData {
  trends: Array<{ month: string; added: number; removed: number; net: number; activeCount: number }>;
  currentActive: number;
  currentMorning: number;
  currentEvening: number;
  totalEver: number;
}

const EXPENSE_ICONS: Record<string, string> = {
  FODDER: "🌾", MEDICINE: "💊", REPAIRING: "🔧",
  MANPOWER: "👷", POWER: "⚡", OTHER: "📦",
};

export default function ReportsPage() {
  const { t } = useLang();
  const now = new Date();
  const [tab, setTab] = useState<"monthly" | "yearly" | "compare" | "trends">("monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(false);

  // Compare state
  const [cmpYear1, setCmpYear1] = useState(now.getFullYear());
  const [cmpMonth1, setCmpMonth1] = useState(now.getMonth());
  const [cmpYear2, setCmpYear2] = useState(now.getFullYear());
  const [cmpMonth2, setCmpMonth2] = useState(now.getMonth() + 1);
  const [cmpData, setCmpData] = useState<[MonthlyReport | null, MonthlyReport | null]>([null, null]);

  useEffect(() => {
    if (tab === "monthly") loadMonthly();
    if (tab === "yearly") loadYearly();
    if (tab === "trends") loadTrends();
  }, [tab, year, month]);

  async function loadMonthly() {
    setLoading(true);
    const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
    if (res.ok) setMonthlyReport(await res.json());
    setLoading(false);
  }

  async function loadYearly() {
    setLoading(true);
    const res = await fetch(`/api/reports/yearly?year=${year}`);
    if (res.ok) setYearlyReport(await res.json());
    setLoading(false);
  }

  async function loadTrends() {
    setLoading(true);
    const res = await fetch("/api/reports/trends");
    if (res.ok) setTrends(await res.json());
    setLoading(false);
  }

  async function loadCompare() {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch(`/api/reports/monthly?year=${cmpYear1}&month=${cmpMonth1}`),
      fetch(`/api/reports/monthly?year=${cmpYear2}&month=${cmpMonth2}`),
    ]);
    setCmpData([
      r1.ok ? await r1.json() : null,
      r2.ok ? await r2.json() : null,
    ]);
    setLoading(false);
  }

  return (
    <div className="p-3 md:p-6 pb-20 md:pb-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">{t("reportsTitle")}</h1>

      {/* Tab bar */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4 bg-white">
        {(["monthly", "yearly", "compare", "trends"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize transition ${tab === tabKey ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {tabKey === "monthly" ? t("monthly") : tabKey === "yearly" ? t("yearly") : tabKey === "compare" ? t("compare") : t("trends")}
          </button>
        ))}
      </div>

      {/* Month/Year selector */}
      {(tab === "monthly" || tab === "yearly") && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
          {tab === "monthly" && (
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          )}
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24" />
        </div>
      )}

      {/* Financial Summary banner — shown at top of monthly tab */}
      {tab === "monthly" && !loading && monthlyReport && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-3 md:p-5 text-white shadow-md mb-3">
          <div className="text-[11px] md:text-xs font-medium opacity-80 mb-2 uppercase tracking-wide">
            {t("financialSummary")} — {MONTH_NAMES[month - 1]} {year}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="min-w-0">
              <div className="text-sm md:text-xl font-bold truncate">{formatCurrency(monthlyReport.totalRevenue)}</div>
              <div className="text-[10px] md:text-xs opacity-75">{t("revenue")}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm md:text-xl font-bold truncate">{formatCurrency(monthlyReport.totalExpenses)}</div>
              <div className="text-[10px] md:text-xs opacity-75">{t("expenses_")}</div>
            </div>
            <div className="min-w-0">
              <div className={`text-sm md:text-xl font-bold truncate ${monthlyReport.netProfit < 0 ? "text-red-200" : ""}`}>
                {formatCurrency(monthlyReport.netProfit)}
              </div>
              <div className="text-[10px] md:text-xs opacity-75">{t("netProfit")}</div>
            </div>
          </div>
          <div className="flex justify-between text-[11px] md:text-xs opacity-75 pt-2 border-t border-white/20">
            <span>✅ {monthlyReport.paidCount} paid</span>
            <span>⏳ {monthlyReport.dueCount} due</span>
            <span>🥛 {monthlyReport.totalQuantity?.toFixed(1) ?? "0"} L</span>
          </div>
        </div>
      )}

      {loading && <div className="text-gray-400 text-center py-10">{t("loading")}</div>}

      {/* Monthly Report */}
      {tab === "monthly" && !loading && monthlyReport && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-3">{t("expenseBreakdown")}</h2>
            <div className="space-y-2">
              {Object.entries(monthlyReport.expenseByCategory).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span>{EXPENSE_ICONS[cat]}</span>
                  <span className="flex-1 text-sm text-gray-700">{cat}</span>
                  <span className="text-sm font-medium">{formatCurrency(amt)}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2"
                      style={{ width: `${monthlyReport.totalExpenses > 0 ? (amt / monthlyReport.totalExpenses) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(monthlyReport.expenseByCategory).length === 0 && (
                <p className="text-gray-400 text-sm">{t("noExpensesMonth")}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Yearly Report */}
      {tab === "yearly" && !loading && yearlyReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <FinCard label={t("annualRevenue")} value={formatCurrency(yearlyReport.totalRevenue)} color="text-green-600" />
            <FinCard label={t("annualExpenses")} value={formatCurrency(yearlyReport.totalExpenses)} color="text-red-500" />
            <FinCard label={t("annualProfit")} value={formatCurrency(yearlyReport.netProfit)} color={yearlyReport.netProfit >= 0 ? "text-green-700" : "text-red-600"} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-3">{t("monthByMonth")}</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearlyReport.months.map((m) => ({
                name: MONTH_NAMES[m.month - 1].substring(0, 3),
                Revenue: m.totalRevenue,
                Expenses: m.totalExpenses,
                Profit: m.netProfit,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="Revenue" fill="#4ade80" />
                <Bar dataKey="Expenses" fill="#f87171" />
                <Bar dataKey="Profit" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Compare */}
      {tab === "compare" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t("period1"), year: cmpYear1, month: cmpMonth1, setYear: setCmpYear1, setMonth: setCmpMonth1 },
                { label: t("period2"), year: cmpYear2, month: cmpMonth2, setYear: setCmpYear2, setMonth: setCmpMonth2 },
              ].map((p) => (
                <div key={p.label}>
                  <div className="text-xs text-gray-500 mb-2 font-medium">{p.label}</div>
                  <select value={p.month} onChange={(e) => p.setMonth(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2">
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <input type="number" value={p.year} onChange={(e) => p.setYear(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
            </div>
            <button onClick={loadCompare} className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
              {t("compare")}
            </button>
          </div>
          {cmpData[0] && cmpData[1] && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="text-left pb-3">{t("metric")}</th>
                    <th className="text-right pb-3">{MONTH_NAMES[cmpMonth1 - 1]} {cmpYear1}</th>
                    <th className="text-right pb-3">{MONTH_NAMES[cmpMonth2 - 1]} {cmpYear2}</th>
                    <th className="text-right pb-3">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: t("revenue"), key: "totalRevenue" as const, fmt: formatCurrency },
                    { label: t("expenses_"), key: "totalExpenses" as const, fmt: formatCurrency },
                    { label: t("netProfit"), key: "netProfit" as const, fmt: formatCurrency },
                  ].map(({ label, key, fmt }) => {
                    const v1 = cmpData[0]![key];
                    const v2 = cmpData[1]![key];
                    const diff = v2 - v1;
                    return (
                      <tr key={key} className="border-t border-gray-100">
                        <td className="py-2 text-gray-600">{label}</td>
                        <td className="py-2 text-right font-medium">{fmt(v1)}</td>
                        <td className="py-2 text-right font-medium">{fmt(v2)}</td>
                        <td className={`py-2 text-right font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {diff >= 0 ? "+" : ""}{fmt(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trends */}
      {tab === "trends" && !loading && trends && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FinCard label={t("activeNow")} value={String(trends.currentActive)} color="text-blue-600" />
            <FinCard label={t("morning")} value={String(trends.currentMorning)} color="text-amber-500" />
            <FinCard label={t("evening")} value={String(trends.currentEvening)} color="text-indigo-500" />
            <FinCard label={t("totalEver")} value={String(trends.totalEver)} color="text-gray-600" />
          </div>
          {trends.trends.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-700 mb-3">{t("customerGrowth")}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends.trends.map((tr) => ({
                  name: tr.month,
                  Active: (tr as Record<string, unknown>).activeCount as number,
                  Added: tr.added,
                  Removed: tr.removed,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Active" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Added" stroke="#22c55e" strokeWidth={1} />
                  <Line type="monotone" dataKey="Removed" stroke="#ef4444" strokeWidth={1} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FinCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
