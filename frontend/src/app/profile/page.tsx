"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Building2, Shield, Edit, Key } from "lucide-react";
import { EditProfileDialog } from "./components/EditProfileDialog";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { useUser } from "@/services/userService";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfilePhotoDialog } from "./components/ProfilePhotoDialog";

function ProfilePageContent() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const isMobile = useIsMobile();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data: viewedUser, isLoading: isLoadingUser } = useUser(userId || "");

  const user = viewedUser || currentUser;
  const isOwnProfile = !userId || userId === currentUser?.id;

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

  if (isLoadingUser) {
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
          title={isOwnProfile ? "My Profile" : `${user?.name || user?.username}'s Profile`}
          subtitle={isMobile ? "" : (isOwnProfile ? "Manage your account information" : "View user information")}
        />
      }
      body={
        <>
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {/* Profile Overview Card */}
            <Card>
              <CardHeader className="space-y-4">
                <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
                  <div className="flex items-center space-x-4">
                    <ProfilePhotoDialog
                      src={(user as any)?.avatarUrl || currentUser?.avatarUrl || null}
                      name={user?.name || currentUser?.name}
                      username={user?.username || currentUser?.username}
                      className={isMobile ? 'h-14 w-14' : 'h-16 w-16'}
                    />
                    <div>
                      <CardTitle className={isMobile ? 'text-xl' : 'text-2xl'}>{user?.name || user?.username}</CardTitle>
                      <CardDescription className={isMobile ? 'text-xs' : ''}>@{user?.username}</CardDescription>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <Button onClick={() => setShowEditDialog(true)} variant="outline" size={isMobile ? 'sm' : 'default'} className={isMobile ? 'w-full' : ''}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className={isMobile ? 'pt-4' : 'pt-6'}>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isMobile ? 'gap-4' : 'gap-6'}`}>
                  {/* Email */}
                  <div className="space-y-1.5">
                    <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email Address
                    </div>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium break-all`}>{user?.email || "Not provided"}</p>
                  </div>

                  {/* Office */}
                  <div className="space-y-1.5">
                    <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Office
                    </div>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>{(user as any)?.office?.name || (user as any)?.officeName || "Not assigned"}</p>
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      <Shield className="h-4 w-4 mr-2" />
                      Role
                    </div>
                    <div>
                      <Badge variant={typeof user?.role === 'string' ? (user?.role === "ADMIN" ? "default" : "secondary") : "secondary"} className={isMobile ? 'text-xs' : ''}>
                        {typeof user?.role === 'string' ? user?.role : user?.role?.name || 'Unknown'}
                      </Badge>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="space-y-1.5">
                    <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      <User className="h-4 w-4 mr-2" />
                      User ID
                    </div>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>#{user?.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings Card */}
            {isOwnProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className={isMobile ? 'text-lg' : ''}>Security Settings</CardTitle>
                  <CardDescription className={isMobile ? 'text-xs' : ''}>Manage your account security</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className={isMobile ? 'pt-4' : 'pt-6'}>
                  <div className="space-y-4">
                    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                      <div>
                        <h3 className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Password</h3>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Change your password to keep your account secure</p>
                      </div>
                      <Button onClick={() => setShowPasswordDialog(true)} variant="outline" size={isMobile ? 'sm' : 'default'} className={isMobile ? 'w-full' : ''}>
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Account Information</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>Additional details about your account</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className={isMobile ? 'pt-4' : 'pt-6'}>
                <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                  <div className="flex justify-between items-center">
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Username</span>
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{user?.username}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Office ID</span>
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{(user as any)?.office?.id || (user as any)?.officeId || "N/A"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Account Type</span>
                    <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>{typeof user?.role === 'string' ? user?.role : user?.role?.name || 'Unknown'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isOwnProfile && (
            <>
              <EditProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
              <ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
            </>
          )}
        </>
      }
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6"><p>Loading...</p></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
