import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomDock } from './components/BottomDock';
import { CalloutsOverlay } from './components/CalloutsOverlay';
import { EducationPanel } from './components/EducationPanel';
import { SpecDrawer } from './components/SpecDrawer';
import { TopBar } from './components/TopBar';
import {
  CAMERA_PRESETS,
  CalloutItem,
  CameraPresetKey,
  STEPS_DATA,
  ViewMode,
} from './data/curriculum';
import { PcSceneManager, ProjectedCallout } from './scene/PcSceneManager';
import { playClickSound } from './utils/audio';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<PcSceneManager | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [activeStep, setActiveStep] = useState(1);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('assembly');
  const [activeCamPreset, setActiveCamPreset] = useState<CameraPresetKey | null>('full');
  const [pinsVisible, setPinsVisible] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [selectedCallout, setSelectedCallout] = useState<CalloutItem | null>(null);
  const [projectedCallouts, setProjectedCallouts] = useState<ProjectedCallout[]>([]);
  const [toastText, setToastText] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const showToast = useCallback((text: string) => {
    setToastText(text);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
    }, 1500);
  }, []);

  // Mount Three.js scene once in isolated ref container
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const manager = new PcSceneManager(mount, {
      onTimelineProgress: (val) => setTimelineProgress(val),
      onStepChange: (step) => setActiveStep(step),
      onPlayStateChange: (playing) => setIsPlaying(playing),
      onRamClick: () => {
        playClickSound(860, 0.04);
        showToast('KLIK! Kunci slot RAM tertutup rapat.');
      },
      onCalloutsUpdate: (callouts) => setProjectedCallouts(callouts),
      onContextLostChange: (lost) => setContextLost(lost),
    });

    sceneManagerRef.current = manager;

    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, [showToast]);

  const handleSelectStep = useCallback((step: number) => {
    const manager = sceneManagerRef.current;
    if (!manager) return;
    manager.setPlaying(false);
    manager.goToStep(step, true);
    setActiveCamPreset(null);
    playClickSound(540, 0.035);
  }, []);

  const handlePrev = useCallback(() => {
    handleSelectStep(Math.max(0, activeStep - 1));
  }, [activeStep, handleSelectStep]);

  const handleNext = useCallback(() => {
    handleSelectStep(Math.min(8, activeStep + 1));
  }, [activeStep, handleSelectStep]);

  const handleTogglePlay = useCallback(() => {
    const manager = sceneManagerRef.current;
    if (!manager) return;
    manager.setPlaying(!isPlaying);
  }, [isPlaying]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    const manager = sceneManagerRef.current;
    if (!manager) return;
    manager.setViewMode(mode);
    if (mode === 'vonneumann') {
      manager.focusCamera(CAMERA_PRESETS.full);
      setActiveCamPreset('full');
    }
    playClickSound(620, 0.035);
  }, []);

  const handleSelectCamPreset = useCallback((preset: CameraPresetKey) => {
    setActiveCamPreset(preset);
    const manager = sceneManagerRef.current;
    if (!manager) return;
    manager.focusCamera(CAMERA_PRESETS[preset]);
  }, []);

  const handleSelectCallout = useCallback((item: CalloutItem) => {
    setSelectedCallout(item);
    setActiveCamPreset(null);
    sceneManagerRef.current?.focusCamera(item.camera);
    playClickSound(720, 0.04);
  }, []);

  const handleToggleZen = useCallback(() => {
    setZenMode((prev) => !prev);
  }, []);

  // Keyboard shortcuts (H: toggle HUD focus, Left/Right: steps, Space: play/pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setZenMode((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, handleTogglePlay]);

  const currentStepData = STEPS_DATA[activeStep] ?? STEPS_DATA[1];

  return (
    <main className="relative h-full w-full overflow-hidden select-none">
      {/* Dedicated WebGL Mount Container */}
      <div ref={canvasMountRef} className="fixed inset-0 z-[1] h-full w-full" />

      {/* WebGL Context Lost Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/95 p-6">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg">
            <h2 className="text-base font-bold text-slate-900">
              Konteks Grafik 3D Tergendala
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Pemapar WebGL sedang dipulihkan. Muat semula halaman jika paparan 3D tidak muncul secara automatik.
            </p>
          </div>
        </div>
      )}

      {/* Projected 3D Callout Pins */}
      <CalloutsOverlay
        visible={pinsVisible && !zenMode}
        projectedCallouts={projectedCallouts}
        selectedPinId={selectedCallout?.id ?? null}
        onSelectCallout={handleSelectCallout}
      />

      {/* Micro-Toast Feedback (e.g. RAM Click) */}
      {toastText && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[88px] left-1/2 z-30 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg pointer-events-none"
        >
          {toastText}
        </div>
      )}

      {/* Top Navigation & Mode Bar */}
      <TopBar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        activeCamPreset={activeCamPreset}
        onSelectCamPreset={handleSelectCamPreset}
        pinsVisible={pinsVisible}
        onTogglePins={() => setPinsVisible((v) => !v)}
        infoOpen={infoOpen}
        onToggleInfo={() => setInfoOpen((v) => !v)}
        zenMode={zenMode}
        onToggleZen={handleToggleZen}
      />

      {/* Left Component Specification Drawer */}
      {!zenMode && (
        <SpecDrawer item={selectedCallout} onClose={() => setSelectedCallout(null)} />
      )}

      {/* Right Educational Panel */}
      <EducationPanel
        visible={infoOpen && !zenMode}
        stepData={currentStepData}
        viewMode={viewMode}
      />

      {/* Bottom Timeline & Step Dock */}
      {!zenMode && (
        <BottomDock
          activeStep={activeStep}
          timelineProgress={timelineProgress}
          isPlaying={isPlaying}
          collapsed={dockCollapsed}
          onToggleCollapse={() => setDockCollapsed((c) => !c)}
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={handleTogglePlay}
          onSelectStep={handleSelectStep}
          onScrubStart={() => {
            sceneManagerRef.current?.setPlaying(false);
            sceneManagerRef.current?.setScrubbing(true);
          }}
          onScrub={(val) => sceneManagerRef.current?.scrubTo(val)}
          onScrubEnd={() => sceneManagerRef.current?.setScrubbing(false)}
        />
      )}
    </main>
  );
}
