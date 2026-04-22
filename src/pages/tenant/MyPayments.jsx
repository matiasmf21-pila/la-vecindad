import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';

const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function MyPayments() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['my-all-payments', user?.tenant_id],
    queryFn: () => base44.entities.Payment.filter({ tenant_id: user.tenant_id }, '-year', 100),
    enabled: !!user?.tenant_id,
  });

  if (!user?.tenant_id) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold">Sin datos disponibles</p>
        <p className="text-sm text-muted-foreground mt-1">Tu cuenta aún no está vinculada.</p>
      </div>
    );
  }

  const statusIcons = {
    Pagado: <CheckCircle className="w-5 h-5 text-green-600" />,
    Pendiente: <Clock className="w-5 h-5 text-yellow-600" />,
    Atrasado: <AlertTriangle className="w-5 h-5 text-red-600" />,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mis Pagos</h1>
      <p className="text-sm text-muted-foreground">{payments.length} registros</p>

      <div className="space-y-3">
        {payments.sort((a, b) => b.year - a.year || b.month - a.month).map(payment => (
          <Card key={payment.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcons[payment.status]}
                <div>
                  <p className="font-semibold text-sm">{months[payment.month - 1]} {payment.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.payment_date ? `Pagado: ${format(new Date(payment.payment_date), 'dd/MM/yyyy')}` : 'Sin fecha de pago'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">${payment.amount?.toLocaleString('es-AR')}</p>
                <StatusBadge status={payment.status} />
              </div>
            </div>
            {payment.notes && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{payment.notes}</p>
            )}
          </Card>
        ))}
        {payments.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No hay pagos registrados</Card>
        )}
      </div>
    </div>
  );
}