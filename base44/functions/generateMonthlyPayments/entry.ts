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

    // Get all active tenants
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ status: 'activo' });
    
    // Get existing payments for this month
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({ month, year });
    const existingTenantIds = new Set(existingPayments.map(p => p.tenant_id));

    // Get all units for rent prices
    const units = await base44.asServiceRole.entities.Unit.list();
    const unitMap = {};
    units.forEach(u => { unitMap[u.id] = u; });

    let created = 0;
    for (const tenant of tenants) {
      if (existingTenantIds.has(tenant.id)) continue;
      
      const unit = unitMap[tenant.unit_id];
      const amount = unit?.rent_price || 0;

      await base44.asServiceRole.entities.Payment.create({
        tenant_id: tenant.id,
        tenant_name: tenant.full_name,
        unit_number: tenant.unit_number,
        month,
        year,
        amount,
        status: 'Pendiente',
      });
      created++;
    }

    return Response.json({ success: true, created, month, year });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});