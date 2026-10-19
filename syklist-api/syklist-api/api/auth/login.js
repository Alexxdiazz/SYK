import { ruta, anonDb, asegurarPerfil } from '../../lib/api.js';

// POST /api/auth/login   body: { email, password }
// Devuelve un token que Flutter manda en cada pedido: Authorization: Bearer <token>
export default ruta(
  {
    POST: async (req, res, { db }) => {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Faltan email o password' });

      const { data, error } = await anonDb().auth.signInWithPassword({ email, password });
      if (error || !data?.session) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }

      const perfil = await asegurarPerfil(db, data.user);
      return res.status(200).json({ token: data.session.access_token, perfil });
    },
  },
  { publica: true },
);
