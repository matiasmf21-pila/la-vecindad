import React, { useState } from 'react';
import { entities } from '@/api/firebase-entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Phone, Mail, CheckCircle, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { format, addMonths } from 'date-fns';

const HOUSE_NUMBERS = Array.from({ length: 11 }, (_, i) => i + 1);
const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Tenants() {
  const [editTenant, setEditTenant] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [payingTenant, setPayingTenant] = useState(null);
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [payMonths, setPayMonths] = useState('1');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [payDueDay, setPayDueDay] = useState('');
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => entities.Tenant.list('-created_date', 50),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => entities.Unit.list('number', 50),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', currentMonth, currentYear],
    queryFn: () => entities.Payment.filter({ month: currentMonth, year: currentYear }, '-created_date', 50),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id) => entities.Tenant.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const { tenantData, unitNumber, rentPrice } = formData;
      let unitId = editTenant?.unit_id || '';
      let existingUnit = units.find(u => u.number === unitNumber);
      if (existingUnit) {
        await entities.Unit.update(existingUnit.id, { rent_price: rentPrice, status: 'ocupada' });
        unitId = existingUnit.id;
      } else {
        const newUnit = await entities.Unit.create({ number: unitNumber, rent_price: rentPrice, status: 'ocupada' });
        unitId = newUnit.id;
      }
      const tData = { ...tenantData, unit_id: unitId, unit_number: unitNumber };
      if (editTenant?.id) return entities.Tenant.update(editTenant.id, tData);
      return entities.Tenant.create(tData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setShowDialog(false);
      setEditTenant(null);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ tenant, paymentDate, monthsCovered, paid, dueDay }) => {
      const unit = units.find(u => u.id === tenant.unit_id);
      const rentPrice = unit?.rent_price || 0;
      const numMonths = parseInt(monthsCovered);
      const payDateObj = new Date(paymentDate + 'T12:00:00');
      const nextDueDate = addMonths(payDateObj, numMonths);
      const nextDueStr = format(nextDueDate, 'yyyy-MM-dd');

      await entities.Tenant.update(tenant.id, {
        next_due_date: nextDueStr,
        due_day: dueDay ? parseInt(dueDay) : null,
      });

      const promises = [];
      for (let i = 0; i < numMonths; i++) {
        const targetDate = addMonths(payDateObj, i);
        const m = targetDate.getMonth() + 1;
        const y = targetDate.getFullYear();
        promises.push(entities.Payment.create({
          tenant_id: tenant.id,
          tenant_name: tenant.full_name,
          unit_number: tenant.unit_number,
          month: m,
          year: y,
          amount: rentPrice,
          status: paid ? 'Pagado' : 'Pendiente',
          payment_date: paid ? paymentDate : null,
          months_covered: numMonths,
          notes: numMonths > 1 ? `Pago adelantado — cubre ${numMonths} meses` : '',
        }));
      }
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setPayingTenant(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveMutation.mutate({
      unitNumber: Number(fd.get('unit_number')),
      rentPrice: Number(fd.get('rent_price')),
      tenantData: {
        full_name: fd.get('full_name'),
        family_name: fd.get('family_name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        contract_start: fd.get('contract_start'),
        status: 'activo',
      },
    });
  };

  const openPayDialog = (tenant) => {
    setPayingTenant(tenant);
    setPayDate(format(now, 'yyyy-MM-dd'));
    setPayMonths('1');
    setAlreadyPaid(false);
    setPayDueDay(tenant.due_day?.toString() || '');
  };

  const numMonths = parseInt(payMonths) || 1;
  const nextDuePreview = payingTenant && payDueDay
    ? (() => {
        const base = new Date(payDate + 'T12:00:00');
        const next = addMonths(base, numMonths);
        next.setDate(parseInt(payDueDay));
        return format(next, 'dd/MM/yyyy');
      })()
    : payingTenant
    ? format(addMonths(new Date(payDate + 'T12:00:00'), numMonths), 'dd/MM/yyyy')
    : '';

  return (
    <div>
      <PageHeader
        title="Inquilinos"
        actions={
          <Button onClick={() => { setEditTenant(null); setShowDialog(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Nuevo Inquilino
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.filter(t => t.status === 'activo').sort((a, b) => (a.unit_number || 0) - (b.unit_number || 0)).map(tenant => {
          const payment = payments.find(p => p.tenant_id === tenant.id);
          const isPaid = payment?.status === 'Pagado';
          const unit = units.find(u => u.id === tenant.unit_id);
          const nextDue = tenant.next_due_date
            ? format(new Date(tenant.next_due_date + 'T12:00:00'), 'dd/MM/yyyy')
            : null;
          const isOverdue = tenant.next_due_date && new Date(tenant.next_due_date + 'T12:00:00') < now;

          return (
            <Card key={tenant.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">Casa {tenant.unit_number}</p>
                  <p className="text-sm text-muted-foreground">{tenant.full_name}</p>
                </div>
                <StatusBadge status={isOverdue ? 'Atrasado' : isPaid ? 'Pagado' : 'Pendiente'} />
              </div>

              <div className="space-y-1 mb-3">
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />{tenant.phone}
                  </div>
                )}
                {tenant.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />{tenant.email}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm font-medium mt-1">
                  <span className="text-muted-foreground">Alquiler:</span>
                  ${unit?.rent_price?.toLocaleString('es-AR') || '—'}
                </div>
                {nextDue && (
                  <div className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {isOverdue ? '⚠️ Venció:' : '📅 Próximo pago:'} {nextDue}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', padding: '7px 12px', borderRadius: '8px', fontWeight: '500', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  onClick={() => openPayDialog(tenant)}
                >
                  <CheckCircle style={{ width: '14px', height: '14px' }} />
                  Registrar pago
                </button>
                <Button variant="ghost" size="icon" onClick={() => { setEditTenant(tenant); setShowDialog(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => { if(confirm('¿Borrar este inquilino?')) deleteTenantMutation.mutate(tenant.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dialog registrar pago */}
      <Dialog open={!!payingTenant} onOpenChange={() => setPayingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago — {payingTenant?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Día del mes en que debe pagar</Label>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="Ej: 10"
                value={payDueDay}
                onChange={e => setPayDueDay(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" onClick={() => setAlreadyPaid(!alreadyPaid)}>
              <input
                type="checkbox"
                id="already-paid"
                checked={alreadyPaid}
                onChange={e => setAlreadyPaid(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
              <label htmlFor="already-paid" className="text-sm font-medium cursor-pointer">
                Ya realizó el pago
              </label>
            </div>
            {alreadyPaid && (
              <div>
                <Label>Fecha en que pagó</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>¿Cuántos meses cubre este pago?</Label>
              <Select value={payMonths} onValueChange={setPayMonths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mes (pago normal)</SelectItem>
                  <SelectItem value="2">2 meses</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses (1 año)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Próximo vencimiento calculado:</p>
              <p className="font-semibold text-base mt-1">{nextDuePreview}</p>
              {numMonths > 1 && (
                <p className="text-muted-foreground mt-1">
                  Se registrarán {numMonths} pagos — uno por cada mes cubierto
                </p>
              )}
            </div>
            <button
              style={{ backgroundColor: '#16a34a', color: 'white', width: '100%', padding: '10px', borderRadius: '8px', fontWeight: '500', fontSize: '14px' }}
              onClick={() => markPaidMutation.mutate({
                tenant: payingTenant,
                paymentDate: payDate,
                monthsCovered: payMonths,
                paid: alreadyPaid,
                dueDay: payDueDay,
              })}
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog editar/crear inquilino */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTenant ? 'Editar Inquilino' : 'Nuevo Inquilino'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Casa N°</Label>
                <Select name="unit_number" defaultValue={editTenant?.unit_number?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Casa" /></SelectTrigger>
                  <SelectContent>
                    {HOUSE_NUMBERS.map(n => (
                      <SelectItem key={n} value={n.toString()}>Casa {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alquiler ($)</Label>
                <Input name="rent_price" type="number" defaultValue={editTenant?.rent_price} required />
              </div>
            </div>
            <div>
              <Label>Nombre completo</Label>
              <Input name="full_name" defaultValue={editTenant?.full_name} required />
            </div>
            <div>
              <Label>Nombre de familia</Label>
              <Input name="family_name" defaultValue={editTenant?.family_name} />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={editTenant?.email} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input name="phone" defaultValue={editTenant?.phone} />
            </div>
            <div>
              <Label>Inicio de contrato</Label>
              <Input name="contract_start" type="date" defaultValue={editTenant?.contract_start} />
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}