import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';

const typeLabels = {
  recordatorio_pago: 'Recordatorio de pago',
  aviso_general: 'Aviso general',
  alerta_deuda: 'Alerta de deuda',
};

const typeColors = {
  recordatorio_pago: 'bg-yellow-500/10 text-yellow-600',
  aviso_general: 'bg-primary/10 text-primary',
  alerta_deuda: 'bg-red-500/10 text-red-600',
};

export default function MyNotifications() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['my-notifications', user?.tenant_id],
    queryFn: () => base44.entities.Notification.filter({ tenant_id: user.tenant_id }, '-created_date', 100),
    enabled: !!user?.tenant_id,
  });

  // Mark unread as read
  useEffect(() => {
    const unread = notifications.filter(n => !n.is_read);
    unread.forEach(n => {
      base44.entities.Notification.update(n.id, { is_read: true });
    });
    if (unread.length > 0) {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }), 1000);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mis Avisos</h1>
        {unreadCount > 0 && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground">
            {unreadCount} nuevo(s)
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <Card key={n.id} className={`p-4 ${!n.is_read ? 'ring-2 ring-primary/20' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type] || 'bg-muted'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{typeLabels[n.type]}</span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {n.send_date ? format(new Date(n.send_date), 'dd/MM/yyyy HH:mm') : ''}
                </p>
              </div>
            </div>
          </Card>
        ))}
        {notifications.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No tenés avisos</Card>
        )}
      </div>
    </div>
  );
}