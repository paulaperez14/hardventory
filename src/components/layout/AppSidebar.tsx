'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { SIDENAV_ITEMS } from '@/lib/constants';
import type { NavItem, UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { AppLogo } from '@/components/AppLogo';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const filterNavItemsByRole = (items: NavItem[], role: UserRole | undefined): NavItem[] => {
    if (!role) return [];
    return items
      .filter(item => item.roles.includes(role))
      .map(item => ({
        ...item,
        subItems: item.subItems ? filterNavItemsByRole(item.subItems, role) : undefined,
      }));
  };

  const visibleNavItems = filterNavItemsByRole(SIDENAV_ITEMS, user?.role);

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
           <AppLogo className="h-8 w-auto group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 [&>span]:group-data-[collapsible=icon]:hidden"/>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <ScrollArea className="h-full">
        <SidebarMenu>
          {visibleNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref >
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, side: 'right', className: 'ml-2' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
              {item.subItems && item.subItems.length > 0 && (
                <SidebarMenuSub>
                  {item.subItems.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.label}>
                       <Link href={subItem.href} passHref >
                        <SidebarMenuSubButton isActive={pathname === subItem.href}>
                          <subItem.icon />
                          <span>{subItem.label}</span>
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
