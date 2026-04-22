import React, { useState } from 'react';
import { entities } from '@/api/firebase-entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, UserX, Phone, Mail } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const HOUSE_NUMBERS = Array.from({ length: 11 }, (_, i) => i + 1);

export default function PendingTenants() {
  const [approvingTenant, setApprovingTenant] = useState(null);
  const [unitNumber, setUnitNumber] = useState('');
  const [rentPrice, setRentPrice] = useState('');
  const queryClient = useQueryClient();

  const { data: pending = [] } = useQuery({
    queryKey: ['pending-tenants'],
    queryFn: () => entities.Tenant.filter({ status: 'pendiente' }, '-created_date', 50),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => entities.Unit.list('number', 50),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ tenant, unitNum, rent }) => {
      let existingUnit = units.find(u => u.number === parseInt(unitNum));
      let unitId;
      if (existingUnit) {
        await entities.Unit.update(existingUnit.id, { rent_price: Number(rent), status: 'ocupada' });
        unitId = existingUnit.id;
      } else {
        const newUnit = await entities.Unit.create({ number: parseInt(unitNum), rent_price: Number(rent), status: 'ocupada' });
        unitId = newUnit.id;
      }
      await entities.Tenant.update(tenant.id, {
        status: 'activo',
        unit_id: unitId,
        unit_number: parseInt(unitNum),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setApprovingTenant(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => entities.Tenant.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-tenants'] }),
  });

  return (
    <div>
      <PageHeader
        title="Solicitudes pendientes"
        subtitle={`${pending.length} inquilino(s) esperando aprobación`}
      />

      {pending.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay solicitudes pendientes
        </Card>
      ) : (
        <div className="grid gap-4">
          {pending.map(tenant => (
            <Card key={tenant.id} className="p-4 ring-2 ring-yellow-500/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{tenant.full_name}</p>
                  <p className="text-sm text-muted-foreground">Fam. {tenant.family_name}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                  Pendiente
                </span>
              </div>
              <div className="space-y-1 mb-4">
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
              </div>
              <div className="flex gap-2">
                <button
                  style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', padding: '8px', borderRadius: '8px', fontWeight: '500', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  onClick={() => { setApprovingTenant(tenant); setUnitNumber(''); setRentPrice(''); }}
                >
                  <UserCheck style={{ width: '14px', height: '14px' }} />
                  Aprobar
                </button>
                <button
                  style={{ flex: 1, backgroundColor: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: '8px', fontWeight: '500', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  onClick={() => { if (confirm('¿Rechazar y eliminar esta solicitud?')) rejectMutation.mutate(tenant.id); }}
                >
                  <UserX style={{ width: '14px', height: '14px' }} />
                  Rechazar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!approvingTenant} onOpenChange={() => setApprovingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar — {approvingTenant?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asignar casa</Label>
              <Select value={unitNumber} onValueChange={setUnitNumber}>
                <SelectTrigger><SelectValue placeholder="Elegir casa" /></SelectTrigger>
                <SelectContent>
                  {HOUSE_NUMBERS.map(n => (
                    <SelectItem key={n} value={n.toString()}>Casa {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Precio de alquiler ($)</Label>
              <Input
                type="number"
                value={rentPrice}
                onChange={e => setRentPrice(e.target.value)}
                placeholder="Ej: 200000"
              />
            </div>
            <button
              style={{ backgroundColor: '#16a34a', color: 'white', width: '100%', padding: '10px', borderRadius: '8px', fontWeight: '500' }}
              onClick={() => approveMutation.mutate({ tenant: approvingTenant, unitNum: unitNumber, rent: rentPrice })}
              disabled={!unitNumber || !rentPrice || approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Guardando...' : 'Confirmar aprobación'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}