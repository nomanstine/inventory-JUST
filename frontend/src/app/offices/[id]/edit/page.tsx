"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { useOffice, useUpdateOffice, useOffices } from "@/services/officeService";
import { OfficeForm } from "@/services/officeService";

interface EditOfficePageProps {
  params: Promise<{
    id: string;
  }>;
}

const officeTypes = [
  { label: "Office", value: "office" },
  { label: "Faculty", value: "faculty" },
  { label: "Department", value: "department" },
  { label: "Center", value: "center" },
  { label: "Institute", value: "institute" },
  { label: "Hall", value: "hall" },
  { label: "Facility", value: "facility" },
];

export default function EditOfficePage({ params }: EditOfficePageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: officeId } = use(params);

  const { data: office, isLoading } = useOffice(parseInt(officeId));
  const { data: allOffices = [] } = useOffices();
  const updateOfficeMutation = useUpdateOffice();

  const [formData, setFormData] = useState<OfficeForm>({
    name: "",
    nameBn: "",
    type: "",
    code: "",
    description: "",
    order: 0,
    isActive: true,
    parentId: undefined,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (office) {
      setFormData({
        name: office.name,
        nameBn: office.nameBn || "",
        type: office.type,
        code: office.code || "",
        description: office.description || "",
        order: office.order || 0,
        isActive: office.isActive,
        parentId: office.parent?.id,
      });
    }
  }, [office]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOfficeMutation.mutateAsync({
        id: parseInt(officeId),
        data: formData,
      });
      router.push(`/offices/${officeId}`);
    } catch (error) {
      console.error("Failed to update office:", error);
    }
  };

  const handleInputChange = (field: keyof OfficeForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Edit Office" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (isLoading || !office) {
    return (
      <PageLayout
        header={<Header title="Edit Office" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  const possibleParents = allOffices.filter(o => o.id !== office.id);

  const currentTypeLabel = officeTypes.find(t => t.value === office.type)?.label || "Select type";
  const currentParentName = office.parent?.name || "Select parent office";

  return (
    <PageLayout
      header={
        <Header
          title="Edit Office"
          subtitle={`Editing: ${office.name}`}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push(`/offices/${office.id}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Office
            </Button>
          }
        />
      }
      body={
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Office Details</CardTitle>
              <CardDescription>
                Update the office information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameBn">Bengali Name</Label>
                    <Input
                      id="nameBn"
                      value={formData.nameBn}
                      onChange={(e) => handleInputChange("nameBn", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={currentTypeLabel} />
                      </SelectTrigger>
                      <SelectContent>
                        {officeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => handleInputChange("order", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateOfficeMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateOfficeMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/offices/${office.id}`)}
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