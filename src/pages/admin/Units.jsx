import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Pencil, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

export default function Units() {
  const [editUnit, setEditUnit] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list('number', 50),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.filter({ status: 'activo' }, '-created_date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editUnit?.id ? base44.entities.Unit.update(editUnit.id, data) : base44.entities.Unit.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units'] }); setShowDialog(false); setEditUnit(null); },
  });

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveMutation.mutate({
      number: Number(fd.get('number')),
      description: fd.get('description'),
      rent_price: Number(fd.get('rent_price')),
      status: fd.get('status'),
    });
  };

  return (
    <div>
      <PageHeader 
        title="Gestión de Unidades" 
        subtitle="11 casas del complejo"
        actions={
          <Button onClick={() => { setEditUnit({}); setShowDialog(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Agregar
          </Button>
        }
      />

      <div className="grid gap-3">
        {units.sort((a, b) => a.number - b.number).map(unit => {
          const tenant = tenants.find(t => t.unit_id === unit.id);
          return (
            <Card key={unit.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Casa {unit.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {tenant ? `Fam. ${tenant.family_name} — ${tenant.full_name}` : 'Sin inquilino'}
                  </p>
                  <p className="text-xs text-muted-foreground">${unit.rent_price?.toLocaleString('es-AR')} /mes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={unit.status} />
                <Button variant="ghost" size="icon" onClick={() => { setEditUnit(unit); setShowDialog(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUnit?.id ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Número de casa</Label>
              <Input name="number" type="number" min="1" max="11" defaultValue={editUnit?.number} required />
            </div>
            <div>
              <Label>Precio de alquiler ($)</Label>
              <Input name="rent_price" type="number" defaultValue={editUnit?.rent_price} required />
            </div>
            <div>
              <Label>Estado</Label>
              <Select name="status" defaultValue={editUnit?.status || 'disponible'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="ocupada">Ocupada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea name="description" defaultValue={editUnit?.description} />
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}