import React from 'react';
import { BookOpen, Monitor } from 'lucide-react';
import { StepItem, ViewMode, VON_NEUMANN_NODES } from '../data/curriculum';

interface EducationPanelProps {
  visible: boolean;
  stepData: StepItem;
  viewMode: ViewMode;
}

export const EducationPanel: React.FC<EducationPanelProps> = ({
  visible,
  stepData,
  viewMode,
}) => {
  if (!visible) return null;

  const pct = ((stepData.step / 8) * 100).toFixed(1).replace('.0', '');
  const stepLabel =
    stepData.step === 0 ? 'Tapak Asas (0 / 8)' : `Langkah ${stepData.step} / 8`;

  return (
    <aside
      aria-live="polite"
      className="hud-scroll fixed top-[84px] right-4 z-20 flex w-[356px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-215px)] flex-col gap-3.5 overflow-y-auto rounded-2xl border border-sky-500/20 bg-white/95 p-4.5 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.12)] pointer-events-auto max-md:top-auto max-md:bottom-[140px] max-md:left-4 max-md:right-4 max-md:w-auto max-md:max-h-[200px]"
    >
      {/* Unboxed clean metadata line (zero-pill discipline) */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-sky-700">{stepLabel}</span>
        <span className="font-mono-tabular font-semibold text-slate-500">{pct}% lengkap</span>
      </div>

      <h2 className="text-[16px] font-bold leading-snug text-slate-900 [text-wrap:balance]">
        {stepData.title}
      </h2>

      {/* Penerangan Pemasangan */}
      <div className="border-t border-slate-200/80 pt-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500">
          <BookOpen className="h-3.5 w-3.5 text-sky-600" />
          <span>Penerangan Pemasangan</span>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-700 select-text">{stepData.desc}</p>
      </div>

      {/* Peranan Seni Bina Von Neumann */}
      <div className="rounded-xl border border-sky-500/25 bg-sky-50/75 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-sky-700">
          <Monitor className="h-3.5 w-3.5 text-sky-600" />
          <span>Peranan Seni Bina Von Neumann</span>
        </div>
        <p className="text-[12.5px] leading-relaxed font-medium text-sky-950 select-text">
          {stepData.vnRole}
        </p>

        {/* Mini Von Neumann Architecture Diagram */}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {VON_NEUMANN_NODES.map((node) => {
            const active = stepData.vnNodes.includes(node.key);
            return (
              <div
                key={node.key}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10.5px] font-semibold transition-colors ${
                  active
                    ? 'border-sky-600 bg-white text-sky-700 shadow-xs'
                    : 'border-slate-200/80 bg-white/60 text-slate-500'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    active ? 'bg-sky-500' : 'bg-slate-300'
                  }`}
                />
                <span className="truncate">{node.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Von Neumann Mode Legend */}
      {viewMode === 'vonneumann' && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-sky-500/25 bg-slate-50 p-3">
          <div className="text-[11px] font-bold tracking-wide text-slate-600">
            Petunjuk Aliran Data 3D
          </div>
          <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-700">
            <span className="h-3 w-3 shrink-0 rounded bg-[#00e5ff]" />
            <span>Isyarat Kawalan &amp; Bas Sistem (CU ↔ Komponen)</span>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-700">
            <span className="h-3 w-3 shrink-0 rounded bg-emerald-500" />
            <span>Aliran Data &amp; Arahan (RAM ↔ CPU / ALU)</span>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-700">
            <span className="h-3 w-3 shrink-0 rounded bg-amber-500" />
            <span>Aliran I/O &amp; Storan Sekunder (HDD/SSD ↔ I/O)</span>
          </div>
        </div>
      )}
    </aside>
  );
};
