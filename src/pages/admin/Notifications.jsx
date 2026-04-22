import React, { useState } from 'react';
import { entities } from '@/api/firebase-entities';
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

const typeLabels = { recordatorio_pago: 'Recordatorio de pago', aviso_general: 'Aviso general', alerta_deuda: 'Alerta de deuda' };

export default function Notifications() {
  const [showNew, setShowNew] = useState(false);
  const [recipient, setRecipient] = useState('all');
  const [type, setType] = useState('aviso_general');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => entities.Notification.list('-created_date', 100),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-active'],
    queryFn: () => entities.Tenant.filter({ status: 'activo' }, '-created_date', 50),
  });

  const handleSend = async () => {
    const isAll = recipient === 'all';
    const tenant = !isAll ? tenants.find(t => t.id === recipient) : null;
    const targets = isAll ? tenants : [tenant];
    await Promise.all(targets.map(t => entities.Notification.create({
      tenant_id: t.id,
      tenant_name: t.full_name,
      message,
      type,
      send_date: new Date().toISOString(),
      is_read: false,
      for_all: isAll,
    })));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setShowNew(false);
    setMessage('');
  };

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        subtitle="Enviar y ver historial de mensajes"
        actions={<Button onClick={() => setShowNew(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo Mensaje</Button>}
      />
      <div className="grid gap-3">
        {notifications.map(n => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${n.type === 'alerta_deuda' ? 'bg-red-500/10' : n.type === 'recordatorio_pago' ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
                <Bell className={`w-4 h-4 ${n.type === 'alerta_deuda' ? 'text-red-600' : n.type === 'recordatorio_pago' ? 'text-yellow-600' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{typeLabels[n.type]} → {n.for_all ? 'Todos' : n.tenant_name}</p>
                  <span className={`w-2 h-2 rounded-full ${n.is_read ? 'bg-muted' : 'bg-primary'}`} />
                </div>
                <p className="text-sm mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.send_date ? format(new Date(n.send_date), 'dd/MM/yyyy HH:mm') : ''}</p>
              </div>
            </div>
          </Card>
        ))}
        {notifications.length === 0 && <Card className="p-8 text-center text-muted-foreground">No hay notificaciones enviadas</Card>}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Notificación</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Destinatario</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los inquilinos</SelectItem>
                  {tenants.map(t => <SelectItem key={t.id} value={t.id}>Casa {t.unit_number} — {t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
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
              <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Escribí tu mensaje..." />
            </div>
            <button
              style={{ backgroundColor: '#2563eb', color: 'white', width: '100%', padding: '10px', borderRadius: '8px', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleSend}
              disabled={!message}
            >
              <Send style={{ width: '14px', height: '14px' }} /> Enviar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}