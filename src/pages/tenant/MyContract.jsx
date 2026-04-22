import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { format, parseISO, differenceInDays } from 'date-fns';

export default function MyContract() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['my-contracts', user?.tenant_id],
    queryFn: () => base44.entities.Contract.filter({ tenant_id: user.tenant_id }, '-created_date', 10),
    enabled: !!user?.tenant_id,
  });

  const contract = contracts.find(c => c.status === 'vigente') || contracts[0];

  if (!user?.tenant_id) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold">Sin datos disponibles</p>
        <p className="text-sm text-muted-foreground mt-1">Tu cuenta aún no está vinculada.</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Mi Contrato</h1>
        <Card className="p-8 text-center text-muted-foreground">
          No hay contrato registrado
        </Card>
      </div>
    );
  }

  const today = new Date();
  const daysUntilEnd = contract.end_date ? differenceInDays(parseISO(contract.end_date), today) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mi Contrato</h1>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Contrato de Alquiler</p>
            <StatusBadge status={contract.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Inicio</p>
            <p className="text-sm font-medium">
              {contract.start_date ? format(parseISO(contract.start_date), 'dd/MM/yyyy') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fin</p>
            <p className="text-sm font-medium">
              {contract.end_date ? format(parseISO(contract.end_date), 'dd/MM/yyyy') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monto mensual</p>
            <p className="text-sm font-bold">${contract.monthly_amount?.toLocaleString('es-AR')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Días restantes</p>
            <p className={`text-sm font-bold ${daysUntilEnd !== null && daysUntilEnd <= 30 ? 'text-yellow-600' : ''}`}>
              {daysUntilEnd !== null ? `${daysUntilEnd} días` : '—'}
            </p>
          </div>
        </div>
      </Card>

      {contract.file_url && (
        <a href={contract.file_url} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" /> Descargar Contrato PDF
          </Button>
        </a>
      )}
    </div>
  );
}