import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, AlertTriangle, Home } from 'lucide-react';

export default function MyStatus() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tenant } = useQuery({
    queryKey: ['my-tenant', user?.tenant_id],
    queryFn: () => base44.entities.Tenant.filter({ id: user.tenant_id }),
    enabled: !!user?.tenant_id,
    select: (data) => data[0],
  });

  const { data: unit } = useQuery({
    queryKey: ['my-unit', tenant?.unit_id],
    queryFn: () => base44.entities.Unit.filter({ id: tenant.unit_id }),
    enabled: !!tenant?.unit_id,
    select: (data) => data[0],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['my-payments', user?.tenant_id, currentMonth, currentYear],
    queryFn: () => base44.entities.Payment.filter({ tenant_id: user.tenant_id, month: currentMonth, year: currentYear }),
    enabled: !!user?.tenant_id,
  });

  const currentPayment = payments[0];

  if (!tenant?.unit_id) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
          <Home className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">¡Ya casi estás!</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Tus datos fueron recibidos. Estamos esperando que el administrador confirme y te asigne tu casa.
          </p>
        </div>
        <div className="bg-muted rounded-xl px-5 py-3 text-xs text-muted-foreground">
          Te avisaremos cuando todo esté listo 🏠
        </div>
      </div>
    );
  }

  const statusConfig = {
    Pagado: { icon: CheckCircle, bg: 'bg-green-500/10', text: 'text-green-600', label: '¡Estás al día!', desc: 'Tu pago del mes fue registrado.' },
    Pendiente: { icon: Clock, bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Pago pendiente', desc: 'Aún no se registró tu pago de este mes.' },
    Atrasado: { icon: AlertTriangle, bg: 'bg-red-500/10', text: 'text-red-600', label: 'Pago atrasado', desc: 'Tu pago tiene atraso. Regularizá tu situación.' },
  };

  const status = currentPayment?.status || 'Pendiente';
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="text-center pt-2 pb-4">
        <p className="text-sm text-muted-foreground">Casa {tenant?.unit_number || '—'}</p>
        <h1 className="text-xl font-bold">Fam. {tenant?.family_name}</h1>
      </div>

      {/* Main status card */}
      <Card className={`p-6 ${config.bg} border-none`}>
        <div className="text-center">
          <Icon className={`w-12 h-12 ${config.text} mx-auto mb-3`} />
          <h2 className={`text-lg font-bold ${config.text}`}>{config.label}</h2>
          <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
        </div>
      </Card>

      {/* Month and amount */}
      <Card className="p-5">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{months[currentMonth - 1]} {currentYear}</p>
          <p className="text-3xl font-bold mt-1">
            ${(currentPayment?.amount || unit?.rent_price || 0).toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Alquiler mensual</p>
        </div>
      </Card>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Unidad</p>
          <p className="text-lg font-bold">Casa {tenant?.unit_number}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Estado</p>
          <p className={`text-lg font-bold ${config.text}`}>{status}</p>
        </Card>
      </div>
    </div>
  );
}