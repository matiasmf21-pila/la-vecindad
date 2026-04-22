import React from 'react';
import { entities } from '@/api/firebase-entities';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, AlertTriangle, Home } from 'lucide-react';

const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function MyStatus() {
  const { user } = useAuth();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenant-by-email', user?.email],
    queryFn: () => entities.Tenant.filter({ email: user.email }),
    enabled: !!user?.email,
  });
  const tenant = tenants[0];

  const { data: units = [] } = useQuery({
    queryKey: ['unit', tenant?.unit_id],
    queryFn: () => entities.Unit.filter({ }),
    enabled: !!tenant?.unit_id,
  });
  const unit = units.find(u => u.id === tenant?.unit_id);

  const { data: payments = [] } = useQuery({
    queryKey: ['my-payments', tenant?.id, currentMonth, currentYear],
    queryFn: () => entities.Payment.filter({ tenant_id: tenant.id, month: currentMonth, year: currentYear }),
    enabled: !!tenant?.id,
  });
  const currentPayment = payments[0];

  if (!tenant || tenant.status === 'pendiente') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
          <Home className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">¡Ya casi estás!</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Tu cuenta fue creada. Estamos esperando que el administrador te asigne tu casa.
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
      <Card className={`p-6 ${config.bg} border-none`}>
        <div className="text-center">
          <Icon className={`w-12 h-12 ${config.text} mx-auto mb-3`} />
          <h2 className={`text-lg font-bold ${config.text}`}>{config.label}</h2>
          <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
        </div>
      </Card>
      <Card className="p-5">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{months[currentMonth - 1]} {currentYear}</p>
          <p className="text-3xl font-bold mt-1">${(currentPayment?.amount || unit?.rent_price || 0).toLocaleString('es-AR')}</p>
          <p className="text-xs text-muted-foreground mt-1">Alquiler mensual</p>
        </div>
      </Card>
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