// Mobile number login — first step of OTP verification (PRD §7). Validates the
// number, requests an OTP, and forwards to the verification screen while keeping
// the QR context and intended destination.

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, ShieldCheck } from "lucide-react";

import { requestJson } from "@/api";
import CustomerLayout from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setSession } = useCustomer();
  const [mobile, setMobile] = useState(session.mobile ?? "");
  const [name, setName] = useState(session.name ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from ?? "/order/menu";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const payload = await requestJson("/customer/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      setSession((current) => ({ ...current, mobile, name }));
      navigate("/order/otp", { state: { from, devOtp: payload.data.devOtp } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomerLayout title="Verify your number" showBack onBack={() => navigate("/order")}>
      <div className="flex flex-col gap-6 px-5 py-8">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-orange/10 text-brand-orange">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Login or sign up</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll send a one-time password to verify your mobile number before you order.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-brand-cream/80 bg-white px-4 py-3 text-sm outline-none focus:border-brand-orange"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mobile number</label>
            <div className="flex items-center gap-2 rounded-xl border border-brand-cream/80 bg-white px-4 py-3 focus-within:border-brand-orange">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">+91</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                inputMode="numeric"
                className="w-full bg-transparent text-sm outline-none"
                autoFocus
              />
            </div>
          </div>

          {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Sending OTP…" : "Send OTP"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to receive a verification SMS.
        </p>
      </div>
    </CustomerLayout>
  );
}
