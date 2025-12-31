"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Edit, ArrowLeft } from "lucide-react";
import { useItem } from "@/services/itemService";

interface ItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ItemPage({ params }: ItemPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { id: itemId } = use(params);

  const { data: item, isLoading } = useItem(parseInt(itemId));

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Item" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view item details</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  if (isLoading || !item) {
    return (
      <PageLayout
        header={<Header title="Item" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Item Details"
          subtitle={`Viewing item: ${item.name}`}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/items")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Items
              </Button>
              <Button
                onClick={() => router.push(`/items/${item.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Item
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
                <Package className="w-5 h-5" />
                {item.name}
              </CardTitle>
              <CardDescription>
                Item details and information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-lg">{item.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg">{item.name}</p>
                </div>
                {item.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-lg">{item.category.name}</p>
                  </div>
                )}
                {item.unit && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit</label>
                    <p className="text-lg">{item.unit.name}</p>
                  </div>
                )}
              </div>
              {item.description && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-lg">{item.description}</p>
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