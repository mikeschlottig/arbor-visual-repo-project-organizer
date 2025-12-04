import React from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Repo } from '@shared/types';
interface NotificationBellProps {
  repo: Repo;
}
export function NotificationBell({ repo }: NotificationBellProps) {
  // Mock notifications for demo purposes
  const notifications = [
    { id: '1', message: `New comment on PR #${repo.prs[0]?.number}`, read: false },
    { id: '2', message: `PR #${repo.prs[1]?.number} was merged`, read: false },
    { id: '3', message: `You were mentioned in issue #${repo.issues[0]?.number}`, read: true },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map(n => (
          <DropdownMenuItem key={n.id} className={!n.read ? 'font-semibold' : ''}>
            {n.message}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}