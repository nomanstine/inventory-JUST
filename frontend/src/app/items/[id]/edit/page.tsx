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
import { ArrowLeft, Save } from "lucide-react";
import { useItem, useUpdateItem } from "@/services/itemService";
import { useCategories } from "@/services/categoryService";
import { useUnits } from "@/services/unitService";
import { ItemForm } from "@/services/itemService";

interface EditItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: itemId } = use(params);

  const { data: item, isLoading } = useItem(parseInt(itemId));
  const { data: allCategories = [] } = useCategories();
  const { data: allUnits = [] } = useUnits();
  const updateItemMutation = useUpdateItem();

  const [formData, setFormData] = useState<ItemForm>({
    name: "",
    description: "",
    categoryId: undefined,
    unitId: undefined,
    price: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        categoryId: item.category?.id,
        unitId: item.unit?.id,
        price: 0, // Assuming price is not in Item interface, adjust if needed
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateItemMutation.mutateAsync({
        id: parseInt(itemId),
        data: formData,
      });
      router.push(`/items/${itemId}`);
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleInputChange = (field: keyof ItemForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Edit Item" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (isLoading || !item) {
    return (
      <PageLayout
        header={<Header title="Edit Item" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  const currentCategoryName = item.category?.name || "Select category";
  const currentUnitName = item.unit?.name || "Select unit";

  return (
    <PageLayout
      header={
        <Header
          title="Edit Item"
          subtitle={`Editing: ${item.name}`}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push(`/items/${item.id}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Item
            </Button>
          }
        />
      }
      body={
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Item Details</CardTitle>
              <CardDescription>
                Update the item information below.
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                      value={formData.categoryId ? formData.categoryId.toString() : "none"}
                      onValueChange={(value) => handleInputChange("categoryId", value === "none" ? undefined : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={currentCategoryName} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {allCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unit</Label>
                    <Select
                      value={formData.unitId ? formData.unitId.toString() : "none"}
                      onValueChange={(value) => handleInputChange("unitId", value === "none" ? undefined : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={currentUnitName} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No unit</SelectItem>
                        {allUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateItemMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/items/${item.id}`)}
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