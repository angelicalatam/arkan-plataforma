import "server-only";
import * as XLSX from "xlsx";

/**
 * Lector de presupuestos exportados a Excel (formato de la app de ARKAN).
 *
 * El Excel viene por filas, con una columna "Tipo línea" que indica qué es
 * cada fila: Capítulo, Partida, Partida descripción, Producto,
 * Producto descripción, Medición o Total capítulo.
 *
 * Estructura de columnas (por posición):
 *   0 Tipo línea | 1 Id | 2 Unidades | 3 Partidas y Productos | 4 Mediciones
 *   5 Cantidades | 6 Precio coste Mano de Obra | 7 Precio coste materiales
 *   8 Beneficios | 9 (precio base) | 10 Precio cliente total | 11 Importes
 *
 * Los "Producto" dentro de una partida se suman al coste de materiales de esa
 * partida, y el margen se calcula para que el precio de cliente (columna 10)
 * quede idéntico al del Excel.
 */

export type ParsedProduct = {
  name: string;
  description: string | null;
  cost: number; // coste de materiales del producto (columna 8)
  margin_pct: number; // % de beneficio sobre el coste
  price: number; // precio de cliente del producto (columna 10)
};

export type ParsedItem = {
  code: string | null;
  description: string;
  unit: string;
  quantity: number;
  cost_labor: number;
  cost_materials: number;
  cost_other: number;
  margin_pct: number;
  notes: string | null;
  products: ParsedProduct[];
};

export type ParsedChapter = {
  code: string | null;
  name: string;
  items: ParsedItem[];
};

export type ParsedQuote = {
  chapters: ParsedChapter[];
  itemCount: number;
  totalSale: number; // suma de precio de cliente (sin IVA), solo informativo
};

/** Convierte un texto de Excel ("1.935,76 €", "0.3284", "18.4") a número. */
function num(raw: unknown): number {
  if (raw == null) return 0;
  let v = String(raw).trim();
  if (!v) return 0;
  v = v.replace(/[€\s]/g, "");
  const hasComma = v.includes(",");
  const hasDot = v.includes(".");
  if (hasComma && hasDot) {
    // Formato europeo: punto = miles, coma = decimales.
    v = v.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // Solo coma → decimal.
    v = v.replace(",", ".");
  }
  v = v.replace(/[^0-9.\-]/g, "");
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

type WorkItem = {
  code: string | null;
  description: string;
  unit: string;
  quantity: number;
  labor: number;
  materials: number; // base de la partida
  productMaterials: number; // suma del coste de materiales de los productos
  unitPrice: number; // precio cliente unitario (col 10)
  notes: string | null;
  products: ParsedProduct[];
};

function finalizeItem(w: WorkItem): ParsedItem {
  const labor = round2(w.labor);
  const materials = round2(w.materials + w.productMaterials);
  let cost_other = 0;
  const totalCost = labor + materials;
  let margin_pct = 0;
  if (totalCost > 0) {
    margin_pct = round4((w.unitPrice / totalCost - 1) * 100);
  } else if (w.unitPrice > 0) {
    // Partida sin coste desglosado: guardamos el precio como "otros costes".
    cost_other = round2(w.unitPrice);
  }
  return {
    code: w.code,
    description: w.description || "(sin descripción)",
    unit: w.unit || "ud",
    quantity: w.quantity,
    cost_labor: labor,
    cost_materials: materials,
    cost_other,
    margin_pct,
    notes: w.notes,
    products: w.products,
  };
}

export function parseQuoteWorkbook(buf: Buffer | ArrayBuffer): ParsedQuote {
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("El archivo no contiene ninguna hoja.");
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
  });

  const chapters: ParsedChapter[] = [];
  let current: ParsedChapter | null = null;
  let work: WorkItem | null = null;

  const flush = () => {
    if (work && current) current.items.push(finalizeItem(work));
    work = null;
  };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const type = String(r[0] ?? "").trim().toLowerCase();
    if (!type || type === "tipo línea" || type === "tipo linea") continue;

    if (type === "capítulo" || type === "capitulo") {
      flush();
      current = { code: null, name: String(r[3] ?? "").trim(), items: [] };
      chapters.push(current);
    } else if (type === "partida") {
      flush();
      work = {
        code: null,
        description: String(r[3] ?? "").trim(),
        unit: String(r[2] ?? "").trim() || "ud",
        quantity: num(r[5]),
        labor: 0,
        materials: 0,
        productMaterials: 0,
        unitPrice: num(r[10]),
        notes: null,
        products: [],
      };
      if (!current) {
        current = { code: null, name: "Sin capítulo", items: [] };
        chapters.push(current);
      }
    } else if (type === "partida descripción" || type === "partida descripcion") {
      if (work) {
        work.labor = num(r[6]);
        work.materials = num(r[7]);
        const longDesc = String(r[3] ?? "").trim();
        if (longDesc) work.notes = longDesc;
      }
    } else if (type === "producto") {
      if (work) {
        const pCost = num(r[7]); // coste de materiales del producto (col. 8)
        const pPrice = num(r[9]); // precio de cliente del producto (col. 10)
        const pMargin = pCost > 0 ? round4((pPrice / pCost - 1) * 100) : 0;
        work.productMaterials += pCost;
        work.products.push({
          name: String(r[3] ?? "").trim() || "Producto",
          description: null,
          cost: round2(pCost),
          margin_pct: pMargin,
          price: pPrice,
        });
      }
    } else if (type === "producto descripción" || type === "producto descripcion") {
      // La descripción larga va en el último producto añadido.
      if (work && work.products.length > 0) {
        const longDesc = String(r[3] ?? "").trim();
        if (longDesc) work.products[work.products.length - 1].description = longDesc;
      }
    }
    // "Medición" y "Total capítulo" se ignoran.
  }
  flush();

  let itemCount = 0;
  let totalSale = 0;
  for (const ch of chapters) {
    for (const it of ch.items) {
      itemCount++;
      const unitCost = it.cost_labor + it.cost_materials + it.cost_other;
      const saleUnit = it.cost_other > 0 && unitCost === it.cost_other
        ? it.cost_other
        : unitCost * (1 + it.margin_pct / 100);
      totalSale += saleUnit * it.quantity;
    }
  }

  return { chapters, itemCount, totalSale: round2(totalSale) };
}
