"use client";
import { createContext, useContext, useState, useEffect } from "react";

export type Lang = "en" | "hi";

const translations = {
  en: {
    // Nav
    dashboard: "Dashboard",
    attendance: "Attendance",
    customers: "Customers",
    billing: "Billing",
    expenses: "Expenses",
    reports: "Reports",
    logout: "Logout",
    // Dashboard
    markAttendance: "Mark Attendance",
    morningShift: "Morning Shift",
    eveningShift: "Evening Shift",
    expected: "Expected (L)",
    taken: "Taken (L)",
    notTaken: "Not taken",
    remainingToGive: "Still to give (L)",
    remainingToGiveHint: "Hold this much back from dairy",
    notTakingToday: "Not taking milk today",
    financialSummary: "Financial Summary",
    revenue: "Revenue",
    expenses_: "Expenses",
    netProfit: "Net Profit",
    dueBills: "Due Bills",
    addCustomer: "Add Customer",
    addExpense: "Add Expense",
    viewBills: "View Bills",
    loading: "Loading…",
    // Attendance
    date: "Date",
    shift: "Shift",
    allPresent: "All Present",
    allAbsent: "All Absent",
    present: "present",
    takenLabel: "Taken",
    qtyL: "Qty (L)",
    saveAttendance: "Save Attendance",
    saving: "Saving…",
    saved: "✓ Saved!",
    noCustomersShift: "No customers in this shift",
    // Customers
    addCustomerBtn: "+ Add Customer",
    searchPlaceholder: "Search by name or mobile…",
    all: "All",
    morning: "Morning",
    evening: "Evening",
    active: "Active",
    inactive: "Inactive",
    noCustomers: "No customers found",
    // Add customer form
    fullName: "Full Name",
    mobileNumber: "Mobile Number",
    ratePerL: "Rate (₹/Litre)",
    dailyQty: "Daily Qty (Litres)",
    addCustomerTitle: "Add Customer",
    adding: "Adding…",
    allFieldsRequired: "All fields are required",
    invalidMobile: "Mobile number must be exactly 10 digits",
    // Customer detail
    calendar: "📅 Calendar",
    bills: "🧾 Bills",
    edit: "✏️ Edit",
    totalOutstandingDue: "Total Outstanding Due",
    noBillsYet: "No bills yet",
    markPaid: "Mark Paid",
    markDue: "Mark Due",
    saveChanges: "Save Changes",
    deactivate: "Deactivate",
    deactivateConfirm: "Mark this customer as inactive?",
    notRecorded: "Not recorded",
    absent: "Absent",
    // Billing
    billingTitle: "Billing",
    generateBills: "Generate Bills",
    generating: "Generating…",
    totalRevenue: "Total Revenue",
    collected: "Collected",
    pending: "Pending",
    noBillsGenerated: 'No bills generated yet. Click "Generate Bills" to create them.',
    noResults: "No results",
    pdfLabel: "📄 PDF",
    searchCustomer: "Search customer…",
    // Expenses
    expensesTitle: "Expenses",
    addExpenseBtn: "+ Add Expense",
    category: "Category",
    amount: "Amount (₹)",
    description: "Description (optional)",
    descriptionPlaceholder: "e.g. Monthly fodder purchase",
    cancel: "Cancel",
    add: "Add",
    noExpenses: "No expenses recorded",
    totalFor: "Total for",
    deleteConfirm: "Delete this expense?",
    addExpenseTitle: "Add Expense",
    // Reports
    reportsTitle: "Reports",
    monthly: "Monthly",
    yearly: "Yearly",
    compare: "Compare",
    trends: "Trends",
    annualRevenue: "Annual Revenue",
    annualExpenses: "Annual Expenses",
    annualProfit: "Annual Profit",
    monthByMonth: "Month-by-Month",
    expenseBreakdown: "Expense Breakdown",
    noExpensesMonth: "No expenses this month",
    period1: "Period 1",
    period2: "Period 2",
    metric: "Metric",
    customerGrowth: "Customer Growth",
    activeNow: "Active Now",
    totalEver: "Total Ever",
    // Billing filters
    filterAll: "All",
    filterPaid: "Paid",
    filterDue: "Due / Unpaid",
    prevMonthDue: "Previous Month Due",
    netDue: "Net Amount Due",
    thisMonthBill: "This Month",
    dailyBreakdown: "Daily Milk Record",
    day: "Day",
    qty: "Qty (L)",
    shareWhatsApp: "Share on WhatsApp",
    // Pagination
    prev: "← Prev",
    next: "Next →",
    page: "Page",
    of: "of",
    // Landing / shift selector
    selectShiftTitle: "Mark Today's Attendance",
    selectShiftSubtitle: "Select a shift to start marking",
    goToDashboard: "View Dashboard",
    customersCount: "customers",
    // Login
    signIn: "Sign In",
    signingIn: "Signing in…",
    enterPassword: "Enter admin password",
    incorrectPassword: "Incorrect password. Please try again.",
    defaultPassword: "Default password: dairy123",
    dairyAdmin: "DoodhRegister",
    loginSubtitle: "Sign in to manage your dairy",
    password: "Password",
  },
  hi: {
    // Nav
    dashboard: "डैशबोर्ड",
    attendance: "हाजिरी",
    customers: "ग्राहक",
    billing: "बिलिंग",
    expenses: "खर्च",
    reports: "रिपोर्ट",
    logout: "लॉगआउट",
    // Dashboard
    markAttendance: "हाजिरी दर्ज करें",
    morningShift: "सुबह की पाली",
    eveningShift: "शाम की पाली",
    expected: "अनुमानित (L)",
    taken: "लिया गया (L)",
    notTaken: "नहीं लिया",
    remainingToGive: "अभी देना है (L)",
    remainingToGiveHint: "डेयरी को देने से पहले इतना रोकें",
    notTakingToday: "आज दूध नहीं ले रहे",
    financialSummary: "वित्तीय सारांश",
    revenue: "आय",
    expenses_: "खर्च",
    netProfit: "शुद्ध लाभ",
    dueBills: "बकाया बिल",
    addCustomer: "ग्राहक जोड़ें",
    addExpense: "खर्च जोड़ें",
    viewBills: "बिल देखें",
    loading: "लोड हो रहा है…",
    // Attendance
    date: "तारीख",
    shift: "पाली",
    allPresent: "सभी उपस्थित",
    allAbsent: "सभी अनुपस्थित",
    present: "उपस्थित",
    takenLabel: "लिया",
    qtyL: "मात्रा (L)",
    saveAttendance: "हाजिरी सहेजें",
    saving: "सहेज रहे हैं…",
    saved: "✓ सहेजा!",
    noCustomersShift: "इस पाली में कोई ग्राहक नहीं",
    // Customers
    addCustomerBtn: "+ ग्राहक जोड़ें",
    searchPlaceholder: "नाम या मोबाइल से खोजें…",
    all: "सभी",
    morning: "सुबह",
    evening: "शाम",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    noCustomers: "कोई ग्राहक नहीं मिला",
    // Add customer form
    fullName: "पूरा नाम",
    mobileNumber: "मोबाइल नंबर",
    ratePerL: "दर (₹/लीटर)",
    dailyQty: "रोज़ाना मात्रा (लीटर)",
    addCustomerTitle: "ग्राहक जोड़ें",
    adding: "जोड़ रहे हैं…",
    allFieldsRequired: "सभी जानकारी जरूरी है",
    invalidMobile: "मोबाइल नंबर 10 अंकों का होना चाहिए",
    // Customer detail
    calendar: "📅 कैलेंडर",
    bills: "🧾 बिल",
    edit: "✏️ संपादन",
    totalOutstandingDue: "कुल बकाया राशि",
    noBillsYet: "अभी कोई बिल नहीं",
    markPaid: "भुगतान हुआ",
    markDue: "बकाया करें",
    saveChanges: "बदलाव सहेजें",
    deactivate: "निष्क्रिय करें",
    deactivateConfirm: "इस ग्राहक को निष्क्रिय करें?",
    notRecorded: "दर्ज नहीं",
    absent: "अनुपस्थित",
    // Billing
    billingTitle: "बिलिंग",
    generateBills: "बिल बनाएं",
    generating: "बन रहा है…",
    totalRevenue: "कुल आय",
    collected: "प्राप्त",
    pending: "बकाया",
    noBillsGenerated: "अभी कोई बिल नहीं। \"बिल बनाएं\" पर क्लिक करें।",
    noResults: "कोई परिणाम नहीं",
    pdfLabel: "📄 PDF",
    searchCustomer: "ग्राहक खोजें…",
    // Expenses
    expensesTitle: "खर्च",
    addExpenseBtn: "+ खर्च जोड़ें",
    category: "श्रेणी",
    amount: "राशि (₹)",
    description: "विवरण (वैकल्पिक)",
    descriptionPlaceholder: "जैसे: मासिक चारा खरीद",
    cancel: "रद्द करें",
    add: "जोड़ें",
    noExpenses: "कोई खर्च दर्ज नहीं",
    totalFor: "कुल",
    deleteConfirm: "यह खर्च हटाएं?",
    addExpenseTitle: "खर्च जोड़ें",
    // Reports
    reportsTitle: "रिपोर्ट",
    monthly: "मासिक",
    yearly: "वार्षिक",
    compare: "तुलना",
    trends: "रुझान",
    annualRevenue: "वार्षिक आय",
    annualExpenses: "वार्षिक खर्च",
    annualProfit: "वार्षिक लाभ",
    monthByMonth: "महीने दर महीने",
    expenseBreakdown: "खर्च विवरण",
    noExpensesMonth: "इस महीने कोई खर्च नहीं",
    period1: "अवधि 1",
    period2: "अवधि 2",
    metric: "मापदंड",
    customerGrowth: "ग्राहक वृद्धि",
    activeNow: "अभी सक्रिय",
    totalEver: "कुल अब तक",
    // Billing filters
    filterAll: "सभी",
    filterPaid: "भुगतान हुआ",
    filterDue: "बकाया / अभुगतान",
    prevMonthDue: "पिछले महीने का बकाया",
    netDue: "कुल देय राशि",
    thisMonthBill: "इस महीने",
    dailyBreakdown: "रोज़ाना दूध रिकॉर्ड",
    day: "दिन",
    qty: "मात्रा (L)",
    shareWhatsApp: "WhatsApp पर भेजें",
    // Pagination
    prev: "← पिछला",
    next: "अगला →",
    page: "पृष्ठ",
    of: "का",
    // Landing / shift selector
    selectShiftTitle: "आज की हाजिरी दर्ज करें",
    selectShiftSubtitle: "हाजिरी शुरू करने के लिए पाली चुनें",
    goToDashboard: "डैशबोर्ड देखें",
    customersCount: "ग्राहक",
    // Login
    signIn: "लॉगिन करें",
    signingIn: "लॉगिन हो रहा है…",
    enterPassword: "एडमिन पासवर्ड डालें",
    incorrectPassword: "गलत पासवर्ड। फिर कोशिश करें।",
    defaultPassword: "डिफ़ॉल्ट पासवर्ड: dairy123",
    dairyAdmin: "DoodhRegister",
    loginSubtitle: "अपनी डेयरी प्रबंधित करने के लिए लॉगिन करें",
    password: "पासवर्ड",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

type LangContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("dairy_lang") as Lang | null;
    if (stored === "en" || stored === "hi") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("dairy_lang", l);
  }

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
