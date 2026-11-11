import { ruta, asegurarPerfil } from '../lib/api.js';

const PERIODOS = ['mensual', 'anual'];

// POST /api/suscripcion   body: { accion: 'activar', periodo: 'mensual' | 'anual' }
//                         o   { accion: 'cancelar' }
// Cambia el plan del usuario en la tabla perfiles (gratis <-> premium).
//
// OJO: el pago de esta entrega es SIMULADO. En una app real, el plan premium solo se
// activaría cuando el proveedor de pagos (Stripe, Mercado Pago...) confirme el cobro
// mediante un webhook, nunca porque la app lo pida.
export default ruta({
  POST: async (req, res, { db, usuario }) => {
    const { accion, periodo } = req.body || {};

    if (accion !== 'activar' && accion !== 'cancelar') {
      return res.status(400).json({ error: 'accion debe ser "activar" o "cancelar"' });
    }
    if (accion === 'activar' && !PERIODOS.includes(periodo)) {
      return res.status(400).json({ error: 'periodo debe ser "mensual" o "anual"' });
    }

    await asegurarPerfil(db, usuario); // por si el perfil todavía no existía

    const plan = accion === 'activar' ? 'premium' : 'gratis';
    const { data, error } = await db
      .from('perfiles')
      .update({ plan })
      .eq('id', usuario.id)
      .select('id, nombre, plan')
      .single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ...data, periodo: accion === 'activar' ? periodo : null });
  },
});
