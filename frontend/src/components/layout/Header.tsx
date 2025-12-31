'use client';

import React, { useState } from 'react';
import { Bell, ScanLine, User, ChevronDown, LogOut, Settings as SettingsIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [barcode, setBarcode] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      // Navigate to barcode page with barcode
      router.push(`/barcode?barcode=${encodeURIComponent(barcode.trim())}`);
      setBarcode('');
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch(e);
    }
  };

  // Get user initials for avatar
  const getInitials = (name?: string, username?: string) => {
    const displayName = name || username || "U";
    return displayName
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Logo size="md" showText href="/dashboard" />
        <div className="font-semibold text-xl text-gray-900">
          {/* Dashboard */}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Barcode Scanner Search */}
        <form onSubmit={handleBarcodeSearch} className="relative hidden sm:block">
          <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Scan barcode or enter item code..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={handleBarcodeKeyPress}
            className="pl-10 w-80"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2"
            disabled={!barcode.trim()}
          >
            <Search className="h-3 w-3" />
          </Button>
        </form>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" alt={user?.name || user?.username} />
                <AvatarFallback className="bg-blue-500 text-white text-sm">
                  {getInitials(user?.name, user?.username)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block">{user?.name || user?.username || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || user?.username}</p>
                {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}