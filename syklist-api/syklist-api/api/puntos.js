import { ruta } from '../lib/api.js';

// POST /api/puntos   body: { recorrido_id, puntos: [{ lat, lng, registrado_en }] }
// Guarda los puntos de GPS de un recorrido (lo que dibuja la ruta en el mapa).
export default ruta({
  POST: async (req, res, { db, usuario }) => {
    const { recorrido_id, puntos } = req.body || {};
    if (!recorrido_id || !Array.isArray(puntos) || puntos.length === 0) {
      return res.status(400).json({ error: 'Faltan recorrido_id o puntos' });
    }
    if (puntos.length > 20000) {
      return res.status(400).json({ error: 'Demasiados puntos en un solo envío (máximo 20000)' });
    }

    // El recorrido tiene que ser del usuario que hace el pedido.
    const { data: recorrido, error: errRec } = await db
      .from('recorridos')
      .select('id')
      .eq('id', recorrido_id)
      .eq('usuario_id', usuario.id)
      .maybeSingle();
    if (errRec) return res.status(500).json({ error: errRec.message });
    if (!recorrido) return res.status(404).json({ error: 'Recorrido no encontrado' });

    const filas = [];
    for (const p of puntos) {
      const lat = Number(p?.lat);
      const lng = Number(p?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;

      const momento = new Date(p.registrado_en);
      filas.push({
        recorrido_id,
        lat,
        lng,
        registrado_en: Number.isNaN(momento.getTime()) ? new Date().toISOString() : momento.toISOString(),
      });
    }
    if (filas.length === 0) return res.status(400).json({ error: 'Ningún punto válido' });

    for (let i = 0; i < filas.length; i += 1000) {
      const { error } = await db.from('puntos_ruta').insert(filas.slice(i, i + 1000));
      if (error) return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ insertados: filas.length });
  },
});
