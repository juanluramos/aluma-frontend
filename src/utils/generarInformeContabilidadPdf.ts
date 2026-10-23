import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { MovimientoContable, ResumenContable } from "../services/contabilidadService";
import { textoDia, type ConsultaContable } from "./filtrosContabilidad";
import { formatoEuro } from "./formatoEuro";
import { textoCelda, textoGeneracion, textoPeriodo } from "./informeContabilidad";

export type DatosInformeContabilidad = {
  consulta: ConsultaContable;
  resumen: ResumenContable;
  movimientos: MovimientoContable[];
  generado: Date;
  logo: string | null;
};

const ROJO: [number, number, number] = [190, 21, 34];
const GRIS: [number, number, number] = [101, 101, 101];
const MARGEN = 14;

/**
 * Construye el informe A4 horizontal.
 * En vertical las siete columnas quedan demasiado estrechas para el título de la actividad.
 */
export function generarInformeContabilidadPdf(datos: DatosInformeContabilidad): jsPDF {
  const documento = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  documento.setProperties({ title: "Informe de Contabilidad", author: "ALUMA" });
  const ancho = documento.internal.pageSize.getWidth();
  let cursor = dibujarEncabezado(documento, datos, ancho);
  cursor = dibujarResumen(documento, datos.resumen, cursor, ancho);
  dibujarMovimientos(documento, datos.movimientos, cursor);
  dibujarPies(documento, datos.generado);
  return documento;
}

/** Abre el mismo PDF para que el navegador muestre el cuadro de impresión. */
export function abrirInformeParaImprimir(documento: jsPDF): boolean {
  documento.autoPrint();
  const url = documento.output("bloburl");
  return window.open(url, "_blank") !== null;
}

/** Lee el logotipo servido por la aplicación y lo deja listo para incrustarlo. */
export async function leerImagenInforme(url: string): Promise<string> {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("No se pudo cargar el logotipo.");
  const blob = await respuesta.blob();
  return await new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(new Error("No se pudo cargar el logotipo."));
    lector.readAsDataURL(blob);
  });
}

function dibujarEncabezado(documento: jsPDF, datos: DatosInformeContabilidad, ancho: number): number {
  const altoLogo = 18;
  if (datos.logo) documento.addImage(datos.logo, "WEBP", MARGEN, 12, altoLogo * (300 / 258), altoLogo);
  const textoX = datos.logo ? MARGEN + altoLogo * (300 / 258) + 6 : MARGEN;
  documento.setFont("helvetica", "bold");
  documento.setFontSize(16);
  documento.setTextColor(...ROJO);
  documento.text("Informe de Contabilidad", textoX, 18);
  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);
  documento.setTextColor(...GRIS);
  const lineas = [
    `Generado el ${textoGeneracion(datos.generado)}`,
    `Período: ${textoPeriodo(datos.consulta)}`,
    `Tipo: ${datos.consulta.tipo}`,
  ];
  if (datos.consulta.q) lineas.push(`Búsqueda: ${datos.consulta.q}`);
  if (datos.consulta.actividad) lineas.push("Actividad: filtrada");
  lineas.forEach((linea, indice) => documento.text(linea, textoX, 25 + indice * 5));
  const base = Math.max(12 + altoLogo, 25 + lineas.length * 5) + 3;
  documento.setDrawColor(...ROJO);
  documento.setLineWidth(0.4);
  documento.line(MARGEN, base, ancho - MARGEN, base);
  return base + 8;
}

function dibujarResumen(documento: jsPDF, resumen: ResumenContable, cursor: number, ancho: number): number {
  documento.setFont("helvetica", "bold");
  documento.setFontSize(12);
  documento.setTextColor(...ROJO);
  documento.text("Resumen económico", MARGEN, cursor);
  const filas = [
    ["Total cobrado", formatoEuro(resumen.totalCobrado)],
    ["Total devuelto", formatoEuro(resumen.totalDevuelto)],
    ["Saldo neto de cobros", formatoEuro(resumen.saldoNeto)],
    ["Pendiente actual", formatoEuro(resumen.pendienteCobro)],
  ];
  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);
  documento.setTextColor(0, 0, 0);
  filas.forEach(([etiqueta, importe], indice) => {
    const y = cursor + 7 + indice * 6;
    documento.text(etiqueta, MARGEN, y);
    documento.text(importe, ancho - MARGEN, y, { align: "right" });
  });
  const notaY = cursor + 7 + filas.length * 6 + 1;
  documento.setFontSize(8);
  documento.setTextColor(...GRIS);
  documento.text(
    "El pendiente actual corresponde a la deuda vigente y no depende de los filtros seleccionados.",
    MARGEN,
    notaY,
  );
  return notaY + 8;
}

function dibujarMovimientos(documento: jsPDF, movimientos: MovimientoContable[], cursor: number) {
  if (movimientos.length === 0) {
    documento.setFont("helvetica", "normal");
    documento.setFontSize(10);
    documento.setTextColor(0, 0, 0);
    documento.text("No hay movimientos para los filtros seleccionados.", MARGEN, cursor);
    return;
  }
  autoTable(documento, {
    startY: cursor,
    margin: { top: MARGEN, right: MARGEN, bottom: 16, left: MARGEN },
    showHead: "everyPage",
    rowPageBreak: "avoid",
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, textColor: [0, 0, 0], cellPadding: 1.6, overflow: "linebreak" },
    headStyles: { fillColor: ROJO, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 32 },
      2: { cellWidth: 36 },
      3: { cellWidth: 44 },
      4: { cellWidth: 75 },
      5: { cellWidth: 28 },
      6: { cellWidth: 28, halign: "right" },
    },
    head: [["Fecha", "Tipo de movimiento", "Concepto", "Usuario", "Actividad", "Método de pago", "Importe"]],
    body: movimientos.map((movimiento) => [
      textoDia(movimiento.fecha),
      movimiento.tipo,
      movimiento.concepto,
      textoCelda(movimiento.usuario),
      textoCelda(movimiento.actividad),
      textoCelda(movimiento.metodoPago),
      formatoEuro(movimiento.importe),
    ]),
    didParseCell: (dato) => {
      if (dato.section === "body" && dato.column.index === 6 && String(dato.cell.raw).trim().startsWith("-")) {
        dato.cell.styles.textColor = ROJO;
      }
    },
  });
}

function dibujarPies(documento: jsPDF, generado: Date) {
  const total = documento.getNumberOfPages();
  const ancho = documento.internal.pageSize.getWidth();
  const alto = documento.internal.pageSize.getHeight();
  const marca = textoGeneracion(generado);
  for (let pagina = 1; pagina <= total; pagina += 1) {
    documento.setPage(pagina);
    documento.setFont("helvetica", "normal");
    documento.setFontSize(8);
    documento.setTextColor(...GRIS);
    documento.text("ALUMA", MARGEN, alto - 8);
    documento.text(`Página ${pagina} de ${total}`, ancho / 2, alto - 8, { align: "center" });
    documento.text(marca, ancho - MARGEN, alto - 8, { align: "right" });
  }
}
