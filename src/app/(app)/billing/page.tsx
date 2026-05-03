"use client";
import { useEffect, useState } from "react";
import { formatCurrency, MONTH_NAMES, getDaysInMonth } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface BillRow {
  bill: { id: number; customerId: number; year: number; month: number; totalQuantity: number; totalAmount: number; paymentStatus: "PAID" | "DUE"; paidDate: string | null };
  customer: { id: number; name: string; mobile: string; shift: string; rate: number; defaultQuantity: number };
}

interface DailyRecord {
  date: string;
  isPresent: boolean;
  quantityTaken: number;
}

type FilterStatus = "ALL" | "PAID" | "DUE";
const PAGE_SIZE = 20;

export default function BillingPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(1);
  const { t } = useLang();

  async function loadBills() {
    setLoading(true);
    const res = await fetch(`/api/billing?year=${year}&month=${month}`);
    if (res.ok) setBills(await res.json());
    setLoading(false);
    setPage(1);
  }

  useEffect(() => { loadBills(); }, [year, month]);

  async function generateBills() {
    setGenerating(true);
    const res = await fetch(`/api/billing?year=${year}&month=${month}`, { method: "POST" });
    setGenerating(false);
    if (res.ok) loadBills();
  }

  async function markPayment(billId: number, status: "PAID" | "DUE") {
    await fetch(`/api/billing/${billId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: status }),
    });
    setBills((prev) => prev.map((b) => b.bill.id === billId ? { ...b, bill: { ...b.bill, paymentStatus: status } } : b));
  }

  async function openPDF(row: BillRow) {
    const [recordsRes, prevBillsRes] = await Promise.all([
      fetch(`/api/attendance/customer/${row.customer.id}?year=${year}&month=${month}`),
      fetch(`/api/billing/customer/${row.customer.id}`),
    ]);
    const dailyRecords: DailyRecord[] = recordsRes.ok ? await recordsRes.json() : [];
    const allBills: BillRow["bill"][] = prevBillsRes.ok ? await prevBillsRes.json() : [];

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevBill = allBills.find((b) => b.year === prevYear && b.month === prevMonth);
    const prevDue = prevBill?.paymentStatus === "DUE" ? prevBill.totalAmount : 0;

    const html = generateBillHTML(row.customer, row.bill, year, month, dailyRecords, prevDue);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  }

  async function shareWhatsApp(row: BillRow) {
    const [recordsRes, prevBillsRes] = await Promise.all([
      fetch(`/api/attendance/customer/${row.customer.id}?year=${year}&month=${month}`),
      fetch(`/api/billing/customer/${row.customer.id}`),
    ]);
    const dailyRecords: DailyRecord[] = recordsRes.ok ? await recordsRes.json() : [];
    const allBills: BillRow["bill"][] = prevBillsRes.ok ? await prevBillsRes.json() : [];

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevBill = allBills.find((b) => b.year === prevYear && b.month === prevMonth);
    const prevDue = prevBill?.paymentStatus === "DUE" ? prevBill.totalAmount : 0;
    const netDue = row.bill.totalAmount + prevDue;

    const lines: string[] = [
      `🐄 *Milk Bill — ${MONTH_NAMES[month - 1]} ${year}*`,
      `Customer: ${row.customer.name}`,
      `Rate: ₹${row.customer.rate}/L`,
      ``,
      `*Daily Record:*`,
    ];

    const days = getDaysInMonth(year, month);
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const rec = dailyRecords.find((r) => r.date === dateStr);
      if (rec && rec.isPresent) {
        lines.push(`  ${d}: ${rec.quantityTaken.toFixed(1)} L`);
      }
    }

    lines.push(``);
    lines.push(`Total Qty: ${row.bill.totalQuantity.toFixed(1)} L`);
    lines.push(`This Month: ₹${row.bill.totalAmount.toFixed(2)}`);
    if (prevDue > 0) {
      lines.push(`Prev Due (${MONTH_NAMES[prevMonth - 1]}): ₹${prevDue.toFixed(2)}`);
    }
    lines.push(`*Net Due: ₹${netDue.toFixed(2)}*`);
    lines.push(`Status: ${row.bill.paymentStatus}`);

    const text = lines.join("\n");
    const phone = row.customer.mobile.replace(/\D/g, "");
    const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  }

  const filtered = bills
    .filter((b) => {
      if (filter === "PAID") return b.bill.paymentStatus === "PAID";
      if (filter === "DUE") return b.bill.paymentStatus === "DUE";
      return true;
    })
    .filter((b) =>
      b.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      b.customer.mobile.includes(search)
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRevenue = bills.reduce((s, b) => s + b.bill.totalAmount, 0);
  const paidAmount = bills.filter((b) => b.bill.paymentStatus === "PAID").reduce((s, b) => s + b.bill.totalAmount, 0);
  const dueAmount = bills.filter((b) => b.bill.paymentStatus === "DUE").reduce((s, b) => s + b.bill.totalAmount, 0);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t("billingTitle")}</h1>

      {/* Month selector + controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">{t("monthly")}</label>
          <select
            value={month}
            onChange={(e) => { setMonth(parseInt(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">{t("yearly")}</label>
          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(parseInt(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
          />
        </div>
        <button
          onClick={generateBills}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-60"
        >
          {generating ? t("generating") : t("generateBills")}
        </button>
        {/* Filter dropdown */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">&nbsp;</label>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as FilterStatus); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">{t("filterAll")}</option>
            <option value="PAID">{t("filterPaid")}</option>
            <option value="DUE">{t("filterDue")}</option>
          </select>
        </div>
        <input
          type="text"
          placeholder={t("searchCustomer")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="ml-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Summary */}
      {bills.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border p-3 text-center">
            <div className="text-lg font-bold text-gray-800">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-gray-500">{t("totalRevenue")}</div>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <div className="text-lg font-bold text-green-600">{formatCurrency(paidAmount)}</div>
            <div className="text-xs text-gray-500">{t("collected")}</div>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <div className="text-lg font-bold text-orange-500">{formatCurrency(dueAmount)}</div>
            <div className="text-xs text-gray-500">{t("pending")}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-10">{t("loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-400 text-center py-10 bg-white rounded-xl border">
          {bills.length === 0 ? t("noBillsGenerated") : t("noResults")}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageRows.map((row) => (
              <div key={row.bill.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${row.customer.shift === "MORNING" ? "bg-amber-400" : "bg-indigo-400"}`}>
                  {row.customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800">{row.customer.name}</div>
                  <div className="text-xs text-gray-400">{row.bill.totalQuantity.toFixed(1)} L · ₹{row.customer.rate}/L</div>
                </div>
                <div className="text-right mr-2">
                  <div className="font-semibold text-gray-800">{formatCurrency(row.bill.totalAmount)}</div>
                  <div className="text-xs text-gray-400">{MONTH_NAMES[month - 1]}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.bill.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {row.bill.paymentStatus}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markPayment(row.bill.id, row.bill.paymentStatus === "PAID" ? "DUE" : "PAID")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {row.bill.paymentStatus === "PAID" ? t("markDue") : t("markPaid")}
                    </button>
                    <button onClick={() => openPDF(row)} className="text-xs text-gray-500 hover:text-gray-700">
                      {t("pdfLabel")}
                    </button>
                    <button onClick={() => shareWhatsApp(row)} className="text-xs text-green-600 hover:text-green-800">
                      📲
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                {t("prev")}
              </button>
              <span className="text-gray-500">
                {t("page")} {page} {t("of")} {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                {t("next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function generateBillHTML(
  customer: BillRow["customer"],
  bill: BillRow["bill"],
  year: number,
  month: number,
  dailyRecords: DailyRecord[],
  prevDue: number
) {
  const days = getDaysInMonth(year, month);
  const netDue = bill.totalAmount + prevDue;

  let dailyRows = "";
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const rec = dailyRecords.find((r) => r.date === dateStr);
    if (rec && rec.isPresent) {
      dailyRows += `<tr><td>${d}</td><td>${rec.quantityTaken.toFixed(1)} L</td></tr>`;
    }
  }

  const prevMonthName = MONTH_NAMES[month === 1 ? 11 : month - 2];
  const prevDueRow = prevDue > 0
    ? `<tr class="due-row"><td>Previous Due (${prevMonthName})</td><td>₹${prevDue.toFixed(2)}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Milk Bill - ${customer.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 420px; margin: 20px auto; padding: 20px; font-size: 14px; }
    h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
    .sub { text-align: center; color: #666; font-size: 13px; margin-bottom: 16px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .info-table td { padding: 5px 4px; border-bottom: 1px solid #eee; }
    .info-table td:last-child { text-align: right; font-weight: 600; }
    .section-title { font-weight: bold; font-size: 13px; color: #444; margin: 14px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .daily-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 13px; }
    .daily-table th { background: #f5f5f5; padding: 5px 6px; text-align: left; font-size: 12px; }
    .daily-table td { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; }
    .daily-table td:last-child { text-align: right; }
    .summary-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .summary-table td { padding: 6px 4px; border-bottom: 1px solid #eee; }
    .summary-table td:last-child { text-align: right; font-weight: 600; }
    .due-row td { color: #b45309; }
    .total-row td { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <h1>🐄 Dairy — Milk Bill</h1>
  <div class="sub">${MONTH_NAMES[month - 1]} ${year}</div>

  <table class="info-table">
    <tr><td>Customer</td><td>${customer.name}</td></tr>
    <tr><td>Mobile</td><td>${customer.mobile}</td></tr>
    <tr><td>Shift</td><td>${customer.shift}</td></tr>
    <tr><td>Rate</td><td>₹${customer.rate}/L</td></tr>
  </table>

  <div class="section-title">Daily Milk Record</div>
  <table class="daily-table">
    <thead><tr><th>Day</th><th>Qty (L)</th></tr></thead>
    <tbody>${dailyRows || '<tr><td colspan="2" style="text-align:center;color:#999">No records</td></tr>'}</tbody>
  </table>

  <table class="summary-table">
    <tr><td>Total Quantity</td><td>${bill.totalQuantity.toFixed(1)} L</td></tr>
    <tr><td>This Month (${MONTH_NAMES[month - 1]})</td><td>₹${bill.totalAmount.toFixed(2)}</td></tr>
    ${prevDueRow}
    <tr class="total-row"><td>Net Amount Due</td><td>₹${netDue.toFixed(2)}</td></tr>
    <tr><td>Status</td><td>${bill.paymentStatus}</td></tr>
  </table>

  <div class="footer">Thank you for your business!</div>
</body>
</html>`;
}
