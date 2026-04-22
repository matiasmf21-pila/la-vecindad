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

    // Get pending payments for current month
    const pendingPayments = await base44.asServiceRole.entities.Payment.filter({ 
      month, year, status: 'Pendiente' 
    });

    let updated = 0;
    for (const payment of pendingPayments) {
      // Mark as overdue
      await base44.asServiceRole.entities.Payment.update(payment.id, { status: 'Atrasado' });
      
      // Send notification
      await base44.asServiceRole.entities.Notification.create({
        tenant_id: payment.tenant_id,
        tenant_name: payment.tenant_name,
        message: `Tu pago de alquiler del mes actual se encuentra atrasado. Monto: $${payment.amount?.toLocaleString('es-AR')}. Por favor regularizá tu situación.`,
        type: 'alerta_deuda',
        send_date: new Date().toISOString(),
        is_read: false,
        for_all: false,
      });
      updated++;
    }

    return Response.json({ success: true, updated, month, year });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});