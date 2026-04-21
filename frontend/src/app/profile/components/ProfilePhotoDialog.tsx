"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfilePhotoDialogProps {
  src?: string | null;
  name?: string;
  username?: string;
  className?: string;
}

const getInitials = (name?: string, username?: string) => {
  const displayName = name || username || "U";
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function ProfilePhotoDialog({ src, name, username, className = "h-16 w-16" }: ProfilePhotoDialogProps) {
  const [open, setOpen] = useState(false);
  const displayName = name || username || "Profile photo";
  const initials = getInitials(name, username);

  const avatar = (
    <Avatar className={className}>
      <AvatarImage src={src || ""} alt={displayName} />
      <AvatarFallback className="bg-indigo-600 text-white font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (!src) {
    return avatar;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Open ${displayName} profile photo`}
      >
        {avatar}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 text-left">
            <DialogTitle>{displayName}</DialogTitle>
            <DialogDescription>{username ? `@${username}` : "Profile photo"}</DialogDescription>
          </DialogHeader>
          <div className="bg-muted flex items-center justify-center px-6 pb-6">
            <img
              src={src}
              alt={displayName}
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}