// Plan del usuario (gratis o premium) y límites del plan gratis.
// Estas reglas se aplican en el SERVIDOR: aunque alguien modifique la app, no puede saltarlas.

/** Cantidad máxima de recorridos que ve un usuario del plan gratis (RF14). */
export const LIMITE_HISTORIAL_GRATIS = 5;

/** Devuelve 'premium' o 'gratis' según la columna "plan" de la tabla perfiles. */
export async function obtenerPlan(db, usuarioId) {
  const { data, error } = await db.from('perfiles').select('plan').eq('id', usuarioId).maybeSingle();
  if (error) throw error;
  return data?.plan === 'premium' ? 'premium' : 'gratis';
}
