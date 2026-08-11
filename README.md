# ARKAN · Plataforma de Gestión Integral

Plataforma web de gestión empresarial para **ARKAN Reformas**: CRM, proveedores,
presupuestos, obras, control de costes, compras, equipo, rentabilidad y postventa
en un único lugar.

> Del **lead** a la **postventa**:
> Lead → Cliente → Presupuesto → Obra → Partidas → Compras → Materiales →
> Mano de obra → Avance → Costes → Rentabilidad → Facturación → Postventa

## 🛠️ Tecnología

- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (diseño responsive)
- **Supabase** (base de datos PostgreSQL, autenticación y almacenamiento)

## 🚀 Cómo arrancar en local

```bash
npm install
npm run dev
```

Luego abre **http://localhost:3000**.

Para activar el login y los datos, copia `.env.local.example` a `.env.local` y
añade tus claves de Supabase. Ver la guía: [`docs/guia-configurar-supabase.md`](docs/guia-configurar-supabase.md).

## 📚 Documentación

- [Modelo de datos completo](docs/modelo-datos.md)
- [Guía de configuración de Supabase](docs/guia-configurar-supabase.md)

## 🗺️ Estado del proyecto

Desarrollo por fases:

- ✅ **Fase 1** — Base: autenticación, usuarios/roles, diseño y navegación
- ⬜ **Fase 2** — CRM (clientes/leads) + proveedores
- ⬜ **Fase 3** — Presupuestos, partidas y costes
- ⬜ **Fase 4-5** — Conversión a obra y seguimiento
- ⬜ **Fase 6-11** — Compras, equipo, rentabilidad, documentos, reportes e IA

---

_Plataforma propia de ARKAN Reformas._
