// GET /api/health  →  sirve para comprobar que el despliegue funciona.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    supabaseConfigurado: Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  });
}
