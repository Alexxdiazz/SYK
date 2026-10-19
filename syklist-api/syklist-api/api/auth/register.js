import { ruta, anonDb } from '../../lib/api.js';

// POST /api/auth/register   body: { email, password, nombre }
// Crea el usuario en Supabase Auth, su fila en "perfiles" e inicia sesión.
export default ruta(
  {
    POST: async (req, res, { db }) => {
      const { email, password, nombre } = req.body || {};
      if (!email || !password || !nombre) {
        return res.status(400).json({ error: 'Faltan email, password o nombre' });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // email_confirm: true = la cuenta queda lista sin tener que confirmar por correo.
      const { data: creado, error } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre },
      });
      if (error) {
        const yaExiste = /already|registered|exists/i.test(error.message);
        return res.status(yaExiste ? 409 : 400).json({
          error: yaExiste ? 'Ya existe una cuenta con ese email' : error.message,
        });
      }

      // Si hay un trigger en Supabase que ya creó el perfil, esto solo actualiza el nombre.
      const { data: perfil, error: errPerfil } = await db
        .from('perfiles')
        .upsert({ id: creado.user.id, nombre: String(nombre).trim() }, { onConflict: 'id' })
        .select('id, nombre, plan')
        .single();
      if (errPerfil) return res.status(500).json({ error: errPerfil.message });

      const { data: sesion, error: errSesion } = await anonDb().auth.signInWithPassword({ email, password });
      if (errSesion || !sesion?.session) {
        return res.status(500).json({ error: 'La cuenta se creó pero no se pudo iniciar sesión' });
      }

      return res.status(201).json({ token: sesion.session.access_token, perfil });
    },
  },
  { publica: true },
);
