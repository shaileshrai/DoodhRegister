"use client";
import { useEffect, useState } from "react";
import { formatCurrency, MONTH_NAMES, EXPENSE_CATEGORIES, today } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface Expense {
  id: number;
  category: string;
  date: string;
  amount: number;
  description: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  FODDER: "🌾", MEDICINE: "💊", REPAIRING: "🔧",
  MANPOWER: "👷", POWER: "⚡", OTHER: "📦",
};

export default function ExpensesPage() {
  const { t } = useLang();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [category, setCategory] = useState("ALL");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "FODDER", date: today(), amount: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadExpenses() {
    setLoading(true);
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (category !== "ALL") params.set("category", category);
    const res = await fetch(`/api/expenses?${params}`);
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadExpenses(); }, [year, month, category]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ category: "FODDER", date: today(), amount: "", description: "" });
      loadExpenses();
    }
  }

  async function deleteExpense(id: number) {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});

  return (
    <div className="p-3 md:p-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t("expensesTitle")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          {t("addExpenseBtn")}
        </button>
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl overflow-y-auto max-h-[85vh]">
            <h2 className="text-lg font-bold mb-4">{t("addExpenseTitle")}</h2>
            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t("category")}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{t("date")}</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{t("amount")}</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t("description")}</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                  placeholder={t("descriptionPlaceholder")}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium">{t("cancel")}</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                  {saving ? t("saving") : t("add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="ALL">{t("all")}</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {EXPENSE_CATEGORIES.map((cat) => (
          byCategory[cat] > 0 && (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-lg">{CATEGORY_ICONS[cat]}</div>
              <div className="text-xs text-gray-500">{cat}</div>
              <div className="text-sm font-semibold text-gray-800">{formatCurrency(byCategory[cat])}</div>
            </div>
          )
        ))}
      </div>

      {/* Total */}
      {expenses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex justify-between text-sm">
          <span className="text-red-700 font-medium">{t("totalFor")} {MONTH_NAMES[month - 1]}</span>
          <span className="text-red-700 font-bold">{formatCurrency(total)}</span>
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <div className="text-gray-400 text-center py-10">{t("loading")}</div>
      ) : expenses.length === 0 ? (
        <div className="text-gray-400 text-center py-10 bg-white rounded-xl border">{t("noExpenses")}</div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="text-2xl">{CATEGORY_ICONS[e.category]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800">{e.category}</div>
                <div className="text-xs text-gray-400">{e.date}{e.description ? ` · ${e.description}` : ""}</div>
              </div>
              <div className="font-semibold text-gray-800 mr-2">{formatCurrency(e.amount)}</div>
              <button onClick={() => deleteExpense(e.id)} className="text-gray-300 hover:text-red-400 transition text-lg">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
