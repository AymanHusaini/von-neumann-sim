import React from 'react';
import { Cpu, Eye, EyeOff, MapPin, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { CAMERA_PRESETS, CameraPresetKey, ViewMode } from '../data/curriculum';

interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeCamPreset: CameraPresetKey | null;
  onSelectCamPreset: (preset: CameraPresetKey) => void;
  pinsVisible: boolean;
  onTogglePins: () => void;
  infoOpen: boolean;
  onToggleInfo: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
}

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'assembly', label: 'Pemasangan' },
  { key: 'xray', label: 'Mod X-Ray' },
  { key: 'vonneumann', label: 'Aliran Data Von Neumann' },
];

const CAMERA_KEYS: CameraPresetKey[] = ['full', 'cpu_ram', 'storage_io', 'psu_cable', 'top'];

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onViewModeChange,
  activeCamPreset,
  onSelectCamPreset,
  pinsVisible,
  onTogglePins,
  infoOpen,
  onToggleInfo,
  zenMode,
  onToggleZen,
}) => {
  return (
    <header className="fixed top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-500/20 bg-white/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.12)] pointer-events-auto">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-sky-400 text-white shadow-sm"
          aria-hidden="true"
        >
          <Cpu className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-slate-900">
            Simulator Pemasangan PC &amp; Seni Bina Von Neumann
          </h1>
          <p className="truncate text-[11px] font-medium text-slate-500">
            Visualisasi Perkakasan ATX Interaktif 3D · 8 Langkah Pemasangan
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Segmented Mode Control */}
        <div
          className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/90 p-1"
          role="tablist"
          aria-label="Mod Paparan"
        >
          {VIEW_MODES.map((m) => {
            const active = viewMode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onViewModeChange(m.key)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/80 hover:text-sky-700'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Camera Presets */}
        <div className="hidden xl:flex items-center gap-1" aria-label="Pratetap Kamera">
          {CAMERA_KEYS.map((key) => {
            const active = activeCamPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectCamPreset(key)}
                className={`whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'border-sky-600 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
                }`}
              >
                {CAMERA_PRESETS[key].label}
              </button>
            );
          })}
        </div>

        {/* 3D Pins Toggle */}
        <button
          type="button"
          onClick={onTogglePins}
          aria-pressed={pinsVisible}
          title="Tunjuk atau Sembunyi Pin Label 3D"
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors cursor-pointer ${
            pinsVisible
              ? 'border-sky-500/35 bg-sky-50/80 text-sky-700 hover:bg-sky-100/70'
              : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Pin 3D</span>
        </button>

        {/* Toggle Right Education Panel */}
        <button
          type="button"
          onClick={onToggleInfo}
          aria-pressed={infoOpen}
          title={infoOpen ? 'Sembunyi Panel Nota' : 'Papar Panel Nota'}
          className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-700 cursor-pointer"
        >
          {infoOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Nota</span>
        </button>

        {/* Zen / Fullscreen Inspection Toggle */}
        <button
          type="button"
          onClick={onToggleZen}
          aria-pressed={zenMode}
          title="Sembunyi atau Papar Kawalan (Kekunci H)"
          className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-700 cursor-pointer"
        >
          {zenMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span className="hidden md:inline">{zenMode ? 'Papar HUD' : 'Fokus 3D'}</span>
        </button>
      </div>
    </header>
  );
};
