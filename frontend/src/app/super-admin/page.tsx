"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useOffices } from "@/services/officeService";
import { useCreateOfficeAdmin, useOfficeAdmins } from "@/services/userService";

export default function SuperAdminPage() {
  const { user, role } = useAuth();
  const { data: offices = [], isLoading: isLoadingOffices } = useOffices();
  const { data: admins = [], isLoading: isLoadingAdmins } = useOfficeAdmins();
  const createAdminMutation = useCreateOfficeAdmin();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    officeId: "",
  });
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isSuperAdmin = role === "SUPER_ADMIN";

  const stats = useMemo(() => ([
    { label: "Managed Offices", value: offices.length },
    { label: "Office Admins", value: admins.length },
    { label: "Active Context", value: user?.officeName || "N/A" },
  ]), [admins.length, offices.length, user?.officeName]);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Super Admin Console" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to access the super admin console</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  if (!isSuperAdmin) {
    return (
      <PageLayout
        header={<Header title="Super Admin Console" subtitle="Restricted access" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md border-amber-200 bg-amber-50/80">
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>Only super admins can manage office administrator accounts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go back to dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        }
      />
    );
  }

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setStatusMessage(null);
  };

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!form.officeId) {
      setStatusMessage({ type: "error", message: "Please select an office for the new admin." });
      return;
    }

    try {
      await createAdminMutation.mutateAsync({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        officeId: Number(form.officeId),
      });

      setForm({
        fullName: "",
        username: "",
        email: "",
        password: "",
        officeId: "",
      });
      setStatusMessage({ type: "success", message: "Office admin created successfully." });
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create office admin.",
      });
    }
  };

  const isSubmitting = createAdminMutation.isPending;

  return (
    <PageLayout
      header={
        <Header
          title="Super Admin Console"
          subtitle="Create and oversee office admins without exposing public registration"
        />
      }
      body={
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-xl">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.35),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.18),_transparent_25%)]" />
            <div className="relative grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Super admin only
                </div>
                <h2 className="text-2xl font-semibold sm:text-3xl">Manage office admin onboarding from one place.</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Public registration is disabled. Use this console to create office admins, assign them to the correct office, and keep administrative access controlled.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">{stat.label}</div>
                    <div className="mt-2 text-2xl font-semibold">{typeof stat.value === "number" ? stat.value : stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserPlus className="h-5 w-5 text-sky-700" />
                  Create Office Admin
                </CardTitle>
                <CardDescription>Provide account details and assign the admin to a single office.</CardDescription>
              </CardHeader>
              <CardContent>
                {statusMessage && (
                  <Alert className={statusMessage.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}>
                    <AlertDescription>{statusMessage.message}</AlertDescription>
                  </Alert>
                )}

                <form className="mt-4 space-y-4" onSubmit={handleCreateAdmin}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input
                        id="fullName"
                        value={form.fullName}
                        onChange={(event) => handleChange("fullName", event.target.value)}
                        placeholder="Office administrator name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={form.username}
                        onChange={(event) => handleChange("username", event.target.value)}
                        placeholder="admin.office"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => handleChange("email", event.target.value)}
                        placeholder="admin@university.edu"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Temporary password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(event) => handleChange("password", event.target.value)}
                        placeholder="Set a temporary password"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Office</Label>
                    <Select value={form.officeId} onValueChange={(value) => handleChange("officeId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingOffices ? "Loading offices..." : "Choose an office"} />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office.id} value={office.id.toString()}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="submit" disabled={isSubmitting || isLoadingOffices} className="min-w-40">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Admin"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-sky-700" />
                  Office Admins
                </CardTitle>
                <CardDescription>Current office admin accounts in the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingAdmins ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : admins.length > 0 ? (
                  admins.map((admin) => (
                    <div key={admin.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{admin.name}</div>
                          <div className="text-sm text-slate-500">@{admin.username}</div>
                        </div>
                        <Badge variant="secondary">{admin.role}</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <div>Email: {admin.email}</div>
                        <div>Office: {admin.officeName}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    No office admins have been created yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      }
    />
  );
}