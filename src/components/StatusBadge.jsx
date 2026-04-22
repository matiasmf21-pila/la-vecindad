import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  Pagado: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500/30', dot: 'bg-green-500' },
  Pendiente: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500/30', dot: 'bg-yellow-500' },
  Atrasado: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500/30', dot: 'bg-red-500' },
  activo: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500/30', dot: 'bg-green-500' },
  inactivo: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500/30', dot: 'bg-red-500' },
  ocupada: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500/30', dot: 'bg-yellow-500' },
  disponible: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500/30', dot: 'bg-green-500' },
  vigente: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500/30', dot: 'bg-green-500' },
  vencido: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500/30', dot: 'bg-red-500' },
  rescindido: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500/30', dot: 'bg-red-500' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', dot: 'bg-muted-foreground' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}