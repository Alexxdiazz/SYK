import { createClient } from '@supabase/supabase-js';

const OPCIONES = { auth: { persistSession: false, autoRefreshToken: false } };

/** Cliente con permisos totales (service role). SOLO se usa dentro de la API, nunca en Flutter. */
export function adminDb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, OPCIONES);
}

/** Cliente con la clave pública: se usa solo para iniciar sesión con email y contraseña. */
export function anonDb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, OPCIONES);
}

/**
 * Envuelve una ruta de la API y se ocupa de lo repetitivo:
 *  - CORS (necesario para que Flutter Web pueda llamar a la API)
 *  - elegir la función según el método HTTP (GET, POST, PATCH...)
 *  - validar el token de sesión y saber QUIÉN es el usuario
 *  - capturar errores
 *
 * Uso:  export default ruta({ GET: async (req, res, { db, usuario }) => { ... } });
 * Con { publica: true } la ruta no exige sesión (login y registro).
 */
export function ruta(metodos, { publica = false } = {}) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // El navegador manda un OPTIONS de "consulta previa" antes de POST/PATCH.
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!Object.prototype.hasOwnProperty.call(metodos, req.method)) {
      return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({
        error: 'Faltan variables de entorno en Vercel (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)',
      });
    }

    try {
      const db = adminDb();
      let usuario = null;

      if (!publica) {
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        if (!token) return res.status(401).json({ error: 'Falta el token de sesión' });

        const { data, error } = await db.auth.getUser(token);
        if (error || !data?.user) return res.status(401).json({ error: 'Sesión inválida o vencida' });
        usuario = data.user;
      }

      return await metodos[req.method](req, res, { db, usuario });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e?.message || 'Error interno del servidor' });
    }
  };
}

/** Devuelve el perfil del usuario; si por algún motivo no existe todavía, lo crea. */
export async function asegurarPerfil(db, usuario) {
  const { data, error } = await db
    .from('perfiles')
    .select('id, nombre, plan')
    .eq('id', usuario.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const nombre = usuario.user_metadata?.nombre || usuario.email?.split('@')[0] || 'Ciclista';
  const { data: nuevo, error: errNuevo } = await db
    .from('perfiles')
    .insert({ id: usuario.id, nombre })
    .select('id, nombre, plan')
    .single();
  if (errNuevo) throw errNuevo;
  return nuevo;
}
