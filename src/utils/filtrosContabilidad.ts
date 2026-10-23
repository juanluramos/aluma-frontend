export type SeleccionActividad = {
  ids: number[];
  sinActividad: boolean;
};

export type ConsultaContable = {
  desde: string;
  hasta: string;
  tipo: "Todos" | "Cobro" | "Devolución" | "Ajuste";
  q: string;
  actividad: SeleccionActividad | null;
  pagina: number;
  orden: "asc" | "desc";
};

export const consultaInicial: ConsultaContable = {
  desde: "",
  hasta: "",
  tipo: "Todos",
  q: "",
  actividad: null,
  pagina: 1,
  orden: "desc",
};

export function errorRangoFechas(desde: string, hasta: string): string {
  if (!desde || !hasta || desde <= hasta) return "";
  return "La fecha inicial no puede ser posterior a la final.";
}

export function textoDia(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return "—";
  return `${dia}/${mes}/${anio}`;
}

export function parametrosContables(consulta: ConsultaContable, listado: boolean, limite?: number): string {
  const params = new URLSearchParams();
  if (consulta.desde) params.set("desde", consulta.desde);
  if (consulta.hasta) params.set("hasta", consulta.hasta);
  if (consulta.tipo !== "Todos") params.set("tipo", consulta.tipo);
  if (consulta.q) params.set("q", consulta.q);
  if (consulta.actividad) {
    const { ids, sinActividad } = consulta.actividad;
    params.set(
      "actividad",
      ids.length === 0 && !sinActividad
        ? "ninguna"
        : [...ids.map(String), ...(sinActividad ? ["sin"] : [])].join(","),
    );
  }
  if (listado) {
    params.set("pagina", String(consulta.pagina));
    params.set("orden", consulta.orden);
    if (limite) params.set("limite", String(limite));
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

export function hayFiltroContable(consulta: ConsultaContable): boolean {
  return Boolean(consulta.desde || consulta.hasta || consulta.q || consulta.actividad || consulta.tipo !== "Todos");
}
