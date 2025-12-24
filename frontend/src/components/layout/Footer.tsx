import React from 'react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-8">
        {/* Copyright */}
          <pre className="text-center text-gray-600">
            © Jashore University of Science and Technology. 
          </pre>
    </footer>
  );
}