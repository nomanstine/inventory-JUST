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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ShieldCheck, UserCheck, UserPlus, UserX, Users, Trash2 } from "lucide-react";
import { useOffices } from "@/services/officeService";
import { useActivateUser, useCreateOfficeAdmin, useCreateOfficeUser, useDeactivateUser, useDeleteUser, useOfficeAdmins, useOfficeUsers } from "@/services/userService";
import { toast } from "sonner";

export default function SuperAdminPage() {
  const { user, role } = useAuth();
  const { data: offices = [], isLoading: isLoadingOffices } = useOffices();
  const { data: admins = [], isLoading: isLoadingAdmins, isError: isAdminsError, error: adminsError } = useOfficeAdmins();
  const { data: officeUsers = [], isLoading: isLoadingOfficeUsers, isError: isOfficeUsersError, error: officeUsersError } = useOfficeUsers();
  const createAdminMutation = useCreateOfficeAdmin();
  const createOfficeUserMutation = useCreateOfficeUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const deleteUserMutation = useDeleteUser();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    officeId: "",
  });

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const canManageUsers = isSuperAdmin || isAdmin;
  const currentUserOfficeId = user?.officeId ? Number(user.officeId) : null;

  const availableOffices = useMemo(() => {
    if (isSuperAdmin) {
      return offices;
    }

    if (!currentUserOfficeId) {
      return [];
    }

    return offices.filter((office) => office.id === currentUserOfficeId);
  }, [currentUserOfficeId, isSuperAdmin, offices]);

  const stats = useMemo(() => ([
    { label: "Managed Offices", value: isSuperAdmin ? offices.length : availableOffices.length },
    { label: isSuperAdmin ? "Office Admins" : "Office Users", value: isSuperAdmin ? admins.length : officeUsers.length },
    { label: "Active Context", value: user?.officeName || "N/A" },
  ]), [admins.length, availableOffices.length, isSuperAdmin, officeUsers.length, offices.length, user?.officeName]);

  const listedUsers = isSuperAdmin ? admins : officeUsers;
  const isListLoading = isSuperAdmin ? isLoadingAdmins : isLoadingOfficeUsers;
  const isListError = isSuperAdmin ? isAdminsError : isOfficeUsersError;
  const listError = isSuperAdmin ? adminsError : officeUsersError;

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

  if (!canManageUsers) {
    return (
      <PageLayout
        header={<Header title="User Management" subtitle="Restricted access" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md border-amber-200 bg-amber-50/80">
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>Only admins and super admins can manage office administrator accounts.</CardDescription>
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
  };

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();

    const selectedOfficeId = isSuperAdmin ? form.officeId : (currentUserOfficeId ? currentUserOfficeId.toString() : "");

    if (!selectedOfficeId) {
      toast.error("Please select an office before creating the account.");
      return;
    }

    try {
      if (isSuperAdmin) {
        await createAdminMutation.mutateAsync({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          officeId: Number(selectedOfficeId),
        });
      } else {
        await createOfficeUserMutation.mutateAsync({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }

      setForm({
        fullName: "",
        username: "",
        email: "",
        password: "",
        officeId: isSuperAdmin ? "" : (currentUserOfficeId ? currentUserOfficeId.toString() : ""),
      });
      toast.success(isSuperAdmin ? "Office admin created successfully." : "Office user created successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.");
    }
  };

  const isSubmitting = createAdminMutation.isPending || createOfficeUserMutation.isPending;
  const isAccountActionPending = deactivateUserMutation.isPending || activateUserMutation.isPending || deleteUserMutation.isPending;

  const handleDeactivateAccount = async (id: string, username: string) => {
    const confirmed = window.confirm(`Deactivate @${username}? They will not be able to sign in until reactivated.`);
    if (!confirmed) {
      return;
    }

    try {
      await deactivateUserMutation.mutateAsync(id);
      toast.success(`@${username} was deactivated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deactivate account.");
    }
  };

  const handleActivateAccount = async (id: string, username: string) => {
    try {
      await activateUserMutation.mutateAsync(id);
      toast.success(`@${username} was reactivated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to activate account.");
    }
  };

  const handleDeleteAccount = async (id: string, username: string) => {
    const accountLabel = isSuperAdmin ? "admin" : "user";
    const confirmed = window.confirm(`Delete ${accountLabel} @${username}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(id);
      toast.success(`@${username} was deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account.");
    }
  };

  return (
    <PageLayout
      header={
        <Header
          title={isSuperAdmin ? "Super Admin Console" : "Office Admin Console"}
          subtitle={isSuperAdmin
            ? "Create and oversee office admins without exposing public registration"
            : "Create office users for your own office"}
        />
      }
      body={
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-muted/70 p-6 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(2,132,199,0.10),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_28%)]" />
            <div className="relative grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-muted-foreground backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isSuperAdmin ? "Super admin only" : "Admin access"}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Manage office onboarding from one place.</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  {isSuperAdmin
                    ? "Public registration is disabled. Use this console to create office admins, assign them to the correct office, and keep administrative access controlled."
                    : "Public registration is disabled. Use this console to create users only for your office and keep access controlled."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">{typeof stat.value === "number" ? stat.value : stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserPlus className="h-5 w-5 text-primary" />
                  {isSuperAdmin ? "Create Office Admin" : "Create Office User"}
                </CardTitle>
                <CardDescription>
                  {isSuperAdmin
                    ? "Provide account details and assign the admin to a single office."
                    : "Provide account details to create a user account for your office."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="mt-4 space-y-4" onSubmit={handleCreateAdmin}>
                  <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="grid gap-4 md:grid-cols-2">
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

                  {isSuperAdmin && (
                    <div className="space-y-2">
                      <Label>Office</Label>
                      <Select
                        value={form.officeId}
                        onValueChange={(value) => handleChange("officeId", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={isLoadingOffices ? "Loading offices..." : "Choose an office"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOffices.map((office) => (
                            <SelectItem key={office.id} value={office.id.toString()}>
                              {office.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="submit" disabled={isSubmitting || isLoadingOffices} className="w-full sm:w-auto sm:min-w-40">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        (isSuperAdmin ? "Create Admin" : "Create User")
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" />
                  {isSuperAdmin ? "Office Admins" : "Office Users"}
                </CardTitle>
                <CardDescription>
                  {isSuperAdmin ? "Current office admin accounts in the system." : "Current user accounts in your office."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isListLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : isListError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                    {listError instanceof Error ? listError.message : "Failed to load users. Please try again."}
                  </div>
                ) : listedUsers.length > 0 ? (
                  listedUsers.map((listedUser) => (
                    <div key={listedUser.id} className="rounded-2xl border border-border bg-muted/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-foreground">{listedUser.name}</div>
                          <div className="text-sm text-muted-foreground">@{listedUser.username}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={listedUser.active ? "default" : "outline"}>
                            {listedUser.active ? "Active" : "Deactivated"}
                          </Badge>
                          <Badge variant="secondary">{listedUser.role}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 break-all text-sm text-muted-foreground sm:grid-cols-2">
                        <div>Email: {listedUser.email}</div>
                        <div>Office: {listedUser.officeName}</div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {listedUser.active ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAccountActionPending}
                            onClick={() => handleDeactivateAccount(listedUser.id, listedUser.username)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAccountActionPending}
                            onClick={() => handleActivateAccount(listedUser.id, listedUser.username)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isAccountActionPending}
                          onClick={() => handleDeleteAccount(listedUser.id, listedUser.username)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    {isSuperAdmin ? "No office admins have been created yet." : "No office users have been created yet."}
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