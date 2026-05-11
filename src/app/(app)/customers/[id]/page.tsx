"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getDaysInMonth, MONTH_NAMES } from "@/lib/utils";
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

interface DailyRecord {
  id: number;
  date: string;
  quantityTaken: number;
  isPresent: boolean;
}

interface MonthlyBill {
  id: number;
  year: number;
  month: number;
  totalQuantity: number;
  totalAmount: number;
  paymentStatus: "PAID" | "DUE";
  paidDate: string | null;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [form, setForm] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"calendar" | "billing" | "edit">("calendar");
  const { t } = useLang();

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    async function load() {
      const [cRes, bRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/billing/customer/${id}`),
      ]);
      if (cRes.ok) {
        const c = await cRes.json();
        setCustomer(c);
        setForm(c);
      }
      if (bRes.ok) setBills(await bRes.json());
    }
    load();
  }, [id]);

  useEffect(() => {
    fetch(`/api/attendance/customer/${id}?year=${calYear}&month=${calMonth}`)
      .then((r) => r.json())
      .then(setRecords);
  }, [id, calYear, calMonth]);

  async function saveEdit() {
    if (form.mobile && !/^\d{10}$/.test(String(form.mobile))) {
      alert(t("invalidMobile"));
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        mobile: form.mobile,
        shift: form.shift,
        rate: form.rate,
        defaultQuantity: form.defaultQuantity,
      }),
    });
    if (res.ok) {
      router.push("/customers");
      return;
    }
    setSaving(false);
  }

  async function markPayment(billId: number, status: "PAID" | "DUE") {
    await fetch(`/api/billing/${billId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: status }),
    });
    setBills((prev) => prev.map((b) => b.id === billId ? { ...b, paymentStatus: status } : b));
  }

  async function deactivate() {
    if (!confirm(t("deactivateConfirm"))) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    router.push("/customers");
  }

  if (!customer) return <div className="p-6 text-gray-400">{t("loading")}</div>;

  const recordMap = new Map(records.map((r) => [r.date.substring(8, 10), r]));
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const monthTotal = records.filter((r) => r.isPresent).reduce((s, r) => s + r.quantityTaken, 0);
  const monthAmount = monthTotal * (customer.rate ?? 0);
  const totalDue = bills.filter((b) => b.paymentStatus === "DUE").reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="p-3 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${customer.shift === "MORNING" ? "bg-amber-400" : customer.shift === "EVENING" ? "bg-indigo-400" : "bg-gray-400"}`}>
          {customer.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{customer.name}</h1>
          <p className="text-sm text-gray-400">
            {customer.mobile} · {customer.shift === "MORNING" ? t("morning") : customer.shift === "EVENING" ? t("evening") : "Adhoc"}
            {customer.defaultQuantity != null && ` · ${customer.defaultQuantity}L/day`}
            {customer.rate != null && ` · ₹${customer.rate}/L`}
          </p>
        </div>
      </div>

      {/* Due alert */}
      {totalDue > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-sm text-orange-700">
          {t("totalOutstandingDue")}: <strong>{formatCurrency(totalDue)}</strong>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4 bg-white">
        {(["calendar", "billing", "edit"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize transition ${tab === tabKey ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {tabKey === "calendar" ? t("calendar") : tabKey === "billing" ? t("bills") : t("edit")}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {tab === "calendar" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => {
              if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
              else setCalMonth(m => m - 1);
            }} className="p-2 rounded-lg hover:bg-gray-100">←</button>
            <div className="text-center">
              <div className="font-semibold">{MONTH_NAMES[calMonth - 1]} {calYear}</div>
              <div className="text-xs text-gray-400">{monthTotal.toFixed(2)} L · {formatCurrency(monthAmount)}</div>
            </div>
            <button onClick={() => {
              if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
              else setCalMonth(m => m + 1);
            }} className="p-2 rounded-lg hover:bg-gray-100">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first day of month */}
            {Array.from({ length: new Date(calYear, calMonth - 1, 1).getDay() }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayStr = String(day).padStart(2, "0");
              const record = recordMap.get(dayStr);
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition ${
                    record?.isPresent
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : record
                      ? "bg-red-50 text-red-400 border border-red-100"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  <span>{day}</span>
                  {record?.isPresent && <span className="text-[9px] leading-none">{record.quantityTaken}L</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span> {t("takenLabel")}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-50 border border-red-100 rounded"></span> {t("absent")}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 rounded"></span> {t("notRecorded")}</span>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {tab === "billing" && (
        <div className="space-y-3">
          {bills.length === 0 ? (
            <div className="text-gray-400 text-center py-10 bg-white rounded-xl border">{t("noBillsYet")}</div>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">{MONTH_NAMES[bill.month - 1]} {bill.year}</div>
                    <div className="text-sm text-gray-500">{bill.totalQuantity.toFixed(2)} L · {formatCurrency(bill.totalAmount)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${bill.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {bill.paymentStatus}
                    </span>
                    <button
                      onClick={() => markPayment(bill.id, bill.paymentStatus === "PAID" ? "DUE" : "PAID")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {bill.paymentStatus === "PAID" ? t("markDue") : t("markPaid")}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Tab */}
      {tab === "edit" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {[
              { labelKey: "fullName" as const, key: "name", type: "text", step: undefined },
              { labelKey: "mobileNumber" as const, key: "mobile", type: "tel", step: undefined },
              { labelKey: "ratePerL" as const, key: "rate", type: "number", step: "0.01" },
              { labelKey: "dailyQty" as const, key: "defaultQuantity", type: "number", step: "0.01" },
            ].map(({ labelKey, key, type, step }) => {
              const val = (form as Record<string, unknown>)[key];
              const displayVal = val == null ? "" : String(val);
              const isMobile = key === "mobile";
              const mobileInvalid = isMobile && displayVal.length > 0 && !/^\d{10}$/.test(displayVal);
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t(labelKey)}</label>
                  <input
                    type={type}
                    step={step}
                    value={displayVal}
                    onChange={(e) => {
                      const v = isMobile ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value;
                      setForm((f) => ({ ...f, [key]: type === "number" ? (v === "" ? null : parseFloat(v)) : v }));
                    }}
                    maxLength={isMobile ? 10 : undefined}
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${mobileInvalid ? "border-red-400" : "border-gray-300"}`}
                  />
                  {mobileInvalid && <p className="text-red-500 text-xs mt-1">{t("invalidMobile")}</p>}
                </div>
              );
            })}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("shift")}</label>
              <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-gray-300">
                {(["MORNING", "EVENING", "OTHER"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, shift: s }))}
                    className={`py-2.5 text-sm font-medium transition ${form.shift === s ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
                  >
                    {s === "MORNING" ? `🌅 ${t("morning")}` : s === "EVENING" ? `🌙 ${t("evening")}` : `📦 Other`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {saving ? t("saving") : t("saveChanges")}
            </button>
            {customer.isActive && (
              <button onClick={deactivate} className="px-4 py-2.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100">
                {t("deactivate")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
