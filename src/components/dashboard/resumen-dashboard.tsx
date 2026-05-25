"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "@/src/lib/api";
import {
  TrendingUp,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  FileText,
  Users,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  BarChart3,
} from "lucide-react";
import { formatDistanceToNow, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { motion, type Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  ventas: {
    hoy: number;
    mes: number;
    anio: number;
    total_facturado: number;
    por_dia: { fecha: string; total: number; cantidad: number }[];
    por_mes: { mes: string; total: number; cantidad: number }[];
    metodos_pago: {
      forma_pago: string;
      cantidad: string;
      total: string;
      label: string;
    }[];
  };
  documentos: {
    facturas: { total: number; autorizados: number; rechazados: number; pendientes: number };
    notas_credito: { total: number; autorizados: number; rechazados: number };
    notas_debito: { total: number; autorizados: number; rechazados: number };
    retenciones: { total: number; autorizados: number; rechazados: number };
    guias_remision: { total: number; autorizados: number; rechazados: number };
    liquidaciones_compra: { total: number; autorizados: number; rechazados: number };
    total_autorizados: number;
    total_rechazados: number;
    total_pendientes: number;
    recientes: {
      tipo: string;
      id: number;
      numero_comprobante: string;
      estado: string;
      destinatario: string;
      total: string;
      created_at: string;
    }[];
  };
  tributario: {
    iva_mes: number;
    iva_anio: number;
    retenido_mes: number;
    retenido_anio: number;
  };
  clientes_productos: {
    clientes_activos: number;
    clientes_total: number;
    proveedores_activos: number;
    productos_activos: number;
    productos_total: number;
    top_clientes: {
      cli_identificacion: string;
      cli_razon_social: string;
      facturas: string;
      total_comprado: string;
    }[];
    productos_mas_vendidos: {
      codigo: string;
      descripcion: string;
      cantidad_vendida: string;
      total_vendido: string;
    }[];
  };
  pagos: { facturas_credito: number; total_por_cobrar: number };
  sistema: {
    empresa: { razon_social: string; ruc: string; ambiente: string };
    smtp_configurado: boolean;
    firma: {
      activa: boolean;
      nombre: string;
      fecha_vencimiento: string;
      dias_restantes: number;
      estado: string;
    };
    usuarios_activos: number;
    secuenciales_por_agotar: unknown[];
    alertas: { tipo: string; mensaje: string }[];
  };
  actividad_reciente: {
    id: number;
    tipo_documento: string;
    accion: string;
    ambiente: string;
    estado: string;
    mensaje: string | null;
    created_at: string;
    tipo_label: string;
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const usd = (v: number | string) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(v));

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
};

const fmtDateShort = (iso: string) => {
  // "2026-04-24" → "24 Abr"
  const [, m, d] = iso.split("-");
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d} ${months[parseInt(m) - 1]}`;
};

const fmtDateRelative = (iso: string) => {
  try {
    // Removemos la Z para que JS lo tome como hora local (Ecuador)
    const localIso = iso.endsWith("Z") ? iso.slice(0, -1) : iso;
    // Compensamos el desfase exacto de 2 horas que tiene el reloj del backend
    const correctedDate = addHours(new Date(localIso), 2);
    return formatDistanceToNow(correctedDate, { addSuffix: true, locale: es });
  } catch {
    return fmtDate(iso);
  }
};

// ---------------------------------------------------------------------------
// Sub-components (pure presentational)
// ---------------------------------------------------------------------------

// ── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string; // Tailwind bg class for icon pill
  badge?: React.ReactNode;
}

function KpiCard({ label, value, sub, icon, accent, badge }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50/60" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-bold text-slate-800">{value}</p>
          {(sub || badge) && (
            <div className="mt-2 flex items-center gap-2">
              {sub && <p className="text-[11px] text-slate-500 leading-none">{sub}</p>}
              {badge}
            </div>
          )}
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  AUTORIZADO:  "bg-emerald-100 text-emerald-700",
  RECHAZADA:   "bg-red-100 text-red-700",
  RECHAZADO:   "bg-red-100 text-red-700",
  BORRADOR:    "bg-slate-100 text-slate-600",
  ANULADA:     "bg-amber-100 text-amber-700",
  RECIBIDA:    "bg-blue-100 text-blue-700",
  "NO AUTORIZADO": "bg-red-100 text-red-700",
  VIGENTE:     "bg-emerald-100 text-emerald-700",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}>
      {status}
    </span>
  );
}

// ── Document Counter Card ────────────────────────────────────────────────────

interface DocCounterProps {
  label: string;
  total: number;
  autorizados: number;
  rechazados: number;
  icon: React.ReactNode;
}

function DocCounter({ label, total, autorizados, rechazados, icon }: DocCounterProps) {
  const pct = total > 0 ? Math.round((autorizados / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>
        <span className="text-xs font-bold text-slate-700">{total}</span>
      </div>
      {/* progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span className="text-emerald-600 font-medium">{autorizados} aut.</span>
        <span className="text-red-400">{rechazados} rechz.</span>
      </div>
    </div>
  );
}

// ── Custom Tooltip for Area chart ────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-0.5">{label}</p>
      <p className="text-emerald-600 font-bold">{usd(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

// ── Donut centre label ───────────────────────────────────────────────────────

function DonutCenterLabel({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" className="fill-slate-500" fontSize={10}>
        Total
      </tspan>
      <tspan x="50%" dy={18} fontWeight={700} fontSize={13} fill="#1e293b">
        {usd(total)}
      </tspan>
    </text>
  );
}

// ---------------------------------------------------------------------------
// Donut palette
// ---------------------------------------------------------------------------

const DONUT_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#3b82f6"];

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ResumenDashboardProps {
  /** If omitted the component fetches from the real API */
  staticData?: { success: boolean; data: DashboardData };
}

export function ResumenDashboard({ staticData }: ResumenDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(staticData?.data ?? null);
  const [loading, setLoading] = useState(!staticData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.get("/api/dashboard");
      const json = res.data;
      if (json.success) setData(json.data as DashboardData);
      else throw new Error("API returned success=false");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!staticData) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-12 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <div>
          <p className="font-semibold text-red-700">No se pudo cargar el dashboard</p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ── Derived values ──────────────────────────────────────────────────────

  const firma = data.sistema.firma;
  const firmaUrgente = firma.dias_restantes < 30;

  // Current month from por_mes (last entry is most recent)
  const currentMonthData = data.ventas.por_mes.at(-1);
  const comprobantesEsteMes = currentMonthData?.cantidad ?? 0;

  const areaData = data.ventas.por_dia.map((d) => ({
    fecha: fmtDateShort(d.fecha),
    total: d.total,
    cantidad: d.cantidad,
  }));

  const donutData = data.ventas.metodos_pago.map((m) => ({
    name: m.label,
    value: parseFloat(m.total),
  }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // Smart percentage formatting: show enough decimals so tiny values
  // never display as 0.0% (which looks like a loading bug)
  const fmtPct = (value: number, total: number): string => {
    if (total <= 0) return "0%";
    const raw = (value / total) * 100;
    if (raw >= 1) return `${raw.toFixed(1)}%`;
    if (raw >= 0.01) return `${raw.toFixed(2)}%`;
    if (raw > 0) return `${raw.toFixed(3)}%`;
    return "0%";
  };

  const topProductMax = Math.max(
    ...data.clientes_productos.productos_mas_vendidos.map((p) => parseFloat(p.cantidad_vendida))
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div initial="hidden" animate="visible">
      <div className="space-y-5">

      {/* ── Ambiente alert ──────────────────────────────────────────────── */}
      {data.sistema.alertas.length > 0 && (
        <motion.div variants={sectionVariants} custom={0} className="space-y-2">
          {data.sistema.alertas.map((a, i) => (
            <div
              key={i}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                  !
                </span>
                <div className="flex-1 text-xs leading-relaxed text-amber-800">{a.mensaje}</div>
                <button
                  onClick={() => fetchData(true)}
                  className={`ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200 hover:text-amber-900 ${refreshing ? "animate-spin" : ""}`}
                  title="Refrescar"
                  disabled={refreshing}
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ROW 1 — KPI Cards
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={sectionVariants} custom={1} className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <KpiCard
          label="Venta del Día"
          value={usd(data.ventas.hoy)}
          sub={`${data.ventas.por_dia.at(-1)?.cantidad ?? 0} comprobantes`}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          accent="bg-emerald-50"
        />

        <KpiCard
          label="Facturación Mensual"
          value={usd(data.ventas.mes)}
          sub={`${comprobantesEsteMes} comprobantes este mes`}
          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
          accent="bg-violet-50"
        />

        <KpiCard
          label="IVA del Mes"
          value={usd(data.tributario.iva_mes)}
          sub={`Retenido este mes: ${usd(data.tributario.retenido_mes)}`}
          icon={<Receipt className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50"
        />

        <KpiCard
          label="Firma Electrónica"
          value={`${firma.dias_restantes} días`}
          sub={`Vence: ${firma.fecha_vencimiento}`}
          icon={
            firmaUrgente
              ? <ShieldAlert className="h-5 w-5 text-red-500" />
              : <ShieldCheck className="h-5 w-5 text-emerald-600" />
          }
          accent={firmaUrgente ? "bg-red-50" : "bg-emerald-50"}
          badge={
            <StatusBadge status={firma.estado} />
          }
        />
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 2 — Charts
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={sectionVariants} custom={2} className="grid gap-4 lg:grid-cols-2">

        {/* ── Area Chart: Historial de ventas diarias ───────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={<BarChart3 className="h-4 w-4" />}
            title="Historial de Ventas Diarias"
          />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#059669" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Donut Chart: Métodos de pago ──────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={<DollarSign className="h-4 w-4" />}
            title="Métodos de Pago"
          />
          <div className="flex items-center gap-4 mt-1">
            <div className="relative flex-shrink-0">
              <PieChart width={180} height={180}>
                <Pie
                  data={donutData}
                  cx={85}
                  cy={85}
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  minAngle={2}
                >
                  {donutData.map((_, idx) => (
                    <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <DonutCenterLabel total={donutTotal} />
              </PieChart>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {donutData.map((d, i) => {
                const pctLabel = fmtPct(d.value, donutTotal);
                // For the progress bar width, ensure at least 2% visible width if value > 0
                const rawPct = donutTotal > 0 ? (d.value / donutTotal) * 100 : 0;
                const barWidth = rawPct > 0 && rawPct < 2 ? 2 : rawPct;
                const color = DONUT_COLORS[i % DONUT_COLORS.length];
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-700">{d.name}</span>
                      </div>
                      <span className="font-bold text-slate-600">{pctLabel}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barWidth}%`, backgroundColor: color }}
                      />
                    </div>
                    <p className="text-right text-[10px] text-slate-400">{usd(d.value)}</p>
                  </div>
                );
              })}
              {/* totals pill */}
              <div className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total facturado</p>
                <p className="mt-0.5 text-sm font-bold text-slate-700">{usd(data.ventas.total_facturado)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 3 — Control de Comprobantes
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={sectionVariants} custom={3} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={<FileText className="h-4 w-4" />}
            title="Control de Comprobantes"
          />
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {data.documentos.total_autorizados} aut.
            </span>
            <span className="flex items-center gap-1 text-red-500 font-semibold">
              <XCircle className="h-3.5 w-3.5" />
              {data.documentos.total_rechazados} rechz.
            </span>
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Clock className="h-3.5 w-3.5" />
              {data.documentos.total_pendientes} pend.
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <DocCounter
            label="Facturas"
            icon={<FileText className="h-3.5 w-3.5" />}
            total={data.documentos.facturas.total}
            autorizados={data.documentos.facturas.autorizados}
            rechazados={data.documentos.facturas.rechazados}
          />
          <DocCounter
            label="Notas Crédito"
            icon={<FileText className="h-3.5 w-3.5" />}
            total={data.documentos.notas_credito.total}
            autorizados={data.documentos.notas_credito.autorizados}
            rechazados={data.documentos.notas_credito.rechazados}
          />
          <DocCounter
            label="Notas Débito"
            icon={<FileText className="h-3.5 w-3.5" />}
            total={data.documentos.notas_debito.total}
            autorizados={data.documentos.notas_debito.autorizados}
            rechazados={data.documentos.notas_debito.rechazados}
          />
          <DocCounter
            label="Retenciones"
            icon={<Receipt className="h-3.5 w-3.5" />}
            total={data.documentos.retenciones.total}
            autorizados={data.documentos.retenciones.autorizados}
            rechazados={data.documentos.retenciones.rechazados}
          />
          <DocCounter
            label="Guías Remisión"
            icon={<Package className="h-3.5 w-3.5" />}
            total={data.documentos.guias_remision.total}
            autorizados={data.documentos.guias_remision.autorizados}
            rechazados={data.documentos.guias_remision.rechazados}
          />
          <DocCounter
            label="Liquidaciones"
            icon={<FileText className="h-3.5 w-3.5" />}
            total={data.documentos.liquidaciones_compra.total}
            autorizados={data.documentos.liquidaciones_compra.autorizados}
            rechazados={data.documentos.liquidaciones_compra.rechazados}
          />
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 4 — Analytics & Recent Activity
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={sectionVariants} custom={4} className="grid gap-4 lg:grid-cols-3">

        {/* ── Col 1: Top Clientes ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={<Users className="h-4 w-4" />}
            title="Top Clientes"
          />
          <ol className="space-y-2.5">
            {data.clientes_productos.top_clientes.map((c, i) => (
              <li key={i} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
                {i < 3 ? (
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      i === 0
                        ? "bg-amber-100 text-amber-700"
                        : i === 1
                        ? "bg-slate-100 text-slate-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[12px] font-bold text-slate-400">
                    {i + 1}.
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">{c.cli_razon_social}</p>
                  <p className="text-[10px] text-slate-400">{c.facturas} facturas</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 shrink-0">
                  {usd(c.total_comprado)}
                </span>
              </li>
            ))}
          </ol>

          {/* clientes activos pill */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-xs text-slate-500">Clientes activos</span>
            <span className="text-xs font-bold text-slate-700">
              {data.clientes_productos.clientes_activos}/{data.clientes_productos.clientes_total}
            </span>
          </div>
        </div>

        {/* ── Col 2: Productos Top ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={<Package className="h-4 w-4" />}
            title="Productos Más Vendidos"
          />
          <ul className="space-y-3">
            {data.clientes_productos.productos_mas_vendidos.map((p, i) => {
              const qty = parseFloat(p.cantidad_vendida);
              const pct = topProductMax > 0 ? (qty / topProductMax) * 100 : 0;
              return (
                <li key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-slate-700 max-w-[60%]">{p.descripcion}</span>
                    <span className="text-slate-400 shrink-0">{qty.toFixed(0)} uds · {usd(p.total_vendido)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-xs text-slate-500">Productos activos</span>
            <span className="text-xs font-bold text-slate-700">
              {data.clientes_productos.productos_activos}/{data.clientes_productos.productos_total}
            </span>
          </div>
        </div>

        {/* ── Col 3: Actividad Reciente ────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={<Activity className="h-4 w-4" />}
            title="Actividad Reciente"
          />
          <ul className="divide-y divide-slate-50 space-y-0">
            {data.documentos.recientes.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-700">{r.tipo}</span>
                    <StatusBadge status={r.estado} />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {r.destinatario}
                  </p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                    {r.numero_comprobante}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-slate-400 capitalize">
                    {fmtDateRelative(r.created_at)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {usd(r.total)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      </div>
    </motion.div>
  );
}
