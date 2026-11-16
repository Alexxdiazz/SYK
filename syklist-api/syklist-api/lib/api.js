import { ruta, anonDb } from '../../lib/api.js';

export default ruta(
  {
    POST: async (req, res, { db }) => {
      const { email, password, nombre, acepto_terminos, version_terminos } = req.body || {};
      if (!email || !password || !nombre) {
        return res.status(400).json({ error: 'Faltan email, password o nombre' });
      }
      if (acepto_terminos !== true) {
        return res.status(400).json({
          error: 'Para crear la cuenta tenés que aceptar los Términos de uso y la Política de Privacidad.',
        });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      const { data: creado, error } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          terminos_version: String(version_terminos || '').slice(0, 20),
          terminos_aceptados_en: new Date().toISOString(),
        },
      });
      if (error) {
        const yaExiste = /already|registered|exists/i.test(error.message);
        return res.status(yaExiste ? 409 : 400).json({
          error: yaExiste ? 'Ya existe una cuenta con ese email' : error.message,
        });
      }

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
