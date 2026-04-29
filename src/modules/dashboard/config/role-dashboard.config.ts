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
        hint: "Indicadores principales",
      },
      {
        key: "empresa",
        label: "Empresa",
        hint: "Datos generales de la empresa",
      },
      {
        key: "usuarios",
        label: "Usuarios",
        hint: "Accesos y perfiles",
      },
    ],
  },
  {
    title: "Configuración SRI",
    items: [
      {
        key: "firma-electronica",
        label: "Firma Electronica",
        hint: "Certificados y estado activo",
      },
      {
        key: "ambiente",
        label: "Ambiente",
        hint: "Pruebas y produccion",
      },
      {
        key: "secuenciales",
        label: "Secuenciales",
        hint: "Documentos y numeracion",
      },
    ],
  },
  {
    title: "Catalogos",
    items: [
      {
        key: "establecimientos",
        label: "Establecimientos",
        hint: "Sucursales y estados",
      },
      {
        key: "puntos-emision",
        label: "Puntos de Emision",
        hint: "Puntos por establecimiento",
      },
      {
        key: "iva",
        label: "Codigos IVA",
        hint: "Porcentajes y vigencia",
      },
      {
        key: "clientes",
        label: "Clientes",
        hint: "Registro y mantenimiento",
      },
      {
        key: "proveedores",
        label: "Proveedores",
        hint: "Altas y consulta",
      },
      {
        key: "grupos-producto",
        label: "Grupo Productos",
        hint: "Clasificacion comercial",
      },
      {
        key: "productos",
        label: "Productos",
        hint: "Catalogo general",
      },
    ],
  },
  {
    title: "Comprobantes",
    items: [
      {
        key: "facturas",
        label: "Facturas",
        hint: "Borradores y emisión",
      },
      {
        key: "notas-credito",
        label: "Notas de credito",
        hint: "Devoluciones y ajustes",
      },
      {
        key: "notas-debito",
        label: "Notas de debito",
        hint: "Intereses y cargos",
      },
    ],
  },
];

export const roleSidebarItems: Record<UserRole, SidebarGroup[]> = {
  Administrador: adminSidebarGroups,
  Facturador: [
    {
      title: "Principal",
      items: [
        { key: "dashboard", label: "Resumen", hint: "Productividad diaria" },
        { key: "clientes", label: "Clientes", hint: "Datos y busqueda" },
        { key: "productos", label: "Productos", hint: "Catalogo para venta" },
        { key: "facturas", label: "Facturas", hint: "Emision y consulta" },
        { key: "notas-credito", label: "Notas de credito", hint: "Ajustes y devoluciones" },
        { key: "notas-debito", label: "Notas de debito", hint: "Intereses y cargos" },
        {
          key: "guias-remision",
          label: "Guias de Remision",
          hint: "Control de despacho",
        },
      ],
    },
  ],
  Contador: [
    {
      title: "Principal",
      items: [
        { key: "dashboard", label: "Resumen", hint: "Estado financiero" },
        {
          key: "retenciones",
          label: "Retenciones",
          hint: "Revision tributaria",
        },
        {
          key: "impuestos",
          label: "Impuestos",
          hint: "Codigos y declaraciones",
        },
        {
          key: "reportes",
          label: "Reportes",
          hint: "Cierres y analisis",
        },
      ],
    },
  ],
};

export const roleDashboardConfig: Record<UserRole, DashboardRoleConfig> = {
  Administrador: {
    subtitle:
      "Controla la operación global del sistema, seguridad y configuraciones transversales.",
    sections: [
      {
        title: "Administracion de usuarios",
        description: "Alta de cuentas, perfiles y politicas de acceso por empresa.",
      },
      {
        title: "Parametros corporativos",
        description: "Secuenciales, establecimientos, puntos de emision y firmas.",
      },
      {
        title: "Gobierno del sistema",
        description: "Auditoria, trazabilidad y monitoreo de eventos criticos.",
      },
    ],
  },
  Facturador: {
    subtitle:
      "Gestiona el ciclo comercial diario desde cotizacion hasta comprobante electronico.",
    sections: [
      {
        title: "Emision de comprobantes",
        description: "Facturas, notas de credito/debito y documentos de soporte.",
      },
      {
        title: "Operacion comercial",
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
        title: "Analisis financiero",
        description: "KPIs, cuadros de mando y comparativos por periodo.",
      },
      {
        title: "Cierre y conciliacion",
        description: "Control de saldos, ajustes contables y reportes finales.",
      },
    ],
  },
};
