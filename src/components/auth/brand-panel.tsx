"use client"

import { motion } from "framer-motion"

const items = [
  { icon: "hub", text: "Centraliza la operación y mantén todo bajo control en un solo entorno." },
  { icon: "receipt_long", text: "Emite facturas electrónicas, notas de crédito y débito en minutos." },
  { icon: "inventory_2", text: "Controla productos, clientes, proveedores y puntos de emisión desde un solo lugar." },
  { icon: "groups", text: "Administra equipos, permisos y usuarios con trazabilidad completa." },
  { icon: "analytics", text: "Consulta reportes e impuestos con paneles listos para auditoría." },
]

function BrandContent({ variant }: { variant: "register" | "login" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="auth-brand-content relative z-10 max-w-xl px-10 text-white"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl font-bold leading-tight tracking-tight xl:text-5xl"
      >
        {variant === "register" ? (
          <>
            Únete a la plataforma que{" "}
            <span className="text-[#7BCBF0]">transforma tu facturación.</span>
          </>
        ) : (
          <>
            Gestión de facturación{" "}
            <span className="text-[#7BCBF0]">lista para escalar.</span>
          </>
        )}
      </motion.h2>

      <motion.ul
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
        }}
        className="mt-6 space-y-4 xl:mt-8 xl:space-y-6"
      >
        {items.map((item, i) => (
          <motion.li
            key={i}
            variants={{
              hidden: { opacity: 0, x: -30 },
              visible: { opacity: 1, x: 0 },
            }}
            className="group flex items-start gap-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors group-hover:bg-white/20">
              <span className="material-symbols-outlined text-white">{item.icon}</span>
            </div>
            <p className="pt-1 text-sm xl:text-base">{item.text}</p>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  )
}

interface BrandPanelProps {
  variant: "register" | "login"
}

export function BrandPanel({ variant }: BrandPanelProps) {
  return (
    <section className="auth-brand relative hidden w-1/2 flex-col items-center justify-center overflow-hidden lg:flex">
      <div className="absolute inset-0 z-0">
        <img
          src="/fondo1-login.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00517C]/95 via-[#00517C]/80 to-[#00517C]/60" />
        <div className="absolute right-0 top-0 h-96 w-96 -mr-48 -mt-48 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -mb-32 -ml-32 rounded-full bg-[#0967A4]/10 blur-2xl" />
      </div>
      <BrandContent variant={variant} />
    </section>
  )
}
