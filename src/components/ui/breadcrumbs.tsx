import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-[13px] font-medium leading-none text-slate-500">
        {items.map((item, index) => {
          const isActive = index === items.length - 1;
          const baseClasses = "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors";
          const toneClasses = isActive
            ? "bg-app-primary text-white font-semibold"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200";

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <ChevronRight className="h-4 w-4 text-slate-300" />
              ) : null}
              {item.href ? (
                <a href={item.href} className={`${baseClasses} ${toneClasses}`}>
                  {index === 0 ? <Home className="h-3 w-3" /> : null}
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button type="button" onClick={item.onClick} className={`${baseClasses} ${toneClasses}`}>
                  {index === 0 ? <Home className="h-3 w-3" /> : null}
                  {item.label}
                </button>
              ) : (
                <span className={`${baseClasses} ${toneClasses}`}>
                  {index === 0 ? <Home className="h-3 w-3" /> : null}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
