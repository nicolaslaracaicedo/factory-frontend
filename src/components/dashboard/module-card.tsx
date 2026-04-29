import { ArrowUpRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
}

export function ModuleCard({ title, description }: ModuleCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="rounded-lg bg-sky-50 p-1 text-sky-700">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </article>
  );
}
