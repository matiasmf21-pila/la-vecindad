import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const contracts = await base44.asServiceRole.entities.Contract.filter({ status: 'vigente' });
    const now = new Date();
    let notified = 0;

    for (const contract of contracts) {
      if (!contract.end_date) continue;
      const endDate = new Date(contract.end_date);
      const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilEnd <= 30 && daysUntilEnd > 0) {
        // Notify admin (create notification without tenant_id to be visible in admin panel)
        await base44.asServiceRole.entities.Notification.create({
          tenant_id: '',
          tenant_name: 'Admin',
          message: `El contrato de ${contract.tenant_name} (Casa ${contract.unit_number}) vence en ${daysUntilEnd} días (${contract.end_date}). Revisar renovación.`,
          type: 'aviso_general',
          send_date: new Date().toISOString(),
          is_read: false,
          for_all: false,
        });
        notified++;
      }
    }

    return Response.json({ success: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});