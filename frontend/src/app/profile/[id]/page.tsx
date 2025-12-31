"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Building2, Shield, Edit, Key } from "lucide-react";
import { EditProfileDialog } from "../components/EditProfileDialog";
import { ChangePasswordDialog } from "../components/ChangePasswordDialog";
import { useUser } from "@/services/userService";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { id: userId } = use(params);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data: viewedUser, isLoading: isLoadingUser } = useUser(userId);

  const user = viewedUser;
  const isOwnProfile = userId === currentUser?.id;

  if (!currentUser) {
    return (
      <PageLayout
        header={<Header title="Profile" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view profile</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  if (isLoadingUser || !user) {
    return (
      <PageLayout
        header={<Header title="Profile" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title={isOwnProfile ? "My Profile" : `${user?.fullName || user?.name || user?.username}'s Profile`}
          subtitle={isOwnProfile ? "Manage your account information" : "View user information"}
        />
      }
      body={
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {(user.fullName || user.name)?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || 
                     user.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{user.fullName || user.name || user.username}</CardTitle>
                    <CardDescription>@{user.username}</CardDescription>
                  </div>
                </div>
                {isOwnProfile && (
                  <Button onClick={() => setShowEditDialog(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </div>
                  <p className="text-base font-medium">{user.email || "Not provided"}</p>
                </div>

                {/* Office */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Building2 className="h-4 w-4 mr-2" />
                    Office
                  </div>
                  <p className="text-base font-medium">{user.office?.name || "Not assigned"}</p>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Shield className="h-4 w-4 mr-2" />
                    Role
                  </div>
                  <div>
                    <Badge variant={typeof user.role === 'string' ? (user.role === "ADMIN" ? "default" : "secondary") : (user.role.name === "ADMIN" ? "default" : "secondary")}>
                      {typeof user.role === 'string' ? user.role : user.role.name}
                    </Badge>
                  </div>
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    User ID
                  </div>
                  <p className="text-base font-medium">#{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Password</h3>
                    <p className="text-sm text-gray-500">Change your password to keep your account secure</p>
                  </div>
                  {isOwnProfile && (
                    <Button onClick={() => setShowPasswordDialog(true)} variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Additional details about your account</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Username</span>
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Office ID</span>
                  <span className="text-sm font-medium">{user.office?.id || "N/A"}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Account Type</span>
                  <Badge variant="outline">{typeof user.role === 'string' ? user.role : user.role.name}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}