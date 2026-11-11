// Cálculo de las estadísticas avanzadas (RF15) a partir de los recorridos finalizados.

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
const ETIQUETAS = ['Hace 3 sem', 'Hace 2 sem', 'Sem. pasada', 'Esta sem.'];
const redondear = (n) => Math.round(n * 10) / 10;

// Lunes 00:00 (UTC) de la semana de una fecha, en milisegundos.
function inicioDeSemana(fecha) {
  const diasDesdeLunes = (fecha.getUTCDay() + 6) % 7;
  return Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate() - diasDesdeLunes);
}

/** filas: [{ titulo, iniciado_en, distancia_m, duracion_s }] */
export function calcularEstadisticas(filas, ahora = new Date()) {
  let metros = 0;
  let segundos = 0;
  let mejor = null;
  const kmPorSemana = [0, 0, 0, 0]; // [hace 3, hace 2, pasada, esta]
  const semanaActual = inicioDeSemana(ahora);

  for (const fila of filas) {
    const m = Number(fila.distancia_m) || 0;
    const s = Number(fila.duracion_s) || 0;
    metros += m;
    segundos += s;
    if (!mejor || m > mejor.metros) mejor = { titulo: fila.titulo, metros: m };

    const momento = new Date(fila.iniciado_en).getTime();
    if (Number.isNaN(momento)) continue;
    const semanasAtras = Math.round((semanaActual - inicioDeSemana(new Date(momento))) / SEMANA_MS);
    if (semanasAtras >= 0 && semanasAtras <= 3) kmPorSemana[3 - semanasAtras] += m / 1000;
  }

  const km = metros / 1000;
  return {
    total_km: redondear(km),
    total_min: Math.round(segundos / 60),
    recorridos: filas.length,
    velocidad_media: segundos > 0 ? redondear(km / (segundos / 3600)) : 0,
    promedio_km: filas.length > 0 ? redondear(km / filas.length) : 0,
    mejor: mejor && mejor.metros > 0 ? { titulo: mejor.titulo, km: redondear(mejor.metros / 1000) } : null,
    semanas: ETIQUETAS.map((etiqueta, i) => ({ etiqueta, km: redondear(kmPorSemana[i]) })),
  };
}
