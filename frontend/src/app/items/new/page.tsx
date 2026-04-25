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
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import { useCreateItem, type ItemForm } from "@/services/itemService";
import { useCategories } from "@/services/categoryService";
import { useUnits } from "@/services/unitService";
import { canCreateByRole } from "@/lib/permissions";
import { toast } from "sonner";

export default function CreateItemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createItem = useCreateItem();
  const { data: categories } = useCategories();
  const { data: units } = useUnits();
  const canCreate = canCreateByRole(user?.role);

  const [formData, setFormData] = useState<ItemForm>({
    name: "",
    description: "",
    categoryId: undefined,
    unitId: undefined,
    price: undefined,
  });

  const handleChange = (field: keyof ItemForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    try {
      await createItem.mutateAsync(formData);
      toast.success("Item created successfully");
      router.push("/items");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create item");
    }
  };

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Create Item" subtitle="" />}
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
        header={<Header title="Create Item" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push("/items")}>Back to Items</Button>
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
          title="Create Item"
          subtitle="Add a new item to the inventory"
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
              <CardTitle>Item Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Item Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter item name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                      value={formData.categoryId?.toString()}
                      onValueChange={(value) => handleChange("categoryId", value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unit of Measurement</Label>
                    <Select
                      value={formData.unitId?.toString()}
                      onValueChange={(value) => handleChange("unitId", value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger id="unitId">
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (Optional)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ""}
                      onChange={(e) => handleChange("price", e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter item description"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createItem.isPending}
                  >
                    {createItem.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Item"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={createItem.isPending}
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
