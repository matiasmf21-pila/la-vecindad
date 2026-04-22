import React from 'react';
import { Card } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function UnitCard({ unit, payment, tenant }) {
  const statusColors = {
    Pagado: { bg: 'bg-green-500', ring: 'ring-green-500/20', text: 'text-green-600' },
    Pendiente: { bg: 'bg-yellow-500', ring: 'ring-yellow-500/20', text: 'text-yellow-600' },
    Atrasado: { bg: 'bg-red-500', ring: 'ring-red-500/20', text: 'text-red-600' },
    none: { bg: 'bg-muted-foreground/30', ring: 'ring-muted/20', text: 'text-muted-foreground' },
  };

  const paymentStatus = payment?.status || 'none';
  const colors = statusColors[paymentStatus];
  const label = unit.status === 'disponible' ? 'Disponible' : paymentStatus === 'none' ? 'Sin pago' : paymentStatus;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg}/10 ring-2 ${colors.ring} flex items-center justify-center`}>
            <Home className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div>
            <p className="font-semibold text-sm">Casa {unit.number}</p>
            <p className="text-xs text-muted-foreground">
              {tenant ? `Fam. ${tenant.family_name}` : 'Sin inquilino'}
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg}/10 ${colors.text}`}>
          {label}
        </span>
      </div>
      {payment && (
        <p className="text-sm font-semibold mt-3 text-right">
          ${payment.amount?.toLocaleString('es-AR')}
        </p>
      )}
    </Card>
  );
}