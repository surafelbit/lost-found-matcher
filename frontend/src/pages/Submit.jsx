import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import {
  Laptop,
  Backpack,
  Shirt,
  KeyRound,
  CreditCard,
  Wallet,
  Smartphone,
  Headphones,
  CloudRain,
  Package2,
  SearchX,
  HandHelping,
  Lock,
  ArrowLeft,
  ArrowRight,
  Send,
  MapPin,
  Upload,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

/* ── Constants ─────────────────────────────────────────────── */
const CATEGORIES = [
  {
    value: "electronics",
    label: "Electronics",
    Icon: Laptop,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    value: "bags",
    label: "Bags",
    Icon: Backpack,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    value: "clothing",
    label: "Clothing",
    Icon: Shirt,
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  {
    value: "keys",
    label: "Keys",
    Icon: KeyRound,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    value: "id_cards",
    label: "ID Cards",
    Icon: CreditCard,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    value: "wallet",
    label: "Wallet",
    Icon: Wallet,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    value: "phone",
    label: "Phone",
    Icon: Smartphone,
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    value: "headphones",
    label: "Headphones",
    Icon: Headphones,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
  {
    value: "umbrella",
    label: "Umbrella",
    Icon: CloudRain,
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
  {
    value: "other",
    label: "Other",
    Icon: Package2,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

const COLORS = [
  { id: "black", hex: "#000000" },
  { id: "white", hex: "#ffffff" },
  { id: "gray", hex: "#6b7280" },
  { id: "blue", hex: "#2563eb" },
  { id: "red", hex: "#dc2626" },
  { id: "other", hex: "#f1f5f9", isOther: true },
];

const LOCATIONS = [
  "Main Library",
  "Student Union",
  "Science Building",
  "Campus Gym",
  "The Quad",
  "Cafeteria",
  "Administration Building",
  "Parking Lot A",
  "Parking Lot B",
  "Dormitory Block",
];

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  type: "lost",
  category: "",
  color: "",
  image_url: "",
  description: "",
  location: "",
  event_date: "",
  contact: "",
  private_detail: "",
};

/* ── Sub-components ────────────────────────────────────────── */
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500 font-medium">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {msg}
    </p>
  );
}

function StepIndicator({ step, currentStep, label }) {
  const done = step < currentStep;
  const active = step === currentStep;
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-300 ${
          done
            ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            : active
              ? "bg-indigo-600 text-white shadow-[0_0_16px_rgba(79,70,229,0.45)] scale-110 ring-4 ring-white"
              : "bg-cream-100 text-gray-400 ring-4 ring-white"
        }`}
      >
        {done ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          step
        )}
      </div>
      <span
        className={`text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 ${
          active
            ? "text-indigo-700"
            : done
              ? "text-emerald-600"
              : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function Submit() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [key]: "" }));
  };

  const setType = (type) =>
    setForm((f) => ({ ...f, type, private_detail: "" }));

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!form.category.trim()) errors.category = "Please select a category";
      if (!form.description.trim())
        errors.description = "Description is required";
    }
    if (step === 2) {
      if (!form.location.trim()) errors.location = "Location is required";
      if (!form.event_date) {
        errors.event_date = "Date is required";
      } else if (form.event_date > today) {
        errors.event_date = "Date cannot be in the future";
      }
    }
    return errors;
  };

  const goNext = () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearPhotoSelection = () => {
    setPhotoFile(null);
    setUploadError("");
    setForm((f) => ({ ...f, image_url: "" }));
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    const body = {
      type: form.type,
      category: form.category,
      color: form.color || undefined,
      description: form.description.trim(),
      location: form.location.trim(),
      event_date: form.event_date,
      image_url: form.image_url || undefined,
      contact: form.contact.trim() || undefined,
      private_detail:
        form.type === "found"
          ? form.private_detail.trim() || undefined
          : undefined,
    };
    const { data, error } = await api.createReport(body);
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setSuccess(data.report);
    setForm(emptyForm);
    setFieldErrors({});
    setCurrentStep(1);
    setPhotoFile(null);
    setUploadError("");
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] ?? e.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file (PNG, JPG, or GIF).");
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB.");
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadError("");
    setPhotoFile(file);
    setUploading(true);
    const { data, error } = await api.uploadPhoto(file);
    setUploading(false);

    if (error) {
      setUploadError(error);
      setPhotoFile(null);
      setForm((f) => ({ ...f, image_url: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (data?.url) {
      setForm((f) => ({ ...f, image_url: data.url }));
    }
  };

  /* ── Success screen ──────────────────────────────────────── */
  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-8 animate-fade-in-up">
        <div
          className="rounded-2xl p-8 text-center shadow-card"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "Fraunces, serif",
              color: "var(--color-indigo-dark)",
            }}
          >
            Report Submitted!
          </h2>
          <p
            className="text-sm mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Your <strong className="capitalize">{success.type}</strong> report
            for <strong>"{success.category}"</strong> was recorded.
          </p>
          <p
            className="text-xs mb-6"
            style={{ color: "var(--color-text-muted)" }}
          >
            Report ID #{success.id}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/my-reports")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "var(--color-indigo)" }}
            >
              View My Reports →
            </button>
            <button
              onClick={() => setSuccess(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-cream-100"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = ((currentStep - 1) / 2) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold mb-1.5"
          style={{
            fontFamily: "Fraunces, serif",
            color: "var(--color-indigo-dark)",
          }}
        >
          Submit a Report
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Help reunite someone with their belongings — the more detail, the
          better the match.
        </p>
      </div>

      {/* ── Step indicator ──────────────────────────────────── */}
      <div className="mb-8 px-4">
        <div className="flex justify-between items-start relative">
          <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10" />
          <div
            className="absolute top-5 left-[10%] h-0.5 bg-indigo-500 -z-10 transition-all duration-500"
            style={{ width: `calc(${progressPct}% * 0.8)` }}
          />
          <StepIndicator step={1} currentStep={currentStep} label="Details" />
          <StepIndicator
            step={2}
            currentStep={currentStep}
            label="Time & Place"
          />
          <StepIndicator step={3} currentStep={currentStep} label="Contact" />
        </div>
      </div>

      {/* ── Form card ───────────────────────────────────────── */}
      <div
        className="rounded-2xl shadow-card overflow-hidden"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Lost / Found type banner */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setType("lost")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              form.type === "lost"
                ? "bg-red-500 text-white"
                : "bg-cream-50 text-gray-400 hover:bg-cream-100"
            }`}
          >
            <SearchX className="w-4 h-4" /> I Lost Something
          </button>
          <button
            type="button"
            onClick={() => setType("found")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              form.type === "found"
                ? "bg-emerald-500 text-white"
                : "bg-cream-50 text-gray-400 hover:bg-cream-100"
            }`}
          >
            <HandHelping className="w-4 h-4" /> I Found Something
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* ════════ STEP 1 ════════ */}
          {currentStep === 1 && (
            <div className="animate-fade-in-up">
              <h2
                className="text-lg font-semibold mb-6 pb-4 border-b"
                style={{
                  color: "var(--color-indigo-dark)",
                  borderColor: "var(--color-border)",
                }}
              >
                Item Details
              </h2>

              {/* Category grid */}
              <div className="mb-6">
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Category <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(({ value, label, Icon, color, bg }) => {
                    const selected = form.category === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, category: value }));
                          setFieldErrors((fe) => ({ ...fe, category: "" }));
                        }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-150 text-left ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                            : "border-transparent bg-white text-gray-600 hover:border-gray-200 hover:bg-cream-50 shadow-sm"
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            selected ? "bg-indigo-100" : bg
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${selected ? "text-indigo-500" : color}`}
                            strokeWidth={1.75}
                          />
                        </span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
                <FieldError msg={fieldErrors.category} />
              </div>

              {/* Color Picker */}
              <div className="mb-6">
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Primary Color
                </label>
                <div className="flex gap-3 items-center">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, color: c.id }));
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        form.color === c.id
                          ? "ring-2 ring-offset-2 ring-indigo-500 scale-110"
                          : "hover:scale-110 shadow-sm border border-gray-200"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {c.isOther && (
                        <span className="text-gray-500 font-medium text-lg">
                          +
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={`form-input ${fieldErrors.description ? "error" : ""}`}
                  placeholder="Describe the item — colour, brand, markings, serial numbers, distinguishing features…"
                  value={form.description}
                  onChange={set("description")}
                  rows={5}
                />
                <FieldError msg={fieldErrors.description} />
              </div>
            </div>
          )}

          {/* ════════ STEP 2 ════════ */}
          {currentStep === 2 && (
            <div className="animate-fade-in-up">
              <h2
                className="text-lg font-semibold mb-6 pb-4 border-b"
                style={{
                  color: "var(--color-indigo-dark)",
                  borderColor: "var(--color-border)",
                }}
              >
                Time &amp; Place
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    className="block text-sm font-semibold mb-1.5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Date {form.type === "lost" ? "lost" : "found"}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-input ${fieldErrors.event_date ? "error" : ""}`}
                    max={today}
                    value={form.event_date}
                    onChange={set("event_date")}
                  />
                  <FieldError msg={fieldErrors.event_date} />
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold mb-1.5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Approximate Time
                  </label>
                  <input type="time" className="form-input" />
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Optional — helps narrow the match
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Location <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="location-list"
                    className={`form-input pr-10 ${fieldErrors.location ? "error" : ""}`}
                    placeholder="Building, area, or specific spot…"
                    value={form.location}
                    onChange={set("location")}
                  />
                  <datalist id="location-list">
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "var(--color-text-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <FieldError msg={fieldErrors.location} />
              </div>

              {/* Quick-pick chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {LOCATIONS.slice(0, 6).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, location: l }));
                      setFieldErrors((fe) => ({ ...fe, location: "" }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                      form.location === l
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-cream-50 text-gray-500 hover:border-gray-300 hover:bg-cream-100"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════════ STEP 3 ════════ */}
          {currentStep === 3 && (
            <div className="animate-fade-in-up">
              <h2
                className="text-lg font-semibold mb-6 pb-4 border-b"
                style={{
                  color: "var(--color-indigo-dark)",
                  borderColor: "var(--color-border)",
                }}
              >
                Photo &amp; Contact
              </h2>

              {/* Photo upload */}
              <div className="mb-7">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Upload Photo{" "}
                  <span
                    className="text-xs font-normal"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    (optional)
                  </span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 text-center ${
                    dragOver
                      ? "border-indigo-400 bg-indigo-50"
                      : photoFile
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-gray-200 bg-cream-50 hover:border-indigo-300 hover:bg-indigo-50/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileDrop}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center py-4">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                      <p className="text-sm font-medium text-indigo-700">
                        Uploading photo...
                      </p>
                    </div>
                  ) : photoFile ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-emerald-700">
                        {photoFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPhotoSelection();
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                        <svg
                          className="w-7 h-7 text-indigo-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Drag & drop or click to upload
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        PNG, JPG up to 5MB
                      </p>
                    </>
                  )}
                </div>
                {uploadError && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div
                className="pt-6 border-t"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-4"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Contact Information
                </p>
                <div className="mb-4">
                  <label
                    className="block text-sm font-semibold mb-1.5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Optional — only shared with the matched party"
                    value={form.contact}
                    onChange={set("contact")}
                  />
                </div>
                <div
                  className="flex items-start gap-3 rounded-xl p-3.5"
                  style={{
                    background: "var(--color-surface-raised)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Your contact info is kept private and only revealed to the
                    matched party once ownership is verified.
                  </p>
                </div>
              </div>

              {/* API error */}
              {submitError && (
                <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ────────────────────────────────────── */}
          <div
            className={`mt-8 pt-6 border-t flex items-center ${currentStep === 1 ? "justify-end" : "justify-between"}`}
            style={{ borderColor: "var(--color-border)" }}
          >
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="px-6 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-cream-100 flex items-center gap-2"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
                style={{ background: "var(--color-indigo)" }}
              >
                Next Step
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className={`px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2 disabled:opacity-60 ${
                  form.type === "found"
                    ? "bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg"
                    : "bg-red-500 hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg"
                }`}
              >
                {submitting ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit {form.type === "lost" ? "Lost" : "Found"} Report
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
