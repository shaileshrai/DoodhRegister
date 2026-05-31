"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { today } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface AttendanceEntry {
  customer: { id: number; name: string; shift: string; defaultQuantity: number | null; mobile: string };
  isPresent: boolean;
  quantityTaken: number;
  record: { id: number } | null;
}

type Shift = "MORNING" | "EVENING" | "OTHER";

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
      <AttendanceInner />
    </Suspense>
  );
}

function AttendanceInner() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const sp = searchParams.get("shift");
  const initialShift: Shift = sp === "EVENING" ? "EVENING" : sp === "OTHER" ? "OTHER" : "MORNING";

  const [date, setDate] = useState(today());
  const [shift, setShift] = useState<Shift>(initialShift);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?date=${date}&shift=${shift}`);
    if (res.ok) setEntries(await res.json());
    setTouched(new Set());
    setLoading(false);
  }, [date, shift]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  function toggle(id: number) {
    setTouched((prev) => { const n = new Set(prev); n.add(id); return n; });
    setEntries((prev) =>
      prev.map((e) =>
        e.customer.id === id
          ? { ...e, isPresent: !e.isPresent, quantityTaken: !e.isPresent ? (e.customer.defaultQuantity ?? 0) : 0 }
          : e
      )
    );
  }

  function setQty(id: number, qty: string) {
    setTouched((prev) => { const n = new Set(prev); n.add(id); return n; });
    setEntries((prev) =>
      prev.map((e) =>
        e.customer.id === id ? { ...e, quantityTaken: parseFloat(qty) || 0 } : e
      )
    );
  }

  function markAll(present: boolean) {
    setTouched(new Set(entries.map((e) => e.customer.id)));
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        isPresent: present,
        quantityTaken: present ? (e.customer.defaultQuantity ?? 0) : 0,
      }))
    );
  }

  async function saveAttendance() {
    setSaving(true);
    // Only send entries the user explicitly touched (toggled, edited qty, or used bulk action)
    // OR entries that already have a server record (so edits to existing records still go through).
    const payload = entries
      .filter((e) => touched.has(e.customer.id) || e.record !== null)
      .map((e) => ({
        customerId: e.customer.id,
        date,
        isPresent: e.isPresent,
        quantityTaken: e.isPresent ? e.quantityTaken : 0,
      }));
    if (payload.length === 0) {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    const res = await fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTouched(new Set());
      loadAttendance();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const presentCount = entries.filter((e) => e.isPresent).length;
  const takenQty = entries.filter((e) => e.isPresent).reduce((s, e) => s + e.quantityTaken, 0);
  const remainingToGive = entries.filter((e) => !e.isPresent).reduce((s, e) => s + (e.customer.defaultQuantity ?? 0), 0);

  const filteredEntries = search.trim()
    ? entries.filter((e) => e.customer.name.toLowerCase().includes(search.trim().toLowerCase()))
    : entries;

  return (
    <div className="p-3 md:p-6 pb-24 md:pb-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">{t("attendance")}</h1>

      {/* Controls — stacked on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3 space-y-2.5">
        {/* Row 1: date + shift toggle */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
          />
          <div className="flex flex-1 rounded-lg overflow-hidden border border-gray-300">
            {(["MORNING", "EVENING", "OTHER"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShift(s)}
                className={`flex-1 py-1.5 text-xs font-medium transition ${
                  shift === s ? "bg-blue-600 text-white" : "bg-white text-gray-600"
                }`}
              >
                {s === "MORNING" ? "🌅" : s === "EVENING" ? "🌙" : "📦"} {s === "MORNING" ? t("morning") : s === "EVENING" ? t("evening") : "Other"}
              </button>
            ))}
          </div>
        </div>
        {/* Row 2: search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Row 3: bulk actions */}
        <div className="flex gap-2">
          <button onClick={() => markAll(true)} className="flex-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg active:bg-green-100">
            ✓ {t("allPresent")}
          </button>
          <button onClick={() => markAll(false)} className="flex-1 text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg active:bg-red-100">
            ✗ {t("allAbsent")}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-3 flex justify-between text-xs md:text-sm">
        <span className="text-blue-700">
          <strong>{presentCount}</strong>/{entries.length} {t("present")}
        </span>
        <span className="text-blue-700">
          {t("takenLabel")}: <strong>{takenQty.toFixed(2)} L</strong>
        </span>
      </div>

      {/* Remaining to give */}
      {remainingToGive > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 mb-3 flex items-center justify-between">
          <div>
            <div className="font-semibold text-amber-800 text-sm">{t("remainingToGive")}</div>
            <div className="text-[11px] text-amber-700">{t("remainingToGiveHint")}</div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{remainingToGive.toFixed(2)} L</div>
        </div>
      )}

      {/* Attendance list */}
      {loading ? (
        <div className="text-gray-400 text-center py-10">{t("loading")}</div>
      ) : entries.length === 0 ? (
        <div className="text-gray-400 text-center py-10">{t("noCustomersShift")}</div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="text-gray-400 text-center py-6">No matches</div>
          ) : (
            filteredEntries.map((entry) => {
              const isSet = touched.has(entry.customer.id) || entry.record !== null;
              const showTaken = isSet && entry.isPresent;
              const showNot = isSet && !entry.isPresent;
              return (
              <div
                key={entry.customer.id}
                className={`bg-white rounded-xl border p-3 flex items-center gap-3 transition ${
                  showTaken ? "border-green-300" : showNot ? "border-red-200 opacity-75" : "border-gray-200"
                }`}
              >
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => { if (!showTaken) toggle(entry.customer.id); }}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                      showTaken
                        ? "bg-green-500 text-white"
                        : "bg-white border border-gray-300 text-gray-400"
                    }`}
                  >
                    ✓ Taken
                  </button>
                  <button
                    onClick={() => {
                      if (!showNot) {
                        setTouched((prev) => { const n = new Set(prev); n.add(entry.customer.id); return n; });
                        setEntries((prev) => prev.map((e) => e.customer.id === entry.customer.id ? { ...e, isPresent: false, quantityTaken: 0 } : e));
                      }
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                      showNot
                        ? "bg-red-400 text-white"
                        : "bg-white border border-gray-300 text-gray-400"
                    }`}
                  >
                    ✗ Not
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{entry.customer.name}</div>
                  <div className="text-[11px] text-gray-400">{entry.customer.mobile}</div>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={entry.quantityTaken}
                  onChange={(e) => setQty(entry.customer.id, e.target.value)}
                  disabled={!entry.isPresent}
                  className="w-16 border border-gray-300 rounded-lg px-1.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="L"
                />
              </div>
              );
            })
          )}
        </div>
      )}

      {/* Save button — fixed at bottom on mobile */}
      {entries.length > 0 && (
        <div className="fixed md:sticky bottom-16 md:bottom-4 left-0 right-0 px-3 md:px-0 z-40">
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition disabled:opacity-60"
          >
            {saving ? t("saving") : saved ? `✓ ${t("saved")}` : t("saveAttendance")}
          </button>
        </div>
      )}
    </div>
  );
}
