"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { today } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface AttendanceEntry {
  customer: { id: number; name: string; shift: string; defaultQuantity: number; mobile: string };
  isPresent: boolean;
  quantityTaken: number;
  record: { id: number } | null;
}

const PAGE_SIZE = 20;

export default function AttendancePage() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const initialShift = (searchParams.get("shift") === "EVENING" ? "EVENING" : "MORNING") as "MORNING" | "EVENING";

  const [date, setDate] = useState(today());
  const [shift, setShift] = useState<"MORNING" | "EVENING">(initialShift);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(1);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?date=${date}&shift=${shift}`);
    if (res.ok) setEntries(await res.json());
    setLoading(false);
    setPage(1);
  }, [date, shift]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  function toggle(id: number) {
    setEntries((prev) =>
      prev.map((e) =>
        e.customer.id === id
          ? { ...e, isPresent: !e.isPresent, quantityTaken: !e.isPresent ? e.customer.defaultQuantity : 0 }
          : e
      )
    );
  }

  function setQty(id: number, qty: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.customer.id === id ? { ...e, quantityTaken: parseFloat(qty) || 0 } : e
      )
    );
  }

  function markAll(present: boolean) {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        isPresent: present,
        quantityTaken: present ? e.customer.defaultQuantity : 0,
      }))
    );
  }

  async function saveAttendance() {
    setSaving(true);
    const payload = entries.map((e) => ({
      customerId: e.customer.id,
      date,
      isPresent: e.isPresent,
      quantityTaken: e.isPresent ? e.quantityTaken : 0,
    }));
    const res = await fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const presentCount = entries.filter((e) => e.isPresent).length;
  const takenQty = entries.filter((e) => e.isPresent).reduce((s, e) => s + e.quantityTaken, 0);
  const remainingToGive = entries.filter((e) => !e.isPresent).reduce((s, e) => s + e.customer.defaultQuantity, 0);
  const notTakenList = entries.filter((e) => !e.isPresent);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t("attendance")}</h1>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs text-gray-500 block mb-1">{t("date")}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">{t("shift")}</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {(["MORNING", "EVENING"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShift(s)}
                className={`px-4 py-1.5 text-sm font-medium transition ${
                  shift === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s === "MORNING" ? `🌅 ${t("morning")}` : `🌙 ${t("evening")}`}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => markAll(true)} className="text-sm px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">
            {t("allPresent")}
          </button>
          <button onClick={() => markAll(false)} className="text-sm px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">
            {t("allAbsent")}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 flex flex-wrap gap-4 text-sm">
        <span className="text-blue-700">
          <strong>{presentCount}</strong> / {entries.length} {t("present")}
        </span>
        <span className="text-blue-700">
          {t("takenLabel")}: <strong>{takenQty.toFixed(1)} L</strong>
        </span>
      </div>

      {/* Remaining to give */}
      {remainingToGive > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-amber-800">{t("remainingToGive")}</div>
              <div className="text-xs text-amber-700 mt-0.5">{t("remainingToGiveHint")}</div>
            </div>
            <div className="text-3xl font-bold text-amber-700">{remainingToGive.toFixed(1)} L</div>
          </div>
        </div>
      )}

      {/* Not taken list */}
      {notTakenList.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-sm text-orange-700">
          <strong>{t("notTakingToday")}:</strong>{" "}
          {notTakenList.map((e) => `${e.customer.name} (${e.customer.defaultQuantity}L)`).join(", ")}
        </div>
      )}

      {/* Attendance list */}
      {loading ? (
        <div className="text-gray-400 text-center py-10">{t("loading")}</div>
      ) : entries.length === 0 ? (
        <div className="text-gray-400 text-center py-10">{t("noCustomersShift")}</div>
      ) : (
        <>
          <div className="space-y-2">
            {pageEntries.map((entry) => (
              <div
                key={entry.customer.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition ${
                  entry.isPresent ? "border-green-300" : "border-gray-200 opacity-70"
                }`}
              >
                <button
                  onClick={() => toggle(entry.customer.id)}
                  className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg border-2 transition ${
                    entry.isPresent
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-white border-gray-300 text-gray-300"
                  }`}
                >
                  {entry.isPresent ? "✓" : "○"}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800">{entry.customer.name}</div>
                  <div className="text-xs text-gray-400">{entry.customer.mobile}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{t("qtyL")}</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={entry.quantityTaken}
                    onChange={(e) => setQty(entry.customer.id, e.target.value)}
                    disabled={!entry.isPresent}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
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

      {/* Save button */}
      {entries.length > 0 && (
        <div className="sticky bottom-20 md:bottom-4 mt-4">
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition disabled:opacity-60"
          >
            {saving ? t("saving") : saved ? t("saved") : t("saveAttendance")}
          </button>
        </div>
      )}
    </div>
  );
}
