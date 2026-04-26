

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ShieldCheck, UserCheck, UserPlus, UserX, Users, Trash2, Building2 } from "lucide-react";
import { useCreateOffice, useOffices, useUpdateOffice, type Office, type OfficeForm } from "@/services/officeService";
import { useActivateUser, useCreateOfficeAdmin, useCreateOfficeUser, useDeactivateUser, useDeleteUser, useOfficeAdmins, useOfficeUsers } from "@/services/userService";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

const EMPTY_ARRAY: any[] = [];

export default function SuperAdminPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const { data: offices = EMPTY_ARRAY, isLoading: isLoadingOffices } = useOffices();
  const { data: admins = EMPTY_ARRAY, isLoading: isLoadingAdmins, isError: isAdminsError, error: adminsError } = useOfficeAdmins();
  const { data: officeUsers = EMPTY_ARRAY, isLoading: isLoadingOfficeUsers, isError: isOfficeUsersError, error: officeUsersError } = useOfficeUsers();
  const createAdminMutation = useCreateOfficeAdmin();
  const createOfficeUserMutation = useCreateOfficeUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const deleteUserMutation = useDeleteUser();
  const createOfficeMutation = useCreateOffice();
  const updateOfficeMutation = useUpdateOffice();
  // Search/filter states
  const [userSearch, setUserSearch] = useState("");
  const [officeSearch, setOfficeSearch] = useState("");
  const [officeDropdownSearch, setOfficeDropdownSearch] = useState("");
  const [parentDropdownSearch, setParentDropdownSearch] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    officeId: "",
  });
  const [officeForm, setOfficeForm] = useState<OfficeForm>({
    name: "",
    nameBn: "",
    type: "office",
    code: "",
    description: "",
    order: 0,
    isActive: true,
    parentId: undefined,
  });

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const canManageUsers = isSuperAdmin || isAdmin;
  const currentUserOfficeId = user?.officeId ? Number(user.officeId) : null;

  const availableOffices = useMemo(() => {
    if (isSuperAdmin) return offices;
    if (!currentUserOfficeId) return [];
    return offices.filter((office) => office.id === currentUserOfficeId);
  }, [currentUserOfficeId, isSuperAdmin, offices]);

  const listedUsers = useMemo(() => {
    const users = isSuperAdmin ? admins : officeUsers;
    if (!userSearch.trim()) return users;
    return users.filter((u) =>
      [u.name, u.username, u.email, u.officeName]
        .filter(Boolean)
        .some((field) => field && field.toLowerCase().includes(userSearch.toLowerCase()))
    );
  }, [isSuperAdmin, admins, officeUsers, userSearch]);

  const filteredOffices = useMemo(() => {
    if (!officeSearch.trim()) return offices;
    return offices.filter((office) =>
      [office.name, office.code, office.type]
        .filter(Boolean)
        .some((field) => field && field.toLowerCase().includes(officeSearch.toLowerCase()))
    );
  }, [offices, officeSearch]);



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
  const accountLabel = isSuperAdmin ? "admin" : "user";
  const isOfficeActionPending = createOfficeMutation.isPending || updateOfficeMutation.isPending;

  const handleDeactivateAccount = async (id: string, username: string) => {
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
    try {
      await deleteUserMutation.mutateAsync(id);
      toast.success(`@${username} was deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account.");
    }
  };

  const handleOfficeChange = (field: keyof OfficeForm, value: string | number | boolean | undefined) => {
    setOfficeForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCreateOffice = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!officeForm.name.trim()) {
      toast.error("Office name is required.");
      return;
    }

    if (!officeForm.type.trim()) {
      toast.error("Office type is required.");
      return;
    }

    try {
      await createOfficeMutation.mutateAsync({
        ...officeForm,
        name: officeForm.name.trim(),
        nameBn: officeForm.nameBn?.trim() || "",
        code: officeForm.code?.trim() || "",
        description: officeForm.description?.trim() || "",
      });

      setOfficeForm({
        name: "",
        nameBn: "",
        type: "office",
        code: "",
        description: "",
        order: 0,
        isActive: true,
        parentId: undefined,
      });
      toast.success("Office created successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create office.");
    }
  };

  const handleSetOfficeStatus = async (office: Office, isActive: boolean) => {
    try {
      await updateOfficeMutation.mutateAsync({
        id: office.id,
        data: {
          name: office.name,
          nameBn: office.nameBn || "",
          type: office.type,
          code: office.code || "",
          description: office.description || "",
          order: office.order || 0,
          isActive,
          parentId: office.parent?.id,
        },
      });

      toast.success(`Office ${isActive ? "activated" : "deactivated"} successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update office status.");
    }
  };

  // Dashboard stats and list helpers (must be after all hooks and state, just before return)
  const stats = useMemo(() => ([
    { label: "Managed Offices", value: isSuperAdmin ? offices.length : availableOffices.length },
    { label: isSuperAdmin ? "Office Admins" : "Office Users", value: isSuperAdmin ? admins.length : officeUsers.length },
    { label: "Active Context", value: user?.officeName || "N/A" },
  ]), [admins.length, availableOffices.length, isSuperAdmin, officeUsers.length, offices.length, user?.officeName]);

  const isListLoading = isSuperAdmin ? isLoadingAdmins : isLoadingOfficeUsers;
  const isListError = isSuperAdmin ? isAdminsError : isOfficeUsersError;
  const listError = isSuperAdmin ? adminsError : officeUsersError;

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

            {/* User search filter (visible for both super admin and admin) */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center lg:col-span-full">
              <Label htmlFor="userSearch">Search Users</Label>
              <Input
                id="userSearch"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, username, email, office..."
                className="max-w-xs"
              />
            </div>

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
                          <div className="p-2">
                            <Input
                              placeholder="Type to search..."
                              value={officeDropdownSearch}
                              onChange={e => setOfficeDropdownSearch(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          {availableOffices
                            .filter((office) =>
                              office.name.toLowerCase().includes(officeDropdownSearch.toLowerCase())
                            )
                            .map((office) => (
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
                  <div className="flex flex-col gap-3 max-h-[850px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                    {listedUsers.map((listedUser) => (
                      <div 
                        key={listedUser.id} 
                        className="rounded-2xl border border-border bg-muted/40 p-4 shrink-0 cursor-pointer transition-all hover:border-primary/40 hover:bg-muted/60"
                        onClick={() => router.push(`/profile/${listedUser.id}`)}
                      >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border shadow-sm">
                            <AvatarImage src={listedUser.avatarUrl || ""} alt={listedUser.name || listedUser.username} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {getInitials(listedUser.name, listedUser.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground">{listedUser.name}</div>
                            <div className="text-sm text-muted-foreground">@{listedUser.username}</div>
                          </div>
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
                      <div className="mt-4 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {listedUser.active ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isAccountActionPending}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Deactivate @{listedUser.username}? They will not be able to sign in until reactivated.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  disabled={isAccountActionPending}
                                  onClick={() => handleDeactivateAccount(listedUser.id, listedUser.username)}
                                >
                                  {deactivateUserMutation.isPending ? "Deactivating..." : "Deactivate"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isAccountActionPending}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Activate account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Reactivate @{listedUser.username}? They will be able to sign in again.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  disabled={isAccountActionPending}
                                  onClick={() => handleActivateAccount(listedUser.id, listedUser.username)}
                                >
                                  {activateUserMutation.isPending ? "Activating..." : "Activate"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={isAccountActionPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete {accountLabel} @{listedUser.username}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                disabled={isAccountActionPending}
                                onClick={() => handleDeleteAccount(listedUser.id, listedUser.username)}
                              >
                                {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    {isSuperAdmin ? "No office admins have been created yet." : "No office users have been created yet."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {isSuperAdmin && (
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              {/* Office search filter */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center lg:col-span-full">
                <Label htmlFor="officeSearch">Search Offices</Label>
                <Input
                  id="officeSearch"
                  value={officeSearch}
                  onChange={(e) => setOfficeSearch(e.target.value)}
                  placeholder="Search by name, code, type..."
                  className="max-w-xs"
                />
              </div>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-5 w-5 text-primary" />
                    Create Office
                  </CardTitle>
                  <CardDescription>Create a new office and choose its initial active status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCreateOffice}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="officeName">Office name</Label>
                        <Input
                          id="officeName"
                          value={officeForm.name}
                          onChange={(event) => handleOfficeChange("name", event.target.value)}
                          placeholder="Registrar Office"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="officeNameBn">Office name (Bangla)</Label>
                        <Input
                          id="officeNameBn"
                          value={officeForm.nameBn}
                          onChange={(event) => handleOfficeChange("nameBn", event.target.value)}
                          placeholder="রেজিস্ট্রার অফিস"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="officeType">Type</Label>
                        <Select
                          value={officeForm.type}
                          onValueChange={(value) => handleOfficeChange("type", value)}
                        >
                          <SelectTrigger id="officeType">
                            <SelectValue placeholder="Choose type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="department">Department</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="institute">Institute</SelectItem>
                            <SelectItem value="hall">Hall</SelectItem>
                            <SelectItem value="facility">Facility</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="officeCode">Code</Label>
                        <Input
                          id="officeCode"
                          value={officeForm.code}
                          onChange={(event) => handleOfficeChange("code", event.target.value)}
                          placeholder="REG"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="officeOrder">Display order</Label>
                        <Input
                          id="officeOrder"
                          type="number"
                          min="0"
                          value={officeForm.order}
                          onChange={(event) => handleOfficeChange("order", Number(event.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Parent office</Label>
                        <Select
                          value={officeForm.parentId ? officeForm.parentId.toString() : "none"}
                          onValueChange={(value) => handleOfficeChange("parentId", value === "none" ? undefined : Number(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="No parent" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2">
                              <Input
                                placeholder="Type to search..."
                                value={parentDropdownSearch}
                                onChange={e => setParentDropdownSearch(e.target.value)}
                                className="mb-2"
                              />
                            </div>
                            <SelectItem value="none">No parent</SelectItem>
                            {offices
                              .filter((office) =>
                                office.name.toLowerCase().includes(parentDropdownSearch.toLowerCase())
                              )
                              .map((office) => (
                                <SelectItem key={office.id} value={office.id.toString()}>
                                  {office.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="officeDescription">Description</Label>
                      <Input
                        id="officeDescription"
                        value={officeForm.description}
                        onChange={(event) => handleOfficeChange("description", event.target.value)}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Initial status</Label>
                      <Select
                        value={officeForm.isActive ? "active" : "inactive"}
                        onValueChange={(value) => handleOfficeChange("isActive", value === "active")}
                      >
                        <SelectTrigger className="w-full md:w-72">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Deactivated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isOfficeActionPending || isLoadingOffices} className="w-full sm:w-auto sm:min-w-40">
                        {createOfficeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating office...
                          </>
                        ) : (
                          "Create Office"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-5 w-5 text-primary" />
                    Office Status
                  </CardTitle>
                  <CardDescription>Activate or deactivate offices from this panel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoadingOffices ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : filteredOffices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      {offices.length === 0 ? "No offices found." : "No offices match your search."}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[850px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                      {filteredOffices.map((office) => (
                        <div 
                          key={office.id} 
                          className="rounded-2xl border border-border bg-muted/40 p-4 shrink-0 cursor-pointer transition-all hover:border-primary/40 hover:bg-muted/60"
                          onClick={() => router.push(`/offices/${office.id}`)}
                        >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-foreground">{office.name}</div>
                            <div className="text-sm text-muted-foreground">{office.code || "No code"} · {office.type}</div>
                          </div>
                          <Badge variant={office.isActive ? "default" : "outline"}>
                            {office.isActive ? "Active" : "Deactivated"}
                          </Badge>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          Parent: {office.parent?.name || "None"}
                        </div>
                        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {office.isActive ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isOfficeActionPending}
                                >
                                  Deactivate Office
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate office?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deactivate {office.name}? Users mapped to this office will keep their account but this office will become inactive.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    disabled={isOfficeActionPending}
                                    onClick={() => handleSetOfficeStatus(office, false)}
                                  >
                                    {updateOfficeMutation.isPending ? "Deactivating..." : "Deactivate"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isOfficeActionPending}
                                >
                                  Activate Office
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Activate office?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Reactivate {office.name}? The office will be available again across the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    disabled={isOfficeActionPending}
                                    onClick={() => handleSetOfficeStatus(office, true)}
                                  >
                                    {updateOfficeMutation.isPending ? "Activating..." : "Activate"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      }
    />
  );
}