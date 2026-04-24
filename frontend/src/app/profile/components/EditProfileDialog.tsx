"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { KEY } from "@/lib/api";
import { updateMyProfile } from "@/services/userService";
import { useQueryClient } from "@tanstack/react-query";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user, refreshUser } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl || null);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || null,
  });

  useEffect(() => {
    setFormData({
      fullName: user?.name || "",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || null,
    });
    setPreviewUrl(user?.avatarUrl || null);
    setSelectedFile(null);
  }, [user, open]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = formData.avatarUrl;

      if (selectedFile) {
        const uploadResult = await uploadToCloudinary(selectedFile, "profile-pictures");
        avatarUrl = uploadResult.secure_url;
      }

      const updatedUser = await updateMyProfile({
        fullName: formData.fullName,
        email: formData.email,
        avatarUrl,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(KEY.user_info, JSON.stringify(updatedUser));
      }

      if (user?.id) {
        queryClient.setQueryData(["user", user.id], updatedUser);
        queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      }

      queryClient.setQueryData(["userProfile"], updatedUser);

      toast.success("Profile updated successfully");
      refreshUser();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const initials = (user?.name || user?.username || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={previewUrl || ""} alt={user?.name || user?.username || "Profile photo"} />
                  <AvatarFallback className="bg-indigo-600 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">Upload a new image to replace your current profile picture.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={user?.username || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Username cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={user?.role || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Role is assigned by administrators</p>
            </div>
          </div>

          <DialogFooter className={isMobile ? 'flex-col gap-2' : ''}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className={isMobile ? 'w-full' : ''}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
