"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Ruler, Edit, ArrowLeft } from "lucide-react";
import { useUnit } from "@/services/unitService";

interface UnitPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UnitPage({ params }: UnitPageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: unitId } = use(params);

  const { data: unit, isLoading } = useUnit(parseInt(unitId));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Unit" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (isLoading || !unit) {
    return (
      <PageLayout
        header={<Header title="Unit" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Unit Details"
          subtitle={`Viewing unit: ${unit.name}`}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/units")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Units
              </Button>
              <Button
                onClick={() => router.push(`/units/${unit.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Unit
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
                <Ruler className="w-5 h-5" />
                {unit.name}
              </CardTitle>
              <CardDescription>
                Unit details and information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-lg">{unit.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg">{unit.name}</p>
                </div>
              </div>
              {unit.description && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-lg">{unit.description}</p>
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