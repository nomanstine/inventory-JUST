"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Edit, ArrowLeft } from "lucide-react";
import { useOffice } from "@/services/officeService";

interface OfficePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OfficePage({ params }: OfficePageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: officeId } = use(params);

  const { data: office, isLoading } = useOffice(parseInt(officeId));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Office" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (isLoading || !office) {
    return (
      <PageLayout
        header={<Header title="Office" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Office Details"
          subtitle={`Viewing office: ${office.name}`}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/offices")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Offices
              </Button>
              <Button
                onClick={() => router.push(`/offices/${office.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Office
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
                <Building2 className="w-5 h-5" />
                {office.name}
              </CardTitle>
              <CardDescription>
                {office.nameBn && `Bengali: ${office.nameBn}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-lg">{office.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-lg capitalize">{office.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Code</label>
                  <p className="text-lg">{office.code || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={office.isActive ? "default" : "secondary"}>
                    {office.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Order</label>
                  <p className="text-lg">{office.order || '-'}</p>
                </div>
                {office.parent && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Office</label>
                    <p className="text-lg">{office.parent.name}</p>
                  </div>
                )}
              </div>
              {office.description && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-lg">{office.description}</p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Child Offices</label>
                {office.subOffices && office.subOffices.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {office.subOffices.map((sub) => (
                      <Badge key={sub.id} variant="outline">
                        {sub.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No child offices</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}