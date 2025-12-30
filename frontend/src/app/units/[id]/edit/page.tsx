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
import { ArrowLeft, Save } from "lucide-react";
import { useUnit, useUpdateUnit } from "@/services/unitService";
import { UnitForm } from "@/services/unitService";

interface EditUnitPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditUnitPage({ params }: EditUnitPageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: unitId } = use(params);

  const { data: unit, isLoading } = useUnit(parseInt(unitId));
  const updateUnitMutation = useUpdateUnit();

  const [formData, setFormData] = useState<UnitForm>({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name,
        description: unit.description || "",
      });
    }
  }, [unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUnitMutation.mutateAsync({
        id: parseInt(unitId),
        data: formData,
      });
      router.push(`/units/${unitId}`);
    } catch (error) {
      console.error("Failed to update unit:", error);
    }
  };

  const handleInputChange = (field: keyof UnitForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Edit Unit" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (isLoading || !unit) {
    return (
      <PageLayout
        header={<Header title="Edit Unit" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Edit Unit"
          subtitle={`Editing: ${unit.name}`}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push(`/units/${unit.id}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Unit
            </Button>
          }
        />
      }
      body={
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Unit Details</CardTitle>
              <CardDescription>
                Update the unit information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateUnitMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateUnitMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/units/${unit.id}`)}
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