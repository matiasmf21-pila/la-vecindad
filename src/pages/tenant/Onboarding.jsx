import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

export default function Onboarding({ user, onComplete }) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      // Create tenant record (without unit — admin assigns it later)
      const tenant = await base44.entities.Tenant.create({
        full_name: formData.full_name,
        family_name: formData.family_name,
        email: user.email,
        phone: formData.phone,
        status: 'activo',
      });

      // Link tenant to user profile
      await base44.auth.updateMe({ tenant_id: tenant.id });

      return tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      onComplete();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveMutation.mutate({
      full_name: fd.get('full_name'),
      family_name: fd.get('family_name'),
      phone: fd.get('phone'),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">¡Bienvenido!</h1>
          <p className="text-muted-foreground text-sm mt-1">Completá tus datos para que el administrador pueda asignarte tu casa</p>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre y apellido</Label>
              <Input name="full_name" defaultValue={user?.full_name} required placeholder="Juan García" />
            </div>

            <div>
              <Label>Nombre de familia</Label>
              <Input name="family_name" required placeholder="García" />
            </div>

            <div>
              <Label>Teléfono</Label>
              <Input name="phone" type="tel" placeholder="11 1234-5678" />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Guardando...' : 'Confirmar'}
            </Button>
          </form>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          El administrador te asignará tu casa en breve.
        </p>
      </div>
    </div>
  );
}