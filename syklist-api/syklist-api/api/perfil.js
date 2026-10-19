import { ruta, asegurarPerfil } from '../lib/api.js';

// GET /api/perfil  →  { id, nombre, plan }
export default ruta({
  GET: async (req, res, { db, usuario }) => {
    const perfil = await asegurarPerfil(db, usuario);
    return res.status(200).json(perfil);
  },
});
