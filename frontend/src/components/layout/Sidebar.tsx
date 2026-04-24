'use client';

import { useState } from 'react';
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
  QrCode,
  Building2,
  Ruler,
  User,
  Warehouse,
  FileCheck,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface SidebarContentProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarContent({ isCollapsed = false, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canManageUsers = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const sidebarSections = [
    ...(canManageUsers
      ? [{
          title: 'Administration',
          items: [
            { icon: Sparkles, label: isSuperAdmin ? 'Super Admin Dashboard' : 'Office User Management', href: '/super-admin' },
          ],
        }]
      : []),
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
        { icon: FileCheck, label: 'Requisitions', href: '/requisitions' },
        { icon: Lightbulb, label: 'Suggestive Requisition', href: '/requisitions/suggestive' },
      ]
    },
    {
      title: 'Reports & Tools',
      items: [
        { icon: BarChart3, label: 'Reports', href: '/reports' },
        { icon: QrCode, label: 'Barcode Scan', href: '/barcode' },
        { icon: Sparkles, label: 'AI Recommendations', href: '/ai-recommendations' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: User, label: 'Profile', href: '/profile' },
        { icon: Settings, label: 'Settings', href: '/settings' },
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

    return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-4">
      {sidebarSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {!isCollapsed && (
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
          )}
          <div className="space-y-1">
            {section.items.map((item, itemIndex) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={itemIndex}
                  href={item.href}
                  onClick={onNavigate}
                  className={`
                    flex items-center w-full gap-3 px-3 py-2 text-sm rounded-lg transition-colors
                    ${isCollapsed ? 'justify-center' : ''} 
                    ${active 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Mobile sidebar using Sheet component
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] border-border p-0">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center border-b border-border p-4">
              <Logo size="md" showText href="/dashboard" />
            </div>
            {/* Navigation */}
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={`
        relative h-full border-r border-border bg-background transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex min-h-[73px] items-center justify-between border-b border-border p-4">
          {!isCollapsed && (
            <Logo size="md" showText href="/dashboard" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <SidebarContent isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
