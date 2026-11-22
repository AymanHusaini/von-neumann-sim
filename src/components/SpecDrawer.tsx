import React from 'react';
import { X } from 'lucide-react';
import { CalloutItem } from '../data/curriculum';

interface SpecDrawerProps {
  item: CalloutItem | null;
  onClose: () => void;
}

export const SpecDrawer: React.FC<SpecDrawerProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed top-[86px] left-4 z-22 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl border border-sky-500/25 bg-white/95 p-4 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.14)] pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-wide text-sky-700">{item.tag}</div>
          <h3 className="mt-0.5 text-[15px] font-bold leading-snug text-slate-900">
            {item.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Spesifikasi"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-600 select-text">
        {item.body}
      </p>

      <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-200/80 pt-2.5">
        {item.specs.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 text-[11.5px]">
            <span className="text-slate-500 shrink-0">{label}</span>
            <span className="text-right font-semibold text-slate-900 font-mono-tabular">
              {value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
};
