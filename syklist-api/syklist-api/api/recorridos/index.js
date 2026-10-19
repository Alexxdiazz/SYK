import { ruta } from '../../lib/api.js';

export default ruta({
  // GET /api/recorridos?limite=4  →  lista de recorridos finalizados, el más nuevo primero
  GET: async (req, res, { db, usuario }) => {
    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 20, 1), 100);

    const { data, error } = await db
      .from('recorridos')
      .select('id, titulo, estado, iniciado_en, finalizado_en, distancia_m, duracion_s')
      .eq('usuario_id', usuario.id)
      .eq('estado', 'finalizado')
      .order('iniciado_en', { ascending: false })
      .limit(limite);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json(data);
  },

  // POST /api/recorridos   body: { titulo }  →  crea un recorrido "en_curso" y devuelve su id
  POST: async (req, res, { db, usuario }) => {
    const titulo = String(req.body?.titulo || '').trim().slice(0, 100) || 'Recorrido';

    const { data, error } = await db
      .from('recorridos')
      .insert({
        usuario_id: usuario.id,
        titulo,
        estado: 'en_curso',
        iniciado_en: new Date().toISOString(),
      })
      .select('id, titulo, estado, iniciado_en')
      .single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  },
});
