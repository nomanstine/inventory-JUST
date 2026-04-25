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
import { Ruler, ArrowLeft, Loader2 } from "lucide-react";
import { useCreateUnit, type UnitForm } from "@/services/unitService";
import { canCreateByRole } from "@/lib/permissions";
import { toast } from "sonner";

export default function CreateUnitPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createUnit = useCreateUnit();
  const canCreate = canCreateByRole(user?.role);

  const [formData, setFormData] = useState<UnitForm>({
    name: "",
    description: "",
  });

  const handleChange = (field: keyof UnitForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Unit name is required");
      return;
    }

    try {
      await createUnit.mutateAsync(formData);
      toast.success("Unit created successfully");
      router.push("/units");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create unit");
    }
  };

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Create Unit" subtitle="" />}
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
        header={<Header title="Create Unit" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push("/units")}>Back to Units</Button>
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
          title="Create Unit"
          subtitle="Add a new unit of measurement"
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

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Unit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Unit Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Pieces, Kilograms, Liters"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Examples: Pieces, Box, Kilogram (kg), Liter (L), Meter (m)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter unit description (optional)"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createUnit.isPending}
                  >
                    {createUnit.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Unit"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={createUnit.isPending}
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
