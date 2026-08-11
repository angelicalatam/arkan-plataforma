# Modelo de datos — Plataforma ARKAN

Diseño de la base de datos relacional (Supabase / PostgreSQL). Cada tabla se
crea en la fase correspondiente mediante una migración SQL en
`supabase/migrations/`. Este documento es el mapa completo de referencia.

> **Convenciones**
> - Toda tabla lleva `id` (uuid), `created_at` y `updated_at`.
> - Las tablas clave llevan `created_by` para auditoría.
> - `RLS` (seguridad por fila) activada en todas las tablas.
> - Importes en euros con 2 decimales (`numeric(12,2)`).

---

## Fase 1 — Fundación ✅ (ya creada)

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `profiles` | Usuarios de la plataforma + su rol | 1:1 con `auth.users` |
| `audit_logs` | Registro de auditoría (quién/qué/cuándo) | → `auth.users` |

Roles (`app_role`): `admin`, `gerente`, `comercial`, `jefe_obra`, `operario`, `administracion`.

---

## Fase 2 — CRM y proveedores

Idea clave: **un contacto base común** (`contacts`) evita duplicar datos entre
clientes y proveedores y facilita la detección de duplicados (sección 36). Un
mismo contacto puede ser cliente, proveedor o ambos.

| Tabla | Descripción | Relaciones principales |
|-------|-------------|------------------------|
| `contacts` | Datos base: nombre, CIF/NIF, teléfono, email, dirección… | — |
| `customers` | Ficha comercial de cliente (tipo, fuente, valor potencial, etapa CRM) | → `contacts`, → `profiles` (comercial) |
| `leads` | Oportunidad/lead con su etapa del pipeline | → `customers`, → `profiles` |
| `crm_stages` | Etapas configurables del pipeline (sección 4) | — |
| `suppliers` | Ficha de proveedor (categoría, condiciones de pago, zona…) | → `contacts` |
| `supplier_ratings` | Evaluación del proveedor (precio, calidad, plazos…) | → `suppliers` |
| `activities` | Llamadas, WhatsApp, emails, visitas, notas (timeline) | → `customers`/`leads`/`suppliers`, → `profiles` |
| `tags` | Etiquetas personalizadas | — |
| `taggables` | Relación etiqueta ↔ entidad (cliente/proveedor/obra) | → `tags` |
| `documents` (contactos) | Documentación de cliente/proveedor + vencimientos | → `contacts`/`suppliers` |

---

## Fase 3 — Presupuestos, partidas y costes

Jerarquía: **Presupuesto → Capítulos → Partidas → (Mano de obra + Materiales + Otros costes)**.

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `quotes` | Presupuesto (nº, fecha, estado, cliente, obra) | → `customers`, → `projects` |
| `quote_chapters` | Capítulos (ej. "01 Demoliciones") | → `quotes` |
| `quote_items` | Partidas (código, ud, cantidad, precio, margen…) | → `quote_chapters` |
| `quote_item_labor` | Mano de obra de la partida (oficial/peón, horas, €/h) | → `quote_items` |
| `quote_item_materials` | Materiales de la partida | → `quote_items`, → `suppliers` |
| `quote_item_costs` | Otros costes (transporte, maquinaria, subcontrata…) | → `quote_items` |

Cálculos automáticos: coste estimado, precio de venta, margen € y %.

---

## Fase 4-5 — Obras y seguimiento

Al aceptar un presupuesto → botón **"Convertir en obra"** copia capítulos,
partidas, costes y fechas a las tablas de proyecto.

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `projects` | Obra (código, cliente, fechas, estado, % avance, importes) | → `customers`, → `quotes`, → `profiles` (responsable) |
| `project_chapters` | Capítulos de la obra | → `projects` |
| `project_items` | Partidas de la obra (con % planificado y ejecutado) | → `project_chapters` |
| `project_progress` | Avance por partida (fechas reales, estado, fotos, notas) | → `project_items` |
| `incidents` | Incidencias de obra (prioridad, fotos, acción correctiva) | → `projects`, → `project_items` |

Estados de obra: `preparacion`, `pendiente_inicio`, `en_ejecucion`, `pausada`, `retrasada`, `finalizacion`, `finalizada`, `postventa`, `cerrada`.

---

## Fase 6 — Compras y materiales

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `materials` | Solicitudes de material por obra/partida | → `projects`, → `project_items`, → `suppliers` |
| `purchases` | Pedido de compra (nº, proveedor, obra, IVA, total, factura) | → `suppliers`, → `projects` |
| `purchase_items` | Líneas del pedido | → `purchases`, → `project_items` |

---

## Fase 7 — Equipo y horas

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `employees` | Operarios/colaboradores (rol, tipo, coste/hora, docs) | → `contacts` (opcional) |
| `time_entries` | Fichajes: entrada/salida, horas, obra, partida | → `employees`, → `projects`, → `project_items` |

Coste real MO = Σ (horas reales × coste/hora), imputado a cada partida.

---

## Fase 8-9 — Rentabilidad, certificaciones, facturación, extras

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `certifications` | Certificaciones de obra ejecutada (PDF) | → `projects`, → `project_items` |
| `invoices` | Facturas emitidas | → `customers`, → `projects` |
| `payments` | Cobros/pagos y vencimientos | → `invoices` |
| `change_orders` | Cambios y extras de obra (aprobación cliente) | → `projects`, → `project_items` |
| `tasks` | Tareas (asociables a cliente/obra/partida/proveedor) | → varias, → `profiles` |
| `notifications` | Alertas al usuario | → `profiles` |

La rentabilidad no es una tabla: se **calcula** a partir de importes
contratados, costes reales (compras + horas + otros) y facturación.

---

## Diagrama de relaciones (resumen)

```
contacts ──┬── customers ──── leads
           │        │
           │        └── quotes ── quote_chapters ── quote_items ──┬── labor
           │                                                      ├── materials
           │                    (Convertir en obra)               └── costs
           │                            ↓
           └── suppliers        projects ── project_chapters ── project_items
                   │                │              │
                   │                │              ├── project_progress
                   │                │              ├── time_entries ← employees
                   │                │              └── purchase_items ← purchases
                   │                │
                   └── purchases ───┘        incidents · certifications
                                             invoices ── payments · change_orders

profiles · audit_logs · tags · activities · tasks · notifications  (transversales)
```
