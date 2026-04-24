import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/95 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
          <Logo size="sm" showText />
          <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
            © 2025 Jashore University of Science and Technology. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}