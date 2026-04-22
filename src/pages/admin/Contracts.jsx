import React, { useState } from 'react';
import { entities } from '@/api/firebase-entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Download, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function Contracts() {
  const [showNew, setShowNew] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [status, setStatus] = useState('vigente');
  const queryClient = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => entities.Contract.list('-created_date', 100),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-active'],
    queryFn: () => entities.Tenant.filter({ status: 'activo' }, '-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Contract.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); setShowNew(false); },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tenant = tenants.find(t => t.id === tenantId);
    createMutation.mutate({
      tenant_id: tenantId,
      tenant_name: tenant?.full_name,
      unit_number: tenant?.unit_number,
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date'),
      monthly_amount: Number(fd.get('monthly_amount')),
      status,
    });
  };

  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Contratos"
        subtitle="Gestión de contratos de alquiler"
        actions={<Button onClick={() => setShowNew(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo Contrato</Button>}
      />
      <div className="grid gap-3">
        {contracts.map(contract => {
          const daysUntilEnd = contract.end_date ? differenceInDays(parseISO(contract.end_date), today) : null;
          const isExpiringSoon = daysUntilEnd !== null && daysUntilEnd <= 30 && daysUntilEnd > 0 && contract.status === 'vigente';
          return (
            <Card key={contract.id} className={`p-4 ${isExpiringSoon ? 'ring-2 ring-yellow-500/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{contract.tenant_name}</p>
                    <p className="text-xs text-muted-foreground">Casa {contract.unit_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {contract.start_date && format(parseISO(contract.start_date), 'dd/MM/yyyy')} — {contract.end_date && format(parseISO(contract.end_date), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs font-medium mt-0.5">${contract.monthly_amount?.toLocaleString('es-AR')} /mes</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={contract.status} />
                  {isExpiringSoon && <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium"><AlertTriangle className="w-3 h-3" /> Vence en {daysUntilEnd} días</span>}
                </div>
              </div>
            </Card>
          );
        })}
        {contracts.length === 0 && <Card className="p-8 text-center text-muted-foreground">No hay contratos registrados</Card>}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Contrato</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Inquilino</Label>
              <Select value={tenantId} onValueChange={setTenantId} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {tenants.map(t => <SelectItem key={t.id} value={t.id}>Casa {t.unit_number} — {t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha inicio</Label><Input name="start_date" type="date" required /></div>
              <div><Label>Fecha fin</Label><Input name="end_date" type="date" required /></div>
            </div>
            <div><Label>Monto mensual ($)</Label><Input name="monthly_amount" type="number" required /></div>
            <div>
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vigente">Vigente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="rescindido">Rescindido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}