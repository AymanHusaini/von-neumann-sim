import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pause, Play } from 'lucide-react';

interface BottomDockProps {
  activeStep: number;
  timelineProgress: number;
  isPlaying: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSelectStep: (step: number) => void;
  onScrubStart: () => void;
  onScrub: (val: number) => void;
  onScrubEnd: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeStep,
  timelineProgress,
  isPlaying,
  collapsed,
  onToggleCollapse,
  onPrev,
  onNext,
  onTogglePlay,
  onSelectStep,
  onScrubStart,
  onScrub,
  onScrubEnd,
}) => {
  const pct = Math.max(0, Math.min(100, (timelineProgress / 8) * 100));
  const pctFormatted = pct.toFixed(1).replace('.0', '');

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-20 -translate-x-1/2 w-[min(920px,calc(100vw-32px))] transition-transform duration-300 ease-out pointer-events-none ${
        collapsed ? 'translate-y-[calc(100%+4px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand Handle */}
      <div className="flex justify-center mb-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 rounded-t-xl border border-b-0 border-sky-500/20 bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:text-sky-700 cursor-pointer"
        >
          {collapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Buka Kawalan Pemasangan</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Sembunyi Kawalan</span>
            </>
          )}
        </button>
      </div>

      <footer className="flex flex-col gap-2.5 rounded-2xl border border-sky-500/20 bg-white/95 px-4 py-3 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.12)] pointer-events-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Navigation Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={activeStep <= 0}
              className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-sky-500 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Langkah Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                  : 'border border-slate-200 bg-white text-slate-800 hover:border-sky-500 hover:text-sky-700'
              }`}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Jeda' : 'Main'}</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={activeStep >= 8}
              className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Langkah Seterusnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Step Selector Buttons 1-8 */}
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Pemilih Langkah 1 hingga 8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
              const isActive = step === activeStep;
              const isCompleted = step < activeStep;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onSelectStep(step)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border font-mono-tabular text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'border-sky-600 bg-sky-600 text-white shadow-sm scale-105'
                      : isCompleted
                        ? 'border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700'
                  }`}
                >
                  {step}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3">
          <span className="min-w-[72px] whitespace-nowrap font-mono-tabular text-[11px] font-semibold text-slate-500">
            0% Kosong
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={pct}
            aria-label="Kemajuan Pemasangan"
            onPointerDown={onScrubStart}
            onPointerUp={onScrubEnd}
            onChange={(e) => {
              const val = (parseFloat(e.target.value) / 100) * 8;
              onScrub(val);
            }}
            style={{
              background: `linear-gradient(90deg, #0ea5e9 ${pct}%, #cbd5e1 ${pct}%)`,
            }}
            className="studio-slider w-full"
          />
          <span className="min-w-[92px] whitespace-nowrap text-right font-mono-tabular text-[11px] font-semibold text-sky-700">
            {pctFormatted}% Lengkap
          </span>
        </div>
      </footer>
    </div>
  );
};
