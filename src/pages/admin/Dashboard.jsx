import React from 'react';
import { entities } from '@/api/firebase-entities';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Clock, AlertTriangle, Home } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import UnitCard from '@/components/dashboard/UnitCard';

export default function Dashboard() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => entities.Unit.list('number', 50),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => entities.Tenant.list('-created_date', 50),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', currentMonth, currentYear],
    queryFn: () => entities.Payment.filter({ month: currentMonth, year: currentYear }, '-created_date', 50),
  });

  const totalCollected = payments.filter(p => p.status === 'Pagado').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status !== 'Pagado').reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdueCount = payments.filter(p => p.status === 'Atrasado').length;
  const occupiedCount = units.filter(u => u.status === 'ocupada').length;

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle={`${months[currentMonth - 1]} ${currentYear}`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard title="Cobrado" value={`$${totalCollected.toLocaleString('es-AR')}`} icon={DollarSign} color="success" />
        <StatCard title="Pendiente" value={`$${totalPending.toLocaleString('es-AR')}`} icon={Clock} color="warning" />
        <StatCard title="Morosos" value={overdueCount} icon={AlertTriangle} color="danger" />
        <StatCard title="Ocupadas" value={`${occupiedCount}/11`} icon={Home} color="primary" />
      </div>
      <h2 className="font-semibold text-lg mb-3">Estado de Unidades</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {units.sort((a, b) => a.number - b.number).map(unit => {
          const tenant = tenants.find(t => t.unit_id === unit.id && t.status === 'activo');
          const payment = payments.find(p => p.tenant_id === tenant?.id);
          return (
            <UnitCard key={unit.id} unit={unit} payment={payment} tenant={tenant} />
          );
        })}
      </div>
    </div>
  );
}