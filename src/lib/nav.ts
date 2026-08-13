import {
  LayoutDashboard,
  UserPlus,
  Users,
  Activity,
  Building2,
  FileText,
  BookOpen,
  ShoppingBag,
  HardHat,
  ShoppingCart,
  Package,
  SquareCheckBig,
  TriangleAlert,
  FolderOpen,
  Receipt,
  ChartColumn,
  CalendarDays,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

/**
 * Estructura de navegación principal de la plataforma.
 * Sigue el mapa de módulos definido en el prompt maestro (sección 38).
 */
export const navGroups: NavGroup[] = [
  {
    items: [{ label: "Panel principal", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Comercial (CRM)",
    items: [
      { label: "Leads", href: "/leads", icon: UserPlus },
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Actividades", href: "/actividades", icon: Activity },
    ],
  },
  {
    title: "Presupuestos y obras",
    items: [
      { label: "Presupuestos", href: "/presupuestos", icon: FileText },
      { label: "Banco de precios", href: "/banco-precios", icon: BookOpen },
      { label: "Productos", href: "/productos", icon: ShoppingBag },
      { label: "Obras", href: "/obras", icon: HardHat },
      { label: "Compras", href: "/compras", icon: ShoppingCart },
      { label: "Materiales", href: "/materiales", icon: Package },
      { label: "Tareas", href: "/tareas", icon: SquareCheckBig },
      { label: "Incidencias", href: "/incidencias", icon: TriangleAlert },
    ],
  },
  {
    title: "Recursos",
    items: [
      { label: "Proveedores", href: "/proveedores", icon: Building2 },
      { label: "Equipo", href: "/equipo", icon: Users },
      { label: "Documentos", href: "/documentos", icon: FolderOpen },
    ],
  },
  {
    title: "Gestión",
    items: [
      { label: "Facturación", href: "/facturacion", icon: Receipt },
      { label: "Reportes", href: "/reportes", icon: ChartColumn },
      { label: "Calendario", href: "/calendario", icon: CalendarDays },
    ],
  },
  {
    title: "Sistema",
    items: [{ label: "Configuración", href: "/configuracion", icon: Settings }],
  },
];

/** Acciones rápidas del botón "+" (sección 39). */
export const quickActions: { label: string; href: string }[] = [
  { label: "Nuevo lead", href: "/leads/nuevo" },
  { label: "Nuevo cliente", href: "/clientes/nuevo" },
  { label: "Nuevo proveedor", href: "/proveedores/nuevo" },
  { label: "Nuevo presupuesto", href: "/presupuestos/nuevo" },
  { label: "Nueva obra", href: "/obras/nueva" },
  { label: "Nueva tarea", href: "/tareas/nueva" },
  { label: "Nueva compra", href: "/compras/nueva" },
  { label: "Nueva incidencia", href: "/incidencias/nueva" },
];
