"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import { useCreateOffice, useOffices, type OfficeForm } from "@/services/officeService";
import { canCreateByRole } from "@/lib/permissions";
import { toast } from "sonner";

export default function CreateOfficePage() {
  const { user } = useAuth();
  const router = useRouter();
  const createOffice = useCreateOffice();
  const { data: offices } = useOffices();
  const canCreate = canCreateByRole(user?.role);

  const [formData, setFormData] = useState<OfficeForm>({
    name: "",
    nameBn: "",
    type: "OFFICE",
    code: "",
    description: "",
    order: 0,
    isActive: true,
    parentId: undefined,
  });

  const handleChange = (field: keyof OfficeForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Office name is required");
      return;
    }

    try {
      await createOffice.mutateAsync(formData);
      toast.success("Office created successfully");
      router.push("/offices");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create office");
    }
  };

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Create Office" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  if (!canCreate) {
    return (
      <PageLayout
        header={<Header title="Create Office" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push("/offices")}>Back to Offices</Button>
              </CardContent>
            </Card>
          </div>
        }
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Create Office"
          subtitle="Add a new office to the system"
        />
      }
      body={
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Office Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Office Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter office name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nameBn">Office Name (Bangla)</Label>
                    <Input
                      id="nameBn"
                      value={formData.nameBn}
                      onChange={(e) => handleChange("nameBn", e.target.value)}
                      placeholder="অফিসের নাম বাংলায়"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Office Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleChange("type", value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select office type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OFFICE">Office</SelectItem>
                        <SelectItem value="DEPARTMENT">Department</SelectItem>
                        <SelectItem value="DIVISION">Division</SelectItem>
                        <SelectItem value="SECTION">Section</SelectItem>
                        <SelectItem value="UNIT">Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Office Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleChange("code", e.target.value)}
                      placeholder="Enter office code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentId">Parent Office</Label>
                    <Select
                      value={formData.parentId?.toString()}
                      onValueChange={(value) => handleChange("parentId", value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger id="parentId">
                        <SelectValue placeholder="Select parent office (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices?.map((office) => (
                          <SelectItem key={office.id} value={office.id.toString()}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => handleChange("order", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter office description"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) => handleChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active Status
                  </Label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createOffice.isPending}
                  >
                    {createOffice.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Office"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={createOffice.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
