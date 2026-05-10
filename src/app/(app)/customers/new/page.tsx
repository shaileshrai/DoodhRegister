"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";

export default function NewCustomerPage() {
  const router = useRouter();
  const { t } = useLang();
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    shift: "MORNING",
    rate: "55",
    defaultQuantity: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) {
      setError(t("invalidMobile"));
      return;
    }
    const isOther = form.shift === "OTHER";
    if (!isOther && (!form.rate || !form.defaultQuantity)) {
      setError("Rate and quantity are required for morning/evening customers");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        rate: form.rate ? parseFloat(form.rate) : null,
        defaultQuantity: form.defaultQuantity ? parseFloat(form.defaultQuantity) : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/customers");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add customer");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">{t("addCustomerTitle")}</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("fullName")} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </Field>
          <Field label={t("mobileNumber")} required>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.mobile && form.mobile.length !== 10 ? "border-red-400" : "border-gray-300"}`}
              placeholder="e.g. 9876543210"
              maxLength={10}
              required
            />
            {form.mobile && form.mobile.length !== 10 && (
              <p className="text-red-500 text-xs mt-1">{t("invalidMobile")}</p>
            )}
          </Field>
          <Field label={t("shift")} required>
            <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-gray-300">
              {(["MORNING", "EVENING", "OTHER"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("shift", s)}
                  className={`py-2.5 text-sm font-medium transition ${
                    form.shift === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s === "MORNING" ? `🌅 ${t("morning")}` : s === "EVENING" ? `🌙 ${t("evening")}` : `📦 Other`}
                </button>
              ))}
            </div>
            {form.shift === "OTHER" && (
              <p className="text-xs text-gray-500 mt-1">Adhoc customer — rate & quantity optional</p>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("ratePerL")} required={form.shift !== "OTHER"}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.rate}
                onChange={(e) => set("rate", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 55"
                required={form.shift !== "OTHER"}
              />
            </Field>
            <Field label={t("dailyQty")} required={form.shift !== "OTHER"}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.defaultQuantity}
                onChange={(e) => set("defaultQuantity", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2"
                required={form.shift !== "OTHER"}
              />
            </Field>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {saving ? t("adding") : t("addCustomerTitle")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
