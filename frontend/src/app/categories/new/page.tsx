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
import { Tag, ArrowLeft, Loader2 } from "lucide-react";
import { useCreateCategory, type CategoryForm } from "@/services/categoryService";
import { canCreateByRole } from "@/lib/permissions";
import { toast } from "sonner";

export default function CreateCategoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createCategory = useCreateCategory();
  const canCreate = canCreateByRole(user?.role);

  const [formData, setFormData] = useState<CategoryForm>({
    name: "",
    description: "",
  });

  const handleChange = (field: keyof CategoryForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await createCategory.mutateAsync(formData);
      toast.success("Category created successfully");
      router.push("/categories");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create category");
    }
  };

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Create Category" subtitle="" />}
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
        header={<Header title="Create Category" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push("/categories")}>Back to Categories</Button>
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
          title="Create Category"
          subtitle="Add a new category for organizing items"
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
              <CardTitle>Category Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter category description"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createCategory.isPending}
                  >
                    {createCategory.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Category"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={createCategory.isPending}
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
