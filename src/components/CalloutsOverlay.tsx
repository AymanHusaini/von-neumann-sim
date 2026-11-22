import React from 'react';
import { CALLOUTS_DATA, CalloutItem } from '../data/curriculum';
import { ProjectedCallout } from '../scene/PcSceneManager';

interface CalloutsOverlayProps {
  visible: boolean;
  projectedCallouts: ProjectedCallout[];
  selectedPinId: string | null;
  onSelectCallout: (item: CalloutItem) => void;
}

export const CalloutsOverlay: React.FC<CalloutsOverlayProps> = ({
  visible,
  projectedCallouts,
  selectedPinId,
  onSelectCallout,
}) => {
  if (!visible) return null;

  const projMap = new Map(projectedCallouts.map((c) => [c.id, c]));

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden" aria-label="Pin Komponen 3D">
      {CALLOUTS_DATA.map((item) => {
        const proj = projMap.get(item.id);
        if (!proj || !proj.visible) return null;

        const isSelected = selectedPinId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCallout(item);
            }}
            style={{
              left: `${proj.x}px`,
              top: `${proj.y}px`,
              opacity: proj.faded ? 0.25 : 1,
            }}
            className="group absolute -translate-x-1/2 -translate-y-full pointer-events-auto flex flex-col items-center transition-opacity duration-200 cursor-pointer focus:outline-none"
          >
            <span
              className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-md transition-transform duration-150 ${
                isSelected
                  ? 'border-sky-600 bg-sky-600 text-white -translate-y-0.5'
                  : 'border-sky-500/40 bg-white/95 text-slate-900 group-hover:border-sky-600 group-hover:bg-sky-600 group-hover:text-white group-hover:-translate-y-0.5'
              }`}
            >
              {item.label}
            </span>
            <span className="h-4 w-[1.5px] bg-gradient-to-b from-sky-500/85 to-sky-500/20" />
            <span className="h-2.5 w-2.5 rounded-full border-2 border-sky-600 bg-white shadow-[0_0_0_3px_rgba(14,165,233,0.22)]" />
          </button>
        );
      })}
    </div>
  );
};
