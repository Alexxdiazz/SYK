import { ruta } from '../lib/api.js';

// POST /api/alertas   body: { recorrido_id?, lat, lng }
// Registra una posible caída (RF08 / RF09). Listo para cuando se conecte el acelerómetro.
export default ruta({
  POST: async (req, res, { db, usuario }) => {
    const { recorrido_id = null, lat, lng } = req.body || {};
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat y lng deben ser números' });
    }

    if (recorrido_id) {
      const { data: recorrido, error: errRec } = await db
        .from('recorridos')
        .select('id')
        .eq('id', recorrido_id)
        .eq('usuario_id', usuario.id)
        .maybeSingle();
      if (errRec) return res.status(500).json({ error: errRec.message });
      if (!recorrido) return res.status(404).json({ error: 'Recorrido no encontrado' });
    }

    const { data, error } = await db
      .from('alertas_caida')
      .insert({
        usuario_id: usuario.id,
        recorrido_id,
        lat,
        lng,
        estado: 'pendiente',
        detectada_en: new Date().toISOString(),
      })
      .select('id, estado, detectada_en')
      .single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  },
});
