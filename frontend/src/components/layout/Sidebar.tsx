'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Settings, 
  BarChart3, 
  Menu, 
  Package,
  FolderTree,
  ShoppingCart,
  Send,
  FileText,
  QrCode,
  Building2,
  TrendingUp,
  Ruler,
  User,
  Warehouse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { SidebarItems } from '@/types/constant';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
// import { canAccessRoute, Role } from '@/lib/policies';


const SidebarItems = {
    ALL_OFFICES : "All Offices",
    DEPARTMENTS: "Departments",
    SETTINGS: "Settings",
};


export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);      // for mobile sidebar
  const [isCollapsed, setIsCollapsed] = useState(false); // for desktop collapse
  const [selectedItem, setSelectedItem] = useState<string | null>(SidebarItems.ALL_OFFICES);
  const { role } = useAuth();

  const sidebarSections = [
    {
      title: 'Main',
      items: [
        { icon: Home, label: 'Dashboard', href: '/dashboard' },
        { icon: Building2, label: 'Offices', href: '/offices'},
      ]
    },
    {
      title: 'Inventory',
      items: [
        { icon: Package, label: 'Items', href: '/items' },
        { icon: Warehouse, label: 'Inventory', href: '/inventory' },
        { icon: FolderTree, label: 'Categories', href: '/categories' },
        { icon: Ruler, label: 'Units', href: '/units' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { icon: ShoppingCart, label: 'Purchases', href: '/purchases' },
        { icon: Send, label: 'Transfers', href: '/distributions' },
      ]
    },
    {
      title: 'Reports & Tools',
      items: [
        { icon: BarChart3, label: 'Reports', href: '/reports' },
        { icon: QrCode, label: 'Barcode Scan', href: '/barcode' },
        { icon: TrendingUp, label: 'Analytics', href: '/analytics' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: User, label: 'Profile', href: '/profile' },
        { icon: FileText, label: 'Audit Logs', href: '/logs' },
        { icon: Settings, label: 'Settings', href: '/settings' },
      ]
    }
  ];

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleMobile = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <Button variant="outline" onClick={toggleMobile}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          ${isCollapsed ? 'absolute' : 'fixed'} md:${isCollapsed ? 'absolute' : 'relative'} top-0 left-0 h-full z-50 bg-white transition-all duration-300 ease-in-out
          ${isCollapsed ? '' : 'border-r border-gray-200'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
          w-64
          overflow-y-auto
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-lg">Inventory</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="ml-auto hidden md:flex"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobile}
              className="ml-auto md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {/* {section.items.map((item, itemIndex) => (
                    canAccessRoute(role as Role, item.href) ? (
                      <Link
                        key={itemIndex}
                        href={item.href}
                        onClick={() => {
                          setSelectedItem(item.label);
                          setIsOpen(false); // Close mobile sidebar on navigation
                        }}
                        className={`
                          flex items-center w-full gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors
                          ${isCollapsed ? 'justify-center' : ''} 
                          ${selectedItem === item.label ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                        `}
                        title={isCollapsed ? item.label : ''}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${selectedItem === item.label ? 'text-blue-600' : ''}`} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    ) : null
                  ))} */}
                </div>
              </div>
            ))}
            
          </nav>

        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur bg-opacity-40 z-40 md:hidden"
          onClick={toggleMobile}
        />
      )}
    </>
  );
}
