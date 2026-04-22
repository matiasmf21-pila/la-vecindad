import React, { useState } from 'react';
import { entities } from '@/api/firebase-entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Plus, Eye, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';

const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Payments() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showHistory, setShowHistory] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', month, year],
    queryFn: () => entities.Payment.filter({ month, year }, '-created_date', 50),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-active'],
    queryFn: () => entities.Tenant.filter({ status: 'activo' }, '-created_date', 50),
  });

  const { data: historyPayments = [] } = useQuery({
    queryKey: ['payment-history', showHistory],
    queryFn: () => entities.Payment.filter({ tenant_id: showHistory }, '-created_date', 100),
    enabled: !!showHistory,
  });

  const deletePayment = useMutation({
    mutationFn: (id) => entities.Payment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
  const markPaid = useMutation({
    mutationFn: (paymentId) => entities.Payment.update(paymentId, {
      status: 'Pagado',
      payment_date: format(new Date(), 'yyyy-MM-dd')
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });

  const createPayment = useMutation({
    mutationFn: (data) => entities.Payment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); setShowNew(false); },
  });

  const handleCreatePayment = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tenantId = fd.get('tenant_id');
    const tenant = tenants.find(t => t.id === tenantId);
    createPayment.mutate({
      tenant_id: tenantId,
      tenant_name: tenant?.full_name,
      unit_number: tenant?.unit_number,
      month,
      year,
      amount: Number(fd.get('amount')),
      status: fd.get('status'),
      notes: fd.get('notes'),
    });
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div>
      <PageHeader
        title="Registro de Pagos"
        actions={
          <Button onClick={() => setShowNew(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Registrar Pago
          </Button>
        }
      />
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-lg min-w-[180px] text-center">
          {months[month - 1]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Casa</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay pagos registrados para este mes
                  </TableCell>
                </TableRow>
              )}
              {payments.sort((a, b) => (a.unit_number || 0) - (b.unit_number || 0)).map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">Casa {payment.unit_number}</TableCell>
                  <TableCell>{payment.tenant_name}</TableCell>
                  <TableCell className="text-right font-medium">${payment.amount?.toLocaleString('es-AR')}</TableCell>
                  <TableCell><StatusBadge status={payment.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {payment.status !== 'Pagado' && (
                        <Button variant="ghost" size="sm" onClick={() => markPaid.mutate(payment.id)} className="text-green-600 hover:text-green-700">
                          <Check className="w-4 h-4 mr-1" /> Pagado
                        </Button>
                      )}
                     <Button variant="ghost" size="icon" onClick={() => setShowHistory(payment.tenant_id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deletePayment.mutate(payment.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Historial de Pagos</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {historyPayments.sort((a, b) => b.year - a.year || b.month - a.month).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{months[p.month - 1]} {p.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.payment_date ? `Pagado: ${format(new Date(p.payment_date), 'dd/MM/yyyy')}` : 'Sin fecha de pago'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">${p.amount?.toLocaleString('es-AR')}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pago — {months[month - 1]} {year}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div>
              <Label>Inquilino</Label>
              <Select name="tenant_id" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>Casa {t.unit_number} — {t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto ($)</Label>
              <Input name="amount" type="number" required />
            </div>
            <div>
              <Label>Estado</Label>
              <Select name="status" defaultValue="Pendiente">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="notes" />
            </div>
            <Button type="submit" className="w-full" disabled={createPayment.isPending}>Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}