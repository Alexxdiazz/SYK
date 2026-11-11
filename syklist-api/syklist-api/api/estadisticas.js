import { ruta } from '../lib/api.js';
import { obtenerPlan } from '../lib/plan.js';
import { calcularEstadisticas } from '../lib/estadisticas.js';

// GET /api/estadisticas  →  SOLO plan premium (RF15).
// En el plan gratis responde 403 y la app muestra la pantalla de pago.
export default ruta({
  GET: async (req, res, { db, usuario }) => {
    const plan = await obtenerPlan(db, usuario.id);
    if (plan !== 'premium') {
      return res.status(403).json({
        error: 'Las estadísticas avanzadas son parte del plan Premium.',
        codigo: 'premium_requerido',
      });
    }

    const { data, error } = await db
      .from('recorridos')
      .select('titulo, iniciado_en, distancia_m, duracion_s')
      .eq('usuario_id', usuario.id)
      .eq('estado', 'finalizado')
      .order('iniciado_en', { ascending: false })
      .limit(2000);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json(calcularEstadisticas(data));
  },
});
