// Profile (/profile) — owner account details, password change, and notification
// preferences. Data from the mock layer: GET/PATCH /restaurant_owner/profile.

import { useEffect, useState } from "react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const NOTIFICATION_OPTIONS = [
  { key: "newOrders", label: "New orders", note: "Alert me when a new order is placed." },
  { key: "cancellations", label: "Cancellations", note: "Alert me on cancellation requests." },
  { key: "lowStock", label: "Low stock", note: "Alert me when inventory runs low." },
  { key: "dailyReport", label: "Daily report", note: "Email me a daily summary." },
];

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestJson("/restaurant_owner/profile")
      .then((payload) => setProfile(payload.data))
      .catch((err) => setError(err.message));
  }, []);

  function update(patch) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  function updateNotification(key, value) {
    setProfile((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value },
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setStatus("");
    if (password.next && password.next !== password.confirm) {
      setStatus("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await requestJson("/restaurant_owner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          notifications: profile.notifications,
          ...(password.next ? { password: password.next } : {}),
        }),
      });
      setPassword({ next: "", confirm: "" });
      setStatus("Profile saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !profile) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!profile) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading profile…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account details and notification preferences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status ? (
              <span
                className={
                  status.includes("not match") ? "text-sm text-brand-maroon" : "text-sm text-brand-green"
                }
              >
                {status}
              </span>
            ) : null}
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand-gradient text-white hover:brightness-105"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Identity */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-brand-gradient text-lg font-semibold text-white">
                {initials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">
                {profile.role} · joined{" "}
                {new Date(profile.joinedAt).toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account details */}
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-base font-bold">Account Details</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={profile.name} onChange={(e) => update({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={profile.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={profile.role} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-base font-bold">Change Password</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                value={password.next}
                onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Re-enter new password"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-base font-bold">Notification Preferences</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {NOTIFICATION_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="flex items-center justify-between rounded-xl border border-brand-cream/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.note}</p>
                </div>
                <Switch
                  checked={profile.notifications[opt.key]}
                  onCheckedChange={(v) => updateNotification(opt.key, v)}
                />
              </label>
            ))}
          </CardContent>
        </Card>
      </form>
    </DashboardLayout>
  );
}
