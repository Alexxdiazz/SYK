import { ruta, anonDb, asegurarPerfil } from '../../lib/api.js';

// POST /api/auth/login   body: { email, password }
// Devuelve un token que Flutter manda en cada pedido: Authorization: Bearer <token>
export default ruta(
  {
    POST: async (req, res, { db }) => {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email || !password) return res.status(400).json({ error: 'Faltan email o password' });

      const { data, error } = await anonDb().auth.signInWithPassword({ email, password });

      if (error || !data?.session) {
        const detalle = error?.message || '';
        console.error('Login rechazado por Supabase:', detalle); // se ve en Vercel > Logs

        if (/not confirmed/i.test(detalle)) {
          return res.status(401).json({ error: 'Ese email no está confirmado. Creá la cuenta de nuevo desde la app.' });
        }
        if (/api key|apikey|jwt/i.test(detalle)) {
          return res.status(500).json({ error: 'La clave SUPABASE_ANON_KEY cargada en Vercel es incorrecta.' });
        }
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }

      const perfil = await asegurarPerfil(db, data.user);
      return res.status(200).json({ token: data.session.access_token, perfil });
    },
  },
  { publica: true },
);
