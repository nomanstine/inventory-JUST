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
import { useCategory, useUpdateCategory } from "@/services/categoryService";
import { CategoryForm } from "@/services/categoryService";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: categoryId } = use(params);

  const { data: category, isLoading } = useCategory(parseInt(categoryId));
  const updateCategoryMutation = useUpdateCategory();

  const [formData, setFormData] = useState<CategoryForm>({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCategoryMutation.mutateAsync({
        id: parseInt(categoryId),
        data: formData,
      });
      router.push(`/categories/${categoryId}`);
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleInputChange = (field: keyof CategoryForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Edit Category" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (isLoading || !category) {
    return (
      <PageLayout
        header={<Header title="Edit Category" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Edit Category"
          subtitle={`Editing: ${category.name}`}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push(`/categories/${category.id}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Category
            </Button>
          }
        />
      }
      body={
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Category Details</CardTitle>
              <CardDescription>
                Update the category information below.
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
                    disabled={updateCategoryMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/categories/${category.id}`)}
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