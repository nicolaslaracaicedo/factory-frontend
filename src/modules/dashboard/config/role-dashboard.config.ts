import type { UserRole } from "@/src/modules/auth/types/auth.types";

export interface SidebarItem {
  key: string;
  label: string;
  hint: string;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export interface DashboardSection {
  title: string;
  description: string;
}

export interface DashboardRoleConfig {
  subtitle: string;
  sections: DashboardSection[];
}

const adminSidebarGroups: SidebarGroup[] = [
  {
    title: "Principal",
    items: [
      {
        key: "dashboard",
        label: "Resumen",
        hint: "Visualiza métricas clave, estadísticas de ventas y estado de comprobantes emitidos",
      },
    ],
  },
  {
    title: "Ventas",
    items: [
      {
        key: "facturas",
        label: "Facturas",
        hint: "Crea borradores, emite facturas electrónicas al SRI, descarga PDFs e imprime recibos",
      },
      {
        key: "notas-venta",
        label: "Notas de Venta",
        hint: "Registra ventas a consumidor final, emite comprobantes, descarga PDF e imprime recibos",
      },
      {
        key: "notas-credito",
        label: "Notas de Crédito",
        hint: "Genera notas de crédito por devoluciones, anulaciones o correcciones de facturas emitidas",
      },
      {
        key: "notas-debito",
        label: "Notas de Débito",
        hint: "Emite notas de débito por intereses, recargos o ajustes de precio en facturas",
      },
      {
        key: "proformas",
        label: "Proformas",
        hint: "Crea cotizaciones para clientes y conviértelas en facturas cuando se confirme la venta",
      },
      {
        key: "recurrentes",
        label: "Facturación Recurrente",
        hint: "Automatiza facturas periódicas (mensuales, anuales) para suscripciones o servicios",
      },
      {
        key: "retenciones",
        label: "Retenciones",
        hint: "Emite comprobantes de retención en la fuente por servicios y compras a proveedores",
      },
      {
        key: "liquidaciones-compra",
        label: "Liquidaciones de Compra",
        hint: "Emite liquidaciones de compra para adquisición de productos agrícolas y recursos",
      },
    ],
  },
  {
    title: "Inventario",
    items: [
      {
        key: "productos",
        label: "Productos",
        hint: "Gestiona tu catálogo: códigos, descripciones, precios de venta, stock y configuración de impuestos",
      },
      {
        key: "grupos-producto",
        label: "Grupos de Productos",
        hint: "Crea y organiza categorías para clasificar tu catálogo de productos",
      },
    ],
  },
  {
    title: "Contactos",
    items: [
      {
        key: "clientes",
        label: "Clientes",
        hint: "Registra, edita y administra la información comercial de tus clientes",
      },
      {
        key: "proveedores",
        label: "Proveedores",
        hint: "Registra, edita y administra datos de proveedores con RUC, dirección y contacto",
      },
    ],
  },
  {
    title: "Logística",
    items: [
      {
        key: "guias-remision",
        label: "Guías de Remisión",
        hint: "Genera guías de remisión para transporte de mercadería entre establecimientos",
      },
    ],
  },
];

const adminNavbarGroups: SidebarGroup[] = [
  {
    title: "Mi Empresa",
    items: [
      {
        key: "empresa",
        label: "Empresa",
        hint: "Configura razón social, RUC, dirección, logo y datos tributarios de tu empresa",
      },
      {
        key: "establecimientos",
        label: "Establecimientos",
        hint: "Registra sucursales, matriz y puntos de venta con su código SRI y dirección",
      },
      {
        key: "usuarios",
        label: "Usuarios",
        hint: "Crea usuarios, asigna roles de acceso (Admin, Facturador, Contador) y gestiona permisos",
      },
    ],
  },
  {
    title: "Configuración Fiscal SRI",
    items: [
      {
        key: "firma-electronica",
        label: "Firma Electrónica",
        hint: "Sube tu certificado digital (.p12), ingresa la clave y activa la firma para emitir comprobantes",
      },
      {
        key: "iva",
        label: "Códigos IVA",
        hint: "Configura porcentajes de IVA, ICE y códigos de impuestos vigentes en Ecuador",
      },
      {
        key: "secuenciales",
        label: "Secuenciales",
        hint: "Define numeración inicial para facturas, notas y guías por punto de emisión",
      },
      {
        key: "puntos-emision",
        label: "Puntos de Emisión",
        hint: "Crea puntos de emisión (cajas) asociados a cada establecimiento para facturación",
      },
    ],
  },
  {
    title: "Centro de Control",
    items: [
      {
        key: "sri-logs",
        label: "Auditoría SRI",
        hint: "Consulta historial de envíos, respuestas del SRI y estado de autorización de comprobantes",
      },
    ],
  },
];

const facturadorNavbarGroups: SidebarGroup[] = [
  {
    title: "Mi Empresa",
    items: [
      {
        key: "empresa",
        label: "Empresa",
        hint: "Configura razón social, RUC, dirección, logo y datos tributarios de tu empresa",
      },
      {
        key: "establecimientos",
        label: "Establecimientos",
        hint: "Registra sucursales, matriz y puntos de venta con su código SRI y dirección",
      },
    ],
  },
  {
    title: "Configuración Fiscal SRI",
    items: [
      {
        key: "firma-electronica",
        label: "Firma Electrónica",
        hint: "Sube tu certificado digital (.p12), ingresa la clave y activa la firma para emitir comprobantes",
      },
      {
        key: "iva",
        label: "Códigos IVA",
        hint: "Configura porcentajes de IVA, ICE y códigos de impuestos vigentes en Ecuador",
      },
      {
        key: "secuenciales",
        label: "Secuenciales",
        hint: "Define numeración inicial para facturas, notas y guías por punto de emisión",
      },
      {
        key: "puntos-emision",
        label: "Puntos de Emisión",
        hint: "Crea puntos de emisión (cajas) asociados a cada establecimiento para facturación",
      },
    ],
  },
  {
    title: "Centro de Control",
    items: [
      {
        key: "sri-logs",
        label: "Auditoría SRI",
        hint: "Consulta historial de envíos, respuestas del SRI y estado de autorización de comprobantes",
      },
    ],
  },
];

export const roleSidebarItems: Record<UserRole, SidebarGroup[]> = {
  Administrador: adminSidebarGroups,
  Facturador: adminSidebarGroups,
  Contador: adminSidebarGroups,
};

export const roleNavbarItems: Record<UserRole, SidebarGroup[]> = {
  Administrador: adminNavbarGroups,
  Facturador: facturadorNavbarGroups,
  Contador: facturadorNavbarGroups,
};

export const roleDashboardConfig: Record<UserRole, DashboardRoleConfig> = {
  Administrador: {
    subtitle:
      "Controla la operación global del sistema, seguridad y configuraciones transversales.",
    sections: [
      {
        title: "Administración de usuarios",
        description: "Alta de cuentas, perfiles y politicas de acceso por empresa.",
      },
      {
        title: "Parametros corporativos",
        description: "Secuenciales, establecimientos, puntos de emision y firmas.",
      },
      {
        title: "Gobierno del sistema",
        description: "Auditoría, trazabilidad y monitoreo de eventos críticos.",
      },
    ],
  },
  Facturador: {
    subtitle:
      "Gestiona el ciclo comercial diario desde cotización hasta comprobante electrónico.",
    sections: [
      {
        title: "Emision de comprobantes",
        description: "Facturas, notas de credito/debito y documentos de soporte.",
      },
      {
        title: "Operación comercial",
        description: "Clientes, productos, precios, stock y flujo de venta.",
      },
      {
        title: "Control de despacho",
        description: "Guias de remision y seguimiento de entregas por establecimiento.",
      },
    ],
  },
  Contador: {
    subtitle:
      "Supervisa cumplimiento tributario, reportes financieros y cierre contable.",
    sections: [
      {
        title: "Revision tributaria",
        description: "Retenciones, codigos de IVA y validacion de documentos.",
      },
      {
        title: "Análisis financiero",
        description: "KPIs, cuadros de mando y comparativos por periodo.",
      },
      {
        title: "Cierre y conciliación",
        description: "Control de saldos, ajustes contables y reportes finales.",
      },
    ],
  },
};

