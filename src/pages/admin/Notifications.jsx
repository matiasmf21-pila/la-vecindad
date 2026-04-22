import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';

const typeLabels = {
  recordatorio_pago: 'Recordatorio de pago',
  aviso_general: 'Aviso general',
  alerta_deuda: 'Alerta de deuda',
};

export default function Notifications() {
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 100),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-active'],
    queryFn: () => base44.entities.Tenant.filter({ status: 'activo' }, '-created_date', 50),
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); setShowNew(false); },
  });

  const handleSend = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const recipient = fd.get('recipient');
    const isAll = recipient === 'all';
    const tenant = !isAll ? tenants.find(t => t.id === recipient) : null;

    if (isAll) {
      // Create one notification for each tenant
      const promises = tenants.map(t => base44.entities.Notification.create({
        tenant_id: t.id,
        tenant_name: t.full_name,
        message: fd.get('message'),
        type: fd.get('type'),
        send_date: new Date().toISOString(),
        is_read: false,
        for_all: true,
      }));
      Promise.all(promises).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        setShowNew(false);
      });
    } else {
      sendMutation.mutate({
        tenant_id: recipient,
        tenant_name: tenant?.full_name,
        message: fd.get('message'),
        type: fd.get('type'),
        send_date: new Date().toISOString(),
        is_read: false,
        for_all: false,
      });
    }
  };

  return (
    <div>
      <PageHeader 
        title="Notificaciones"
        subtitle="Enviar y ver historial de mensajes"
        actions={
          <Button onClick={() => setShowNew(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Nuevo Mensaje
          </Button>
        }
      />

      <div className="grid gap-3">
        {notifications.map(n => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                n.type === 'alerta_deuda' ? 'bg-red-500/10' : n.type === 'recordatorio_pago' ? 'bg-yellow-500/10' : 'bg-primary/10'
              }`}>
                <Bell className={`w-4 h-4 ${
                  n.type === 'alerta_deuda' ? 'text-red-600' : n.type === 'recordatorio_pago' ? 'text-yellow-600' : 'text-primary'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {typeLabels[n.type]} → {n.for_all ? 'Todos' : n.tenant_name}
                  </p>
                  <span className={`w-2 h-2 rounded-full ${n.is_read ? 'bg-muted' : 'bg-primary'}`} />
                </div>
                <p className="text-sm mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.send_date ? format(new Date(n.send_date), 'dd/MM/yyyy HH:mm') : ''}
                </p>
              </div>
            </div>
          </Card>
        ))}
        {notifications.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No hay notificaciones enviadas
          </Card>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificación</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <Label>Destinatario</Label>
              <Select name="recipient" defaultValue="all">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los inquilinos</SelectItem>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>Casa {t.unit_number} — {t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select name="type" defaultValue="aviso_general">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recordatorio_pago">Recordatorio de pago</SelectItem>
                  <SelectItem value="aviso_general">Aviso general</SelectItem>
                  <SelectItem value="alerta_deuda">Alerta de deuda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mensaje</Label>
              <Textarea name="message" rows={4} required placeholder="Escribí tu mensaje..." />
            </div>
            <Button type="submit" className="w-full" disabled={sendMutation.isPending}>
              <Send className="w-4 h-4 mr-1" /> Enviar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}