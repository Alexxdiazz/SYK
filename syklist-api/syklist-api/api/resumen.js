import { ruta } from '../lib/api.js';

// Lunes 00:00 (UTC) de la semana actual.
function inicioDeSemana() {
  const ahora = new Date();
  const diasDesdeLunes = (ahora.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() - diasDesdeLunes));
}

// GET /api/resumen  →  { distancia_km, tiempo_min, recorridos }   (tarjeta "Esta semana")
export default ruta({
  GET: async (req, res, { db, usuario }) => {
    const { data, error } = await db
      .from('recorridos')
      .select('distancia_m, duracion_s')
      .eq('usuario_id', usuario.id)
      .eq('estado', 'finalizado')
      .gte('iniciado_en', inicioDeSemana().toISOString());
    if (error) return res.status(500).json({ error: error.message });

    const metros = data.reduce((suma, r) => suma + Number(r.distancia_m || 0), 0);
    const segundos = data.reduce((suma, r) => suma + Number(r.duracion_s || 0), 0);

    return res.status(200).json({
      distancia_km: Math.round(metros / 100) / 10,
      tiempo_min: Math.round(segundos / 60),
      recorridos: data.length,
    });
  },
});
