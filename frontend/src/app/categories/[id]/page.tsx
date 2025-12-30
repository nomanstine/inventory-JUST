"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tag, Edit, ArrowLeft } from "lucide-react";
import { useCategory } from "@/services/categoryService";

interface CategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: categoryId } = use(params);

  const { data: category, isLoading } = useCategory(parseInt(categoryId));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Category" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (isLoading || !category) {
    return (
      <PageLayout
        header={<Header title="Category" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Category Details"
          subtitle={`Viewing category: ${category.name}`}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/categories")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Button>
              <Button
                onClick={() => router.push(`/categories/${category.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Category
              </Button>
            </div>
          }
        />
      }
      body={
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                {category.name}
              </CardTitle>
              <CardDescription>
                Category details and information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-lg">{category.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg">{category.name}</p>
                </div>
              </div>
              {category.description && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-lg">{category.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}