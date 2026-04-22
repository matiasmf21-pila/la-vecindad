import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get overdue payments
    const overduePayments = await base44.asServiceRole.entities.Payment.filter({ 
      month, year, status: 'Atrasado' 
    });

    let sent = 0;
    for (const payment of overduePayments) {
      await base44.asServiceRole.entities.Notification.create({
        tenant_id: payment.tenant_id,
        tenant_name: payment.tenant_name,
        message: `SEGUNDO AVISO: Tu pago de alquiler sigue atrasado. Monto adeudado: $${payment.amount?.toLocaleString('es-AR')}. Es necesario que regularices tu situación a la brevedad.`,
        type: 'alerta_deuda',
        send_date: new Date().toISOString(),
        is_read: false,
        for_all: false,
      });
      sent++;
    }

    return Response.json({ success: true, sent, month, year });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});