import { ruta } from '../../lib/api.js';

// PATCH /api/recorridos/<id>   body: { distancia_m, duracion_s }
// Cierra el recorrido: lo marca "finalizado" y guarda distancia y duración.
export default ruta({
  PATCH: async (req, res, { db, usuario }) => {
    const { id } = req.query;
    const distancia = Number(req.body?.distancia_m);
    const duracion = Math.round(Number(req.body?.duracion_s));

    if (!Number.isFinite(distancia) || distancia < 0 || !Number.isFinite(duracion) || duracion < 0) {
      return res.status(400).json({ error: 'distancia_m y duracion_s deben ser números positivos' });
    }

    const { data, error } = await db
      .from('recorridos')
      .update({
        estado: 'finalizado',
        finalizado_en: new Date().toISOString(),
        distancia_m: Math.round(distancia * 100) / 100,
        duracion_s: duracion,
      })
      .eq('id', id)
      .eq('usuario_id', usuario.id) // solo puede cerrar SUS recorridos
      .select('id, titulo, estado, iniciado_en, finalizado_en, distancia_m, duracion_s')
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Recorrido no encontrado' });

    return res.status(200).json(data);
  },
});
