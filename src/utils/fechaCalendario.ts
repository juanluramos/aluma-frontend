const CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function fechaHoyCalendario(ahora = new Date()): string {
  const ano = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function esFechaCalendario(valor: string): boolean {
  const coincidencia = CALENDARIO.exec(valor);
  if (!coincidencia) return false;
  const ano = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(ano, mes - 1, dia));
  return fecha.getUTCFullYear() === ano
    && fecha.getUTCMonth() === mes - 1
    && fecha.getUTCDate() === dia;
}

export function fechaParaCampo(valor: string | null | undefined): string {
  const coincidencia = /^(\d{4}-\d{2}-\d{2})/.exec(valor ?? '');
  return coincidencia?.[1] ?? '';
}

export function textoFechaInscripcion(valor: string): string {
  const coincidencia = CALENDARIO.exec(fechaParaCampo(valor));
  if (!coincidencia) return '-';
  return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
}

export function ordenFechaCalendario(valor: string): number {
  const coincidencia = CALENDARIO.exec(fechaParaCampo(valor));
  if (!coincidencia) return Number.NEGATIVE_INFINITY;
  return Date.UTC(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3]));
}
