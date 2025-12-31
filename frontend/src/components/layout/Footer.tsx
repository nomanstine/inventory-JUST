import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <Logo size="sm" showText />
          <pre className="text-center text-gray-600 text-sm">
            © 2025 Jashore University of Science and Technology. All rights reserved.
          </pre>
        </div>
      </div>
    </footer>
  );
}