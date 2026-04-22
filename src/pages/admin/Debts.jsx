import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Debts() {
  const { data: payments = [] } = useQuery({
    queryKey: ['all-overdue-payments'],
    queryFn: () => base44.entities.Payment.filter({ status: 'Atrasado' }, '-year', 200),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.filter({ status: 'activo' }, '-created_date', 50),
  });

  // Group debts by tenant
  const debtsByTenant = {};
  payments.forEach(p => {
    if (!debtsByTenant[p.tenant_id]) {
      debtsByTenant[p.tenant_id] = { payments: [], total: 0, tenant_name: p.tenant_name, unit_number: p.unit_number };
    }
    debtsByTenant[p.tenant_id].payments.push(p);
    debtsByTenant[p.tenant_id].total += p.amount || 0;
  });

  const debtList = Object.entries(debtsByTenant).sort((a, b) => b[1].total - a[1].total);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <div>
      <PageHeader 
        title="Control de Deudas"
        subtitle={`${debtList.length} inquilino(s) con pagos atrasados`}
      />

      {debtList.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-semibold">Sin deudas pendientes</p>
          <p className="text-sm text-muted-foreground mt-1">Todos los pagos están al día</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {debtList.map(([tenantId, data]) => (
            <Card key={tenantId} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{data.tenant_name}</p>
                    <p className="text-xs text-muted-foreground">Casa {data.unit_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">${data.total.toLocaleString('es-AR')}</p>
                  <p className="text-xs text-muted-foreground">{data.payments.length} mes(es)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.payments.sort((a, b) => b.year - a.year || b.month - a.month).map(p => (
                  <span key={p.id} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-500/20">
                    {months[p.month - 1]} {p.year} — ${p.amount?.toLocaleString('es-AR')}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}