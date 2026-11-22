import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CALLOUTS_DATA, CameraTarget, STEPS_DATA, ViewMode } from '../data/curriculum';
import { buildPcModel, CableHandle, disposeSceneResources, PcModelHandles } from './pcModel';
import { createContactShadowTexture } from './textures';

export interface ProjectedCallout {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  faded: boolean;
}

export interface SceneCallbacks {
  onTimelineProgress: (val: number) => void;
  onStepChange: (step: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onRamClick: () => void;
  onCalloutsUpdate: (callouts: ProjectedCallout[]) => void;
  onContextLostChange: (lost: boolean) => void;
}

// Pre-allocated math helpers (zero GC in render loop)
const _projVec = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class PcSceneManager {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private envRenderTarget: THREE.WebGLRenderTarget;
  private model: PcModelHandles;
  private clock = new THREE.Clock();

  private frameId = 0;
  private disposed = false;

  // Timeline & playback state
  private currentTimeline = 0.0;
  private targetTimeline = 1.0;
  private activeStepIndex = 1;
  private isPlaying = false;
  private playPauseTimer = 0;
  private isUserScrubbing = false;
  private viewMode: ViewMode = 'assembly';

  // Camera damping transition
  private camTransitionActive = false;

  // RAM snap sound trigger
  private ramClickPlayed = false;
  private lastRamProgress = 0;

  // Callout world vectors preallocated
  private calloutWorldVectors: { id: string; minStep: number; vec: THREE.Vector3 }[];

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xeaf0f7, 0.022);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    this.camera.position.set(3.15, 3.45, 5.15);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Studio IBL using RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 1.1;
    this.controls.maxDistance = 10.5;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.target.set(-0.1, 2.4, -0.15);
    this.controls.addEventListener('start', () => {
      this.camTransitionActive = false;
    });

    // Balanced 3-point warm/cool studio lighting + HemisphereLight
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xcbd5e1, 0.6);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.0);
    keyLight.position.set(4.5, 7.5, 5.5);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -4.2;
    keyLight.shadow.camera.right = 4.2;
    keyLight.shadow.camera.top = 5.2;
    keyLight.shadow.camera.bottom = -1.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.015;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.85);
    fillLight.position.set(-5.0, 4.0, 3.5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.72);
    rimLight.position.set(-2.0, 5.5, -5.0);
    this.scene.add(rimLight);

    // Studio floor + soft contact shadow grounding plane + subtle grid
    const floorMesh = new THREE.Mesh(
      new THREE.CircleGeometry(24, 64),
      new THREE.MeshStandardMaterial({ color: 0xeef3f8, roughness: 0.92, metalness: 0.02 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    const contactShadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 4.2),
      new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    );
    contactShadowPlane.rotation.x = -Math.PI / 2;
    contactShadowPlane.position.set(-0.05, 0.008, 0);
    this.scene.add(contactShadowPlane);

    const gridHelper = new THREE.GridHelper(10, 20, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = 0.004;
    const gridMat = gridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.42;
    this.scene.add(gridHelper);

    // Build 3D PC model
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.model = buildPcModel(maxAniso);
    this.scene.add(this.model.pcRoot);

    this.calloutWorldVectors = CALLOUTS_DATA.map((c) => ({
      id: c.id,
      minStep: c.minStep,
      vec: new THREE.Vector3(c.worldPos[0], c.worldPos[1], c.worldPos[2]),
    }));

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // WebGL context loss/restore listeners
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
    window.addEventListener('resize', this.handleResize);

    // Initialize cleanly at Step 1
    this.goToStep(1, true);
    this.tick();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLostChange(true);
  };

  private handleContextRestored = () => {
    this.callbacks.onContextLostChange(false);
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  };

  public focusCamera(cam: CameraTarget): void {
    _camGoalPos.set(cam.pos[0], cam.pos[1], cam.pos[2]);
    _camGoalTarget.set(cam.target[0], cam.target[1], cam.target[2]);
    this.camTransitionActive = true;
  }

  public goToStep(stepNum: number, autoFocusCamera = true): void {
    const clamped = Math.max(0, Math.min(8, stepNum));
    if (Math.abs(clamped - this.currentTimeline) > 1.25 && clamped > 0) {
      this.currentTimeline = clamped - 0.98;
    }
    this.targetTimeline = clamped;
    this.activeStepIndex = clamped;
    this.callbacks.onStepChange(clamped);
    if (autoFocusCamera && STEPS_DATA[clamped]) {
      this.focusCamera(STEPS_DATA[clamped].camera);
    }
  }

  public setScrubbing(scrubbing: boolean): void {
    this.isUserScrubbing = scrubbing;
  }

  public scrubTo(timelineVal: number): void {
    const clamped = Math.max(0, Math.min(8, timelineVal));
    this.currentTimeline = clamped;
    this.targetTimeline = clamped;
    const nearestStep = Math.max(0, Math.min(8, Math.ceil(clamped - 0.001)));
    if (nearestStep !== this.activeStepIndex) {
      this.activeStepIndex = nearestStep;
      this.callbacks.onStepChange(nearestStep);
    }
    this.callbacks.onTimelineProgress(clamped);
  }

  public setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    if (playing && this.activeStepIndex >= 8) {
      this.currentTimeline = 0;
      this.goToStep(1, true);
    }
    this.playPauseTimer = 0;
    this.callbacks.onPlayStateChange(playing);
  }

  public setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    if (mode === 'vonneumann' && this.activeStepIndex < 8) {
      this.currentTimeline = 7.2;
      this.goToStep(8, false);
    }
  }

  private setCableDraw(cable: CableHandle, p: number): void {
    const segs = Math.floor(clamp01(p) * cable.tubularSegs);
    cable.mesh.visible = segs > 0;
    if (cable.totalIdx > 0) {
      cable.geo.setDrawRange(0, segs * cable.radialSegs * 6);
    }
  }

  private applyTimelineState(timelineVal: number, elapsedTime: number, dt: number): void {
    const m = this.model;
    const s1 = clamp01(timelineVal - 0);
    const s2 = clamp01(timelineVal - 1);
    const s3 = clamp01(timelineVal - 2);
    const s4 = clamp01(timelineVal - 3);
    const s5 = clamp01(timelineVal - 4);
    const s6 = clamp01(timelineVal - 5);
    const s7 = clamp01(timelineVal - 6);
    const s8 = clamp01(timelineVal - 7);

    // Step 1: Motherboard
    m.moboRoot.visible = s1 > 0.001;
    if (m.moboRoot.visible) {
      const moveP = easeOutCubic(clamp01(s1 / 0.78));
      m.moboRoot.position.set(
        m.moboTarget.x,
        m.moboTarget.y + (1 - moveP) * 0.45,
        m.moboTarget.z + (1 - moveP) * 1.65
      );
      const screwP = easeOutCubic(clamp01((s1 - 0.72) / 0.28));
      m.moboScrews.forEach((sc, idx) => {
        sc.visible = s1 > 0.72;
        const localP = clamp01(screwP * 1.4 - idx * 0.04);
        sc.position.z = (sc.userData.targetZ as number) + (1 - localP) * 0.28;
      });
    }

    // Step 2: CPU & Retention Socket
    if (s2 <= 0.001) {
      m.cpuGroup.visible = false;
      m.socketLeverPivot.rotation.x = 0;
      m.socketILM.rotation.x = 0;
    } else {
      m.cpuGroup.visible = s2 > 0.15;
      if (s2 < 0.28) {
        const openP = easeOutCubic(s2 / 0.28);
        m.socketLeverPivot.rotation.x = -openP * 1.55;
        m.socketILM.rotation.x = -openP * 1.25;
      } else if (s2 < 0.68) {
        m.socketLeverPivot.rotation.x = -1.55;
        m.socketILM.rotation.x = -1.25;
        const dropP = easeOutCubic((s2 - 0.28) / 0.4);
        m.cpuGroup.position.z = 0.055 + (1 - dropP) * 0.85;
      } else {
        m.cpuGroup.position.z = 0.055;
        const closeP = easeOutCubic((s2 - 0.68) / 0.32);
        m.socketLeverPivot.rotation.x = -1.55 * (1 - closeP);
        m.socketILM.rotation.x = -1.25 * (1 - closeP);
      }
    }

    // Step 3: CPU Cooler & 4-pin Cable
    m.coolerGroup.visible = s3 > 0.001;
    if (m.coolerGroup.visible) {
      const dropP = easeOutCubic(clamp01(s3 / 0.72));
      m.coolerGroup.position.z = 0.11 + (1 - dropP) * 1.35;
      const cabP = clamp01((s3 - 0.62) / 0.38);
      const segs = Math.floor(cabP * 24);
      m.fanCableMesh.visible = segs > 0;
      if (m.fanCableTotalIdx > 0) m.fanCableGeo.setDrawRange(0, segs * 8 * 6);
    } else {
      m.fanCableMesh.visible = false;
    }
    if (s3 > 0.9) {
      const rpm = s7 >= 0.9 ? 14.0 : 5.5;
      m.fanRotor.rotation.z -= dt * rpm;
    }

    // Step 4: RAM Sticks & Auto-locking Latches
    m.ramSticks.forEach((ram, idx) => {
      const localS = clamp01(s4 * 1.15 - idx * 0.12);
      ram.visible = localS > 0.05;
      if (localS > 0.05) {
        const slideP = easeOutCubic(clamp01((localS - 0.15) / 0.65));
        ram.position.z = 0.22 + (1 - slideP) * 0.75;
      }
    });
    m.ramSlotLatches.forEach((pair, idx) => {
      const localS = clamp01(s4 * 1.15 - idx * 0.12);
      let latchAngle = 0;
      if (localS > 0.01 && localS < 0.25) {
        latchAngle = easeOutCubic(localS / 0.25) * 0.55;
      } else if (localS >= 0.25 && localS < 0.78) {
        latchAngle = 0.55;
      } else if (localS >= 0.78) {
        latchAngle = 0.55 * (1 - easeOutBack(clamp01((localS - 0.78) / 0.22)));
      }
      pair.top.rotation.x = -latchAngle;
      pair.bot.rotation.x = latchAngle;
    });
    if (this.lastRamProgress < 0.92 && s4 >= 0.92 && !this.ramClickPlayed) {
      this.ramClickPlayed = true;
      this.callbacks.onRamClick();
    }
    if (s4 < 0.5) this.ramClickPlayed = false;
    this.lastRamProgress = s4;

    // Step 5: Secondary Storage (HDD/SSD) + SATA/Power Cables
    m.hddGroup.visible = s5 > 0.001;
    m.ssdGroup.visible = s5 > 0.001;
    if (s5 > 0.001) {
      const hddP = easeOutCubic(clamp01(s5 / 0.45));
      const ssdP = easeOutCubic(clamp01((s5 - 0.12) / 0.45));
      m.hddGroup.position.z = -0.05 + (1 - hddP) * 1.15;
      m.ssdGroup.position.z = -0.05 + (1 - ssdP) * 1.15;
      m.hddPlatter.rotation.y += dt * 4.5;
    }
    const cab5P = clamp01((s5 - 0.5) / 0.5);
    m.step5Cables.forEach((c, idx) => {
      this.setCableDraw(c, clamp01(cab5P * 1.35 - idx * 0.12));
    });

    // Step 6: Front I/O Wires & Rear I/O Highlight
    m.step6Cables.forEach((c, idx) => {
      this.setCableDraw(c, clamp01(s6 * 1.25 - idx * 0.18));
    });
    if (s6 > 0.1 && s6 < 0.99) {
      m.materials.matRearIoPulse.emissiveIntensity = 0.4 + Math.sin(elapsedTime * 7.0) * 0.35;
    } else {
      m.materials.matRearIoPulse.emissiveIntensity = 0;
    }

    // Step 7: 24-Pin Power Cable & Status LEDs
    const cab7P = clamp01(s7 / 0.85);
    m.step7Cables.forEach((c) => this.setCableDraw(c, cab7P));
    m.plug24Pin.visible = s7 > 0.8;
    if (m.plug24Pin.visible) {
      const plugP = easeOutCubic(clamp01((s7 - 0.8) / 0.2));
      m.plug24Pin.position.z = -0.45 + (1 - plugP) * 0.16;
    }
    const powerOn = s7 >= 0.92 ? 1.0 : 0.0;
    m.materials.matLedCyan.emissiveIntensity =
      powerOn * (1.2 + Math.sin(elapsedTime * 3.0) * 0.25);
    m.materials.matLedGreen.emissiveIntensity = powerOn * 1.4;

    // Step 8 & View Modes (X-Ray / Von Neumann)
    this.applyViewModeAndStep8(s8, elapsedTime);
  }

  private applyViewModeAndStep8(s8: number, elapsedTime: number): void {
    const m = this.model;
    const isXray = this.viewMode === 'xray';
    const isVN = this.viewMode === 'vonneumann';
    const step8Reveal = s8 > 0.15;
    const useFullXray = isXray || isVN;

    m.xrayManagedMaterials.forEach((item) => {
      const isCoolerOrIhs =
        item.mat === m.materials.matHeatsinkFin ||
        item.mat === m.materials.matHeatsinkDark ||
        item.mat === m.materials.fanFrame ||
        item.mat === m.materials.bladeMat ||
        item.mat === m.materials.matIhs;

      if (useFullXray) {
        item.mat.transparent = true;
        item.mat.opacity = item.xrayOpacity;
        item.mat.depthWrite = false;
      } else if (step8Reveal && isCoolerOrIhs) {
        const blend = clamp01((s8 - 0.15) / 0.45);
        item.mat.transparent = blend > 0.02;
        item.mat.opacity = 1.0 - blend * (1.0 - 0.16);
        item.mat.depthWrite = blend < 0.3;
      } else {
        item.mat.transparent = item.origTransparent;
        item.mat.opacity = item.origOpacity;
        item.mat.depthWrite = item.origDepthWrite;
      }
    });

    const cuHighlight = isXray || isVN || step8Reveal ? 1.0 : 0.0;
    const pulse = 0.65 + 0.35 * Math.sin(elapsedTime * 4.2);

    m.materials.matCuGlow.opacity = cuHighlight * 0.55;
    m.materials.matCuGlow.emissiveIntensity = cuHighlight * 1.8 * pulse;
    m.materials.siliconDieMat.emissiveIntensity = 0.3 + cuHighlight * 1.1;

    m.materials.matNorthGlow.opacity = cuHighlight * 0.52;
    m.materials.matNorthGlow.emissiveIntensity = cuHighlight * 1.5 * pulse;

    m.materials.matSouthGlow.opacity = cuHighlight * 0.52;
    m.materials.matSouthGlow.emissiveIntensity = cuHighlight * 1.5 * pulse;

    const showFlows = isVN || s8 > 0.45;
    m.vnGroup.visible = showFlows;
    if (showFlows) {
      m.vnLineMeshes.forEach((lineMesh) => {
        (lineMesh.material as THREE.MeshBasicMaterial).opacity = isVN
          ? 0.42
          : 0.25 * clamp01((s8 - 0.45) / 0.55);
      });
      m.vnParticles.forEach((p) => {
        const t = (p.offset + elapsedTime * p.speed * 0.32) % 1.0;
        p.curve.getPointAt(t, p.mesh.position);
        p.mesh.scale.setScalar(isVN ? 1.0 : 0.85);
      });
    }
  }

  private projectCallouts(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const projected: ProjectedCallout[] = this.calloutWorldVectors.map((c) => {
      const installed = this.currentTimeline >= c.minStep - 0.15;
      if (!installed) {
        return { id: c.id, x: 0, y: 0, visible: false, faded: false };
      }
      _projVec.copy(c.vec).project(this.camera);
      if (_projVec.z > 1 || _projVec.z < -1) {
        return { id: c.id, x: 0, y: 0, visible: false, faded: false };
      }
      const x = (_projVec.x * 0.5 + 0.5) * w;
      const y = (-_projVec.y * 0.5 + 0.5) * h;
      const faded = x < 20 || x > w - 20 || y < 70 || y > h - 90;
      return { id: c.id, x, y, visible: true, faded };
    });
    this.callbacks.onCalloutsUpdate(projected);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private tick = (): void => {
    if (this.disposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();

    // Smooth timeline interpolation
    if (!this.isUserScrubbing) {
      const diff = this.targetTimeline - this.currentTimeline;
      if (Math.abs(diff) > 0.001) {
        const stepRate = dt * 0.95;
        if (Math.abs(diff) <= stepRate) {
          this.currentTimeline = this.targetTimeline;
        } else {
          this.currentTimeline += Math.sign(diff) * stepRate;
        }
        this.callbacks.onTimelineProgress(this.currentTimeline);
      } else {
        this.currentTimeline = this.targetTimeline;
      }
    }

    // Auto-play progression
    if (this.isPlaying) {
      if (Math.abs(this.targetTimeline - this.currentTimeline) < 0.01) {
        this.playPauseTimer += dt;
        if (this.playPauseTimer >= 2.6) {
          this.playPauseTimer = 0;
          if (this.activeStepIndex < 8) {
            this.goToStep(this.activeStepIndex + 1, true);
          } else {
            this.setPlaying(false);
          }
        }
      }
    }

    // Exponentially damped camera transition (THREE.MathUtils.damp)
    if (this.camTransitionActive) {
      const lambda = 6.5;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camGoalPos.x, lambda, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camGoalPos.y, lambda, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camGoalPos.z, lambda, dt);

      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, _camGoalTarget.x, lambda, dt);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, _camGoalTarget.y, lambda, dt);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, _camGoalTarget.z, lambda, dt);

      if (
        this.camera.position.distanceToSquared(_camGoalPos) < 0.0004 &&
        this.controls.target.distanceToSquared(_camGoalTarget) < 0.0004
      ) {
        this.camTransitionActive = false;
      }
    }

    this.applyTimelineState(this.currentTimeline, elapsed, dt);
    this.controls.update();
    this.projectCallouts();
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.controls.dispose();
    disposeSceneResources(this.scene);
    this.envRenderTarget.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
