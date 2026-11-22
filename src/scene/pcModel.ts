import * as THREE from 'three';
import {
  createCpuIhsTexture,
  createDriveLabelTexture,
  createMotherboardTextures,
  createPsuLabelTexture,
  createSiliconDieTexture,
} from './textures';

export interface XrayManagedMaterial {
  mat: THREE.MeshStandardMaterial;
  origTransparent: boolean;
  origOpacity: number;
  origDepthWrite: boolean;
  xrayOpacity: number;
}

export interface CableHandle {
  mesh: THREE.Mesh;
  geo: THREE.TubeGeometry;
  tubularSegs: number;
  radialSegs: number;
  totalIdx: number;
}

export interface VnParticle {
  mesh: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
  offset: number;
  speed: number;
}

export interface PcModelHandles {
  pcRoot: THREE.Group;
  moboRoot: THREE.Group;
  moboTarget: THREE.Vector3;
  moboScrews: THREE.Mesh[];
  cpuGroup: THREE.Group;
  socketILM: THREE.Group;
  socketLeverPivot: THREE.Group;
  coolerGroup: THREE.Group;
  fanRotor: THREE.Group;
  fanCableMesh: THREE.Mesh;
  fanCableGeo: THREE.TubeGeometry;
  fanCableTotalIdx: number;
  ramSticks: THREE.Group[];
  ramSlotLatches: { top: THREE.Group; bot: THREE.Group }[];
  hddGroup: THREE.Group;
  hddPlatter: THREE.Mesh;
  ssdGroup: THREE.Group;
  step5Cables: CableHandle[];
  step6Cables: CableHandle[];
  step7Cables: CableHandle[];
  plug24Pin: THREE.Mesh;
  vnGroup: THREE.Group;
  vnParticles: VnParticle[];
  vnLineMeshes: THREE.Mesh[];
  xrayManagedMaterials: XrayManagedMaterial[];
  materials: {
    matHeatsinkFin: THREE.MeshStandardMaterial;
    matHeatsinkDark: THREE.MeshStandardMaterial;
    fanFrame: THREE.MeshStandardMaterial;
    bladeMat: THREE.MeshStandardMaterial;
    matIhs: THREE.MeshStandardMaterial;
    matRearIoPulse: THREE.MeshStandardMaterial;
    matLedCyan: THREE.MeshStandardMaterial;
    matLedGreen: THREE.MeshStandardMaterial;
    matCuGlow: THREE.MeshStandardMaterial;
    matNorthGlow: THREE.MeshStandardMaterial;
    matSouthGlow: THREE.MeshStandardMaterial;
    siliconDieMat: THREE.MeshPhysicalMaterial;
  };
}

export function buildPcModel(maxAnisotropy: number): PcModelHandles {
  const pcRoot = new THREE.Group();
  const xrayManagedMaterials: XrayManagedMaterial[] = [];

  function registerXrayMaterial<T extends THREE.MeshStandardMaterial>(
    mat: T,
    xrayOpacity = 0.16
  ): T {
    xrayManagedMaterials.push({
      mat,
      origTransparent: mat.transparent,
      origOpacity: mat.opacity,
      origDepthWrite: mat.depthWrite,
      xrayOpacity,
    });
    return mat;
  }

  const matCaseDark = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.46, metalness: 0.72 }),
    0.14
  );
  const matCaseInner = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x262f3d, roughness: 0.55, metalness: 0.62 }),
    0.14
  );
  const matBrushedSteel = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.28,
    metalness: 0.92,
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.22,
    metalness: 0.96,
  });
  const matCopper = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.28,
    metalness: 0.88,
  });
  const matBlackPlastic = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.58, metalness: 0.12 }),
    0.25
  );
  const matHeatsinkDark = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 }),
    0.18
  );
  const matHeatsinkFin = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.88 }),
    0.16
  );
  const matBlueAccent = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.34,
    metalness: 0.55,
  });
  const matLedCyan = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.0,
    roughness: 0.2,
  });
  const matLedGreen = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.0,
    roughness: 0.2,
  });
  const matCuGlow = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.0,
    roughness: 0.2,
    transparent: true,
    opacity: 0.0,
  });
  const matNorthGlow = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.0,
    roughness: 0.2,
    transparent: true,
    opacity: 0.0,
  });
  const matSouthGlow = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.0,
    roughness: 0.2,
    transparent: true,
    opacity: 0.0,
  });

  function addBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    cast = true,
    recv = true
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = recv;
    parent.add(mesh);
    return mesh;
  }

  // A. BASE CHASSIS (BEKAS / CASING ATX) & PRE-MOUNTED PSU
  const chassisGroup = new THREE.Group();
  pcRoot.add(chassisGroup);

  const footPositions: [number, number][] = [
    [-1.95, -0.75],
    [-1.95, 0.75],
    [1.85, -0.75],
    [1.85, 0.75],
  ];
  footPositions.forEach(([fx, fz]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.15, 20), matBrushedSteel);
    foot.position.set(fx, 0.075, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    chassisGroup.add(foot);
  });

  addBox(chassisGroup, 4.4, 0.07, 1.9, matCaseDark, -0.05, 0.185, 0);
  addBox(chassisGroup, 4.4, 0.07, 1.9, matCaseDark, -0.05, 4.615, 0);
  addBox(chassisGroup, 2.6, 0.02, 1.15, matCaseInner, -0.3, 4.655, 0);
  addBox(chassisGroup, 4.4, 4.44, 0.05, matCaseDark, -0.05, 2.4, -0.925);
  addBox(chassisGroup, 2.95, 3.35, 0.035, matCaseInner, -0.72, 2.85, -0.75);

  // Rear wall with cutouts
  addBox(chassisGroup, 0.05, 1.15, 1.9, matCaseDark, -2.225, 4.05, 0);
  addBox(chassisGroup, 0.05, 1.45, 0.95, matCaseDark, -2.225, 2.85, 0.46);
  addBox(chassisGroup, 0.05, 1.45, 0.25, matCaseDark, -2.225, 2.85, -0.8);
  addBox(chassisGroup, 0.05, 1.1, 0.35, matCaseDark, -2.225, 1.65, -0.45);

  const rearFanRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 12, 32), matCaseInner);
  rearFanRing.rotation.y = Math.PI / 2;
  rearFanRing.position.set(-2.16, 3.95, -0.1);
  chassisGroup.add(rearFanRing);

  // Front frame
  addBox(chassisGroup, 0.06, 4.44, 0.25, matCaseDark, 2.12, 2.4, -0.82);
  addBox(chassisGroup, 0.06, 4.44, 0.25, matCaseDark, 2.12, 2.4, 0.82);
  addBox(chassisGroup, 0.06, 0.45, 1.4, matCaseDark, 2.12, 4.38, 0);
  addBox(chassisGroup, 0.06, 0.45, 1.4, matCaseDark, 2.12, 0.42, 0);
  for (let y = 0.85; y <= 3.95; y += 0.38) {
    addBox(chassisGroup, 0.03, 0.06, 1.38, matCaseInner, 2.12, y, 0);
  }

  // Open side bezel rim
  addBox(chassisGroup, 4.4, 0.08, 0.06, matCaseDark, -0.05, 0.23, 0.92);
  addBox(chassisGroup, 4.4, 0.08, 0.06, matCaseDark, -0.05, 4.58, 0.92);
  addBox(chassisGroup, 0.08, 4.35, 0.06, matCaseDark, -2.21, 2.4, 0.92);
  addBox(chassisGroup, 0.08, 4.35, 0.06, matCaseDark, 2.11, 2.4, 0.92);

  // 9 Brass Motherboard Standoffs
  const standoffOffsets: [number, number][] = [
    [-1.08, -1.36],
    [0.0, -1.36],
    [1.08, -1.36],
    [-1.08, 0.0],
    [0.0, 0.0],
    [1.08, 0.0],
    [-1.08, 1.36],
    [0.0, 1.36],
    [1.08, 1.36],
  ];
  standoffOffsets.forEach(([ox, oy]) => {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.12, 6), matGold);
    st.rotation.x = Math.PI / 2;
    st.position.set(-0.85 + ox, 2.85 + oy, -0.675);
    chassisGroup.add(st);
  });

  // Drive cage
  addBox(chassisGroup, 0.03, 2.35, 1.15, matCaseInner, 0.95, 1.4, -0.05);
  addBox(chassisGroup, 0.03, 2.35, 1.15, matCaseInner, 2.02, 1.4, -0.05);
  addBox(chassisGroup, 1.07, 0.025, 1.12, matCaseDark, 1.485, 1.25, -0.05);
  addBox(chassisGroup, 1.07, 0.025, 1.12, matCaseDark, 1.485, 1.92, -0.05);

  // Front I/O Panel
  const frontIoPanel = new THREE.Group();
  frontIoPanel.position.set(1.98, 4.46, 0.0);
  chassisGroup.add(frontIoPanel);
  addBox(frontIoPanel, 0.28, 0.22, 1.28, matCaseInner, 0, 0, 0);
  const pwrBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 20), matBrushedSteel);
  pwrBtn.rotation.z = Math.PI / 2;
  pwrBtn.position.set(0.14, 0.02, 0.36);
  frontIoPanel.add(pwrBtn);
  const pwrRing = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.012, 8, 24), matLedCyan);
  pwrRing.rotation.y = Math.PI / 2;
  pwrRing.position.set(0.165, 0.02, 0.36);
  frontIoPanel.add(pwrRing);
  addBox(frontIoPanel, 0.04, 0.04, 0.14, matBlueAccent, 0.14, 0.02, 0.06);
  addBox(frontIoPanel, 0.04, 0.04, 0.14, matBlueAccent, 0.14, 0.02, -0.14);
  addBox(frontIoPanel, 0.04, 0.035, 0.035, matBlackPlastic, 0.14, 0.02, -0.35);
  addBox(frontIoPanel, 0.04, 0.035, 0.035, matLedGreen, 0.14, 0.02, -0.45);

  // Pre-mounted PSU
  const psuGroup = new THREE.Group();
  psuGroup.position.set(-1.5, 0.64, -0.06);
  chassisGroup.add(psuGroup);
  const psuBodyMat = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x181f2a, roughness: 0.42, metalness: 0.78 }),
    0.18
  );
  addBox(psuGroup, 1.36, 0.82, 1.24, psuBodyMat, 0, 0, 0);
  const psuSticker = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 0.52),
    new THREE.MeshStandardMaterial({
      map: createPsuLabelTexture(maxAnisotropy),
      roughness: 0.4,
    })
  );
  psuSticker.position.set(0, 0, 0.625);
  psuGroup.add(psuSticker);
  const psuCoil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 10, 24), matCopper);
  psuCoil.position.set(-0.2, 0.05, 0);
  psuGroup.add(psuCoil);
  addBox(psuGroup, 0.25, 0.42, 0.35, matHeatsinkFin, 0.25, -0.05, 0);

  // B. LANGKAH 1: PAPAN INDUK (MOTHERBOARD)
  const moboRoot = new THREE.Group();
  const moboTarget = new THREE.Vector3(-0.85, 2.85, -0.6);
  moboRoot.position.copy(moboTarget);
  pcRoot.add(moboRoot);

  const moboTextures = createMotherboardTextures(maxAnisotropy);
  const matPcb = registerXrayMaterial(
    new THREE.MeshStandardMaterial({
      map: moboTextures.map,
      roughnessMap: moboTextures.roughnessMap,
      roughness: 0.65,
      metalness: 0.18,
    }),
    0.48
  );

  addBox(moboRoot, 2.4, 3.0, 0.03, matPcb, 0, 0, 0);

  const moboScrews: THREE.Mesh[] = [];
  standoffOffsets.forEach(([ox, oy]) => {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12), matBrushedSteel);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(ox, oy, 0.035);
    screw.userData.targetZ = 0.025;
    moboRoot.add(screw);
    moboScrews.push(screw);
  });

  // Rear I/O Embedded Shield & Ports
  const rearIoGroup = new THREE.Group();
  rearIoGroup.position.set(-1.14, 0.22, 0.16);
  moboRoot.add(rearIoGroup);
  const matRearIoPulse = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.85,
    emissive: 0x00e5ff,
    emissiveIntensity: 0,
  });
  addBox(rearIoGroup, 0.22, 1.32, 0.28, matRearIoPulse, 0, 0, 0);
  addBox(rearIoGroup, 0.05, 0.18, 0.16, matBlueAccent, -0.11, 0.42, 0.02);
  addBox(rearIoGroup, 0.05, 0.18, 0.16, matBlueAccent, -0.11, 0.18, 0.02);
  addBox(rearIoGroup, 0.05, 0.16, 0.16, matGold, -0.11, -0.06, 0.02);
  addBox(rearIoGroup, 0.05, 0.22, 0.18, matBlackPlastic, -0.11, -0.34, 0.02);
  [-0.5, -0.57].forEach((ay, idx) => {
    const jack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.05, 12),
      idx === 0 ? matLedGreen : matBlueAccent
    );
    jack.rotation.z = Math.PI / 2;
    jack.position.set(-0.12, ay, 0.02);
    rearIoGroup.add(jack);
  });

  // VRM Heatsinks
  addBox(moboRoot, 0.18, 0.85, 0.16, matHeatsinkDark, -0.78, 0.68, 0.095);
  addBox(moboRoot, 0.65, 0.16, 0.15, matHeatsinkDark, -0.22, 1.14, 0.09);

  // Northbridge
  const northbridgeGroup = new THREE.Group();
  northbridgeGroup.position.set(-0.22, 0.06, 0.02);
  moboRoot.add(northbridgeGroup);
  addBox(northbridgeGroup, 0.22, 0.22, 0.03, matBrushedSteel, 0, 0, 0.015);
  addBox(northbridgeGroup, 0.26, 0.26, 0.04, matNorthGlow, 0, 0, 0.035, false, false);
  addBox(northbridgeGroup, 0.44, 0.28, 0.08, matHeatsinkDark, 0, 0, 0.07);
  addBox(northbridgeGroup, 0.38, 0.05, 0.02, matBlueAccent, 0, 0.07, 0.115);

  // Southbridge
  const southbridgeGroup = new THREE.Group();
  southbridgeGroup.position.set(0.52, -0.82, 0.02);
  moboRoot.add(southbridgeGroup);
  addBox(southbridgeGroup, 0.24, 0.24, 0.03, matBrushedSteel, 0, 0, 0.015);
  addBox(southbridgeGroup, 0.3, 0.3, 0.04, matSouthGlow, 0, 0, 0.035, false, false);
  addBox(southbridgeGroup, 0.48, 0.44, 0.08, matHeatsinkDark, 0, 0, 0.07);
  addBox(southbridgeGroup, 0.38, 0.06, 0.02, matBlueAccent, 0, -0.12, 0.115);

  // PCIe x16 Slots
  [-0.36, -0.78].forEach((py) => {
    addBox(moboRoot, 1.05, 0.09, 0.1, matBlackPlastic, -0.45, py, 0.065);
    addBox(moboRoot, 1.07, 0.105, 0.03, matBrushedSteel, -0.45, py, 0.03);
  });

  // SATA Headers
  for (let s = 0; s < 4; s++) {
    addBox(moboRoot, 0.14, 0.09, 0.1, matBlackPlastic, 1.08, -0.7 - s * 0.12, 0.065);
  }

  // 24-pin ATX Socket, CPU_FAN, F_PANEL & USB
  addBox(moboRoot, 0.14, 0.46, 0.12, matBlackPlastic, 1.06, 0.38, 0.075);
  addBox(moboRoot, 0.12, 0.05, 0.06, matBlackPlastic, -0.12, 1.32, 0.045);
  addBox(moboRoot, 0.36, 0.09, 0.08, matBlackPlastic, 0.52, -1.34, 0.055);
  addBox(moboRoot, 0.22, 0.09, 0.08, matBlueAccent, 0.08, -1.34, 0.055);

  // Motherboard Status LEDs
  addBox(moboRoot, 0.06, 0.42, 0.02, matLedCyan, 1.12, 0.02, 0.025, false, false);
  const moboPwrLed = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), matLedGreen);
  moboPwrLed.position.set(0.85, -1.34, 0.04);
  moboRoot.add(moboPwrLed);

  // CPU Socket Base
  const cpuSocketGroup = new THREE.Group();
  cpuSocketGroup.position.set(-0.25, 0.65, 0.02);
  moboRoot.add(cpuSocketGroup);
  addBox(cpuSocketGroup, 0.56, 0.56, 0.04, matBlackPlastic, 0, 0, 0.02);
  addBox(cpuSocketGroup, 0.44, 0.44, 0.015, matGold, 0, 0, 0.042);

  const socketILM = new THREE.Group();
  socketILM.position.set(0, 0.28, 0.055);
  cpuSocketGroup.add(socketILM);
  addBox(socketILM, 0.54, 0.05, 0.02, matBrushedSteel, 0, -0.025, 0);
  addBox(socketILM, 0.54, 0.05, 0.02, matBrushedSteel, 0, -0.535, 0);
  addBox(socketILM, 0.05, 0.56, 0.02, matBrushedSteel, -0.245, -0.28, 0);
  addBox(socketILM, 0.05, 0.56, 0.02, matBrushedSteel, 0.245, -0.28, 0);

  const socketLeverPivot = new THREE.Group();
  socketLeverPivot.position.set(0.31, -0.27, 0.045);
  cpuSocketGroup.add(socketLeverPivot);
  const leverRod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.58, 10), matBrushedSteel);
  leverRod.position.set(0, 0.29, 0);
  socketLeverPivot.add(leverRod);
  const leverTip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 10), matBlackPlastic);
  leverTip.rotation.z = Math.PI / 2;
  leverTip.position.set(-0.04, 0.57, 0);
  socketLeverPivot.add(leverTip);

  // 4 RAM DIMM Slots
  const ramSlotLatches: { top: THREE.Group; bot: THREE.Group }[] = [];
  [0.3, 0.42, 0.54, 0.66].forEach((rx, idx) => {
    addBox(moboRoot, 0.07, 1.18, 0.09, idx % 2 === 1 ? matBlueAccent : matBlackPlastic, rx, 0.65, 0.06);
    addBox(moboRoot, 0.075, 0.03, 0.095, matBlackPlastic, rx, 0.6, 0.062);

    const topLatchPivot = new THREE.Group();
    topLatchPivot.position.set(rx, 1.25, 0.08);
    moboRoot.add(topLatchPivot);
    addBox(topLatchPivot, 0.065, 0.07, 0.05, matBrushedSteel, 0, 0.03, 0.015);

    const botLatchPivot = new THREE.Group();
    botLatchPivot.position.set(rx, 0.05, 0.08);
    moboRoot.add(botLatchPivot);
    addBox(botLatchPivot, 0.065, 0.07, 0.05, matBrushedSteel, 0, -0.03, 0.015);

    if (idx === 1 || idx === 3) {
      ramSlotLatches.push({ top: topLatchPivot, bot: botLatchPivot });
    }
  });

  // C. LANGKAH 2: PEMPROSES (CPU) + SILICON DIE
  const cpuGroup = new THREE.Group();
  cpuGroup.position.set(0, 0, 0.055);
  cpuSocketGroup.add(cpuGroup);

  const matCpuSub = new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    roughness: 0.45,
    metalness: 0.25,
  });
  addBox(cpuGroup, 0.44, 0.44, 0.018, matCpuSub, 0, 0, 0);

  const siliconDieMat = new THREE.MeshPhysicalMaterial({
    map: createSiliconDieTexture(maxAnisotropy),
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.2,
    clearcoat: 1.0,
  });
  addBox(cpuGroup, 0.27, 0.27, 0.015, siliconDieMat, 0, 0, 0.016);
  addBox(cpuGroup, 0.3, 0.3, 0.02, matCuGlow, 0, 0, 0.022, false, false);

  const matIhs = registerXrayMaterial(
    new THREE.MeshStandardMaterial({
      map: createCpuIhsTexture(maxAnisotropy),
      roughness: 0.25,
      metalness: 0.88,
    }),
    0.14
  );
  addBox(cpuGroup, 0.39, 0.39, 0.025, matIhs, 0, 0, 0.025);

  // D. LANGKAH 3: KIPAS PEMPROSES
  const coolerGroup = new THREE.Group();
  coolerGroup.position.set(-0.25, 0.65, 0.11);
  moboRoot.add(coolerGroup);

  addBox(coolerGroup, 0.42, 0.42, 0.05, matCopper, 0, 0, 0.025);
  [-0.14, -0.05, 0.05, 0.14].forEach((hx) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.56, 12), matCopper);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(hx, 0, 0.28);
    coolerGroup.add(pipe);
  });

  for (let f = 0; f < 13; f++) {
    addBox(coolerGroup, 0.68, 0.68, 0.012, matHeatsinkFin, 0, 0, 0.09 + f * 0.032);
  }

  const fanFrame = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.48, metalness: 0.25 }),
    0.18
  );
  addBox(coolerGroup, 0.72, 0.06, 0.14, fanFrame, 0, 0.33, 0.54);
  addBox(coolerGroup, 0.72, 0.06, 0.14, fanFrame, 0, -0.33, 0.54);
  addBox(coolerGroup, 0.06, 0.6, 0.14, fanFrame, -0.33, 0, 0.54);
  addBox(coolerGroup, 0.06, 0.6, 0.14, fanFrame, 0.33, 0, 0.54);

  const fanRotor = new THREE.Group();
  fanRotor.position.set(0, 0, 0.54);
  coolerGroup.add(fanRotor);
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 20), matBlueAccent);
  fanHub.rotation.x = Math.PI / 2;
  fanRotor.add(fanHub);
  const bladeMat = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.35 }),
    0.2
  );
  for (let b = 0; b < 7; b++) {
    const bladePivot = new THREE.Group();
    bladePivot.rotation.z = (b / 7) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.016), bladeMat);
    blade.position.set(0, 0.18, 0);
    blade.rotation.y = 0.42;
    bladePivot.add(blade);
    fanRotor.add(bladePivot);
  }

  const fanCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.95, 0.56),
    new THREE.Vector3(0.05, 1.18, 0.4),
    new THREE.Vector3(-0.04, 1.32, 0.22),
    new THREE.Vector3(-0.12, 1.32, 0.06),
  ]);
  const fanCableGeo = new THREE.TubeGeometry(fanCableCurve, 24, 0.016, 8, false);
  const fanCableMesh = new THREE.Mesh(fanCableGeo, matBlackPlastic);
  moboRoot.add(fanCableMesh);
  const fanCableTotalIdx = fanCableGeo.index ? fanCableGeo.index.count : 0;

  // E. LANGKAH 4: RAM
  const ramSticks: THREE.Group[] = [];
  [0.42, 0.66].forEach((rx) => {
    const ram = new THREE.Group();
    ram.position.set(rx, 0.65, 0.22);
    moboRoot.add(ram);

    addBox(ram, 0.024, 1.12, 0.26, matCaseInner, 0, 0, 0);
    addBox(ram, 0.028, 1.06, 0.045, matGold, 0, 0, -0.125);
    addBox(ram, 0.048, 1.14, 0.24, matHeatsinkDark, 0, 0, 0.02);
    addBox(ram, 0.052, 1.1, 0.035, matLedCyan, 0, 0, 0.145, false, false);
    ramSticks.push(ram);
  });

  // F. LANGKAH 5: INGATAN SEKUNDER (HDD & SSD)
  const storageGroup = new THREE.Group();
  pcRoot.add(storageGroup);

  const hddGroup = new THREE.Group();
  hddGroup.position.set(1.48, 1.44, -0.05);
  storageGroup.add(hddGroup);
  const hddBodyMat = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.78 }),
    0.18
  );
  addBox(hddGroup, 0.98, 0.24, 0.84, hddBodyMat, 0, 0, 0);
  const hddPlatter = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 32), matBrushedSteel);
  hddPlatter.position.set(-0.08, 0.02, 0);
  hddGroup.add(hddPlatter);
  const hddLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.65),
    new THREE.MeshStandardMaterial({
      map: createDriveLabelTexture('HDD 2TB', '3.5" 7200RPM', '#0284c7', maxAnisotropy),
      roughness: 0.45,
    })
  );
  hddLabel.rotation.x = -Math.PI / 2;
  hddLabel.position.set(0, 0.124, 0);
  hddGroup.add(hddLabel);

  const ssdGroup = new THREE.Group();
  ssdGroup.position.set(1.48, 2.04, -0.05);
  storageGroup.add(ssdGroup);
  const ssdBodyMat = registerXrayMaterial(
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.55 }),
    0.2
  );
  addBox(ssdGroup, 0.74, 0.12, 0.62, ssdBodyMat, 0, 0, 0);
  const ssdLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.48),
    new THREE.MeshStandardMaterial({
      map: createDriveLabelTexture('SSD 512GB', '2.5" FLASH NAND', '#059669', maxAnisotropy),
      roughness: 0.4,
    })
  );
  ssdLabel.rotation.x = -Math.PI / 2;
  ssdLabel.position.set(0, 0.064, 0);
  ssdGroup.add(ssdLabel);
  addBox(ssdGroup, 0.22, 0.03, 0.22, matGold, -0.15, 0, -0.1);
  addBox(ssdGroup, 0.22, 0.03, 0.22, matGold, 0.15, 0, 0.1);

  const matSataRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
  const matSataPower = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 });
  const matYellowWire = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45 });

  function makeCable(
    points: THREE.Vector3[],
    radius: number,
    mat: THREE.Material,
    tubularSegs = 36
  ): CableHandle {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, tubularSegs, radius, 8, false);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    pcRoot.add(mesh);
    return {
      mesh,
      geo,
      tubularSegs,
      radialSegs: 8,
      totalIdx: geo.index ? geo.index.count : 0,
    };
  }

  const step5Cables: CableHandle[] = [
    makeCable(
      [
        new THREE.Vector3(1.0, 1.44, -0.12),
        new THREE.Vector3(0.68, 1.46, -0.24),
        new THREE.Vector3(0.52, 1.85, -0.38),
        new THREE.Vector3(0.23, 2.15, -0.5),
      ],
      0.02,
      matSataRed
    ),
    makeCable(
      [
        new THREE.Vector3(1.12, 2.04, -0.12),
        new THREE.Vector3(0.75, 2.05, -0.28),
        new THREE.Vector3(0.48, 2.04, -0.4),
        new THREE.Vector3(0.23, 2.03, -0.5),
      ],
      0.02,
      matSataRed
    ),
    makeCable(
      [
        new THREE.Vector3(-0.82, 0.68, 0.08),
        new THREE.Vector3(0.15, 0.55, 0.16),
        new THREE.Vector3(0.85, 0.95, 0.12),
        new THREE.Vector3(1.02, 1.42, 0.12),
      ],
      0.026,
      matSataPower
    ),
    makeCable(
      [
        new THREE.Vector3(1.02, 1.42, 0.12),
        new THREE.Vector3(0.95, 1.72, 0.16),
        new THREE.Vector3(1.12, 2.02, 0.1),
      ],
      0.022,
      matYellowWire
    ),
  ];

  // G. LANGKAH 6: WAYAR PORT I/O
  const step6Cables: CableHandle[] = [
    makeCable(
      [
        new THREE.Vector3(1.86, 4.4, 0.1),
        new THREE.Vector3(1.75, 3.6, -0.62),
        new THREE.Vector3(1.1, 1.85, -0.64),
        new THREE.Vector3(0.25, 1.42, -0.52),
        new THREE.Vector3(-0.33, 1.51, -0.52),
      ],
      0.022,
      matBlueAccent,
      44
    ),
    makeCable(
      [
        new THREE.Vector3(1.86, 4.38, -0.18),
        new THREE.Vector3(1.68, 3.3, -0.66),
        new THREE.Vector3(0.85, 1.52, -0.64),
        new THREE.Vector3(-0.15, 1.38, -0.52),
        new THREE.Vector3(-0.77, 1.51, -0.52),
      ],
      0.018,
      matYellowWire,
      44
    ),
  ];

  // H. LANGKAH 7: KABEL BEKALAN KUASA 24-PIN ATX
  const matBraided24 = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
    metalness: 0.15,
  });
  const step7Cables: CableHandle[] = [
    makeCable(
      [
        new THREE.Vector3(-0.82, 0.85, 0.22),
        new THREE.Vector3(-0.15, 1.05, 0.35),
        new THREE.Vector3(0.58, 1.95, 0.18),
        new THREE.Vector3(0.62, 3.05, -0.18),
        new THREE.Vector3(0.21, 3.23, -0.48),
      ],
      0.056,
      matBraided24,
      48
    ),
    makeCable(
      [
        new THREE.Vector3(-0.82, 0.89, 0.25),
        new THREE.Vector3(-0.15, 1.09, 0.38),
        new THREE.Vector3(0.58, 1.98, 0.21),
        new THREE.Vector3(0.62, 3.08, -0.15),
        new THREE.Vector3(0.21, 3.27, -0.45),
      ],
      0.018,
      matBlueAccent,
      48
    ),
  ];
  const plug24Pin = addBox(pcRoot, 0.14, 0.44, 0.13, matBlackPlastic, 0.21, 3.23, -0.45);

  // I. LANGKAH 8 & ALIRAN DATA VON NEUMANN
  const vnGroup = new THREE.Group();
  pcRoot.add(vnGroup);

  const PT_CPU_CU = new THREE.Vector3(-1.14, 3.5, -0.48);
  const PT_CPU_ALU = new THREE.Vector3(-1.05, 3.5, -0.48);
  const PT_NORTH = new THREE.Vector3(-1.07, 2.91, -0.48);
  const PT_RAM_1 = new THREE.Vector3(-0.43, 3.5, -0.35);
  const PT_RAM_2 = new THREE.Vector3(-0.19, 3.5, -0.35);
  const PT_SOUTH = new THREE.Vector3(-0.33, 2.03, -0.48);
  const PT_REAR_IO = new THREE.Vector3(-1.99, 3.07, -0.42);
  const PT_FRONT_IO = new THREE.Vector3(1.9, 4.4, 0.0);
  const PT_FPANEL = new THREE.Vector3(-0.33, 1.51, -0.5);
  const PT_HDD = new THREE.Vector3(1.48, 1.44, -0.05);
  const PT_SSD = new THREE.Vector3(1.48, 2.04, -0.05);

  const vnFlows = [
    {
      color: 0x00e5ff,
      points: [PT_CPU_CU, new THREE.Vector3(-1.12, 3.2, -0.46), PT_NORTH],
      count: 6,
      speed: 0.75,
    },
    {
      color: 0x00e5ff,
      points: [PT_NORTH, new THREE.Vector3(-0.72, 2.45, -0.46), PT_SOUTH],
      count: 7,
      speed: 0.68,
    },
    {
      color: 0x10b981,
      points: [PT_RAM_1, new THREE.Vector3(-0.65, 3.25, -0.44), PT_NORTH, PT_CPU_ALU],
      count: 8,
      speed: 0.85,
    },
    {
      color: 0x10b981,
      points: [PT_CPU_ALU, PT_NORTH, new THREE.Vector3(-0.52, 3.15, -0.44), PT_RAM_2],
      count: 8,
      speed: 0.82,
    },
    {
      color: 0xf59e0b,
      points: [
        PT_HDD,
        new THREE.Vector3(0.68, 1.46, -0.24),
        new THREE.Vector3(0.23, 2.15, -0.48),
        PT_SOUTH,
      ],
      count: 7,
      speed: 0.62,
    },
    {
      color: 0xf59e0b,
      points: [
        PT_SSD,
        new THREE.Vector3(0.75, 2.05, -0.28),
        new THREE.Vector3(0.23, 2.03, -0.48),
        PT_SOUTH,
      ],
      count: 6,
      speed: 0.65,
    },
    {
      color: 0xf59e0b,
      points: [
        PT_FRONT_IO,
        new THREE.Vector3(1.75, 3.6, -0.62),
        new THREE.Vector3(1.1, 1.85, -0.64),
        PT_FPANEL,
        PT_SOUTH,
      ],
      count: 8,
      speed: 0.55,
    },
    {
      color: 0x00e5ff,
      points: [PT_SOUTH, new THREE.Vector3(-1.2, 2.25, -0.45), PT_REAR_IO],
      count: 6,
      speed: 0.7,
    },
  ];

  const vnParticles: VnParticle[] = [];
  const vnLineMeshes: THREE.Mesh[] = [];
  const pulseSphereGeo = new THREE.SphereGeometry(0.036, 12, 12);

  vnFlows.forEach((flow) => {
    const curve = new THREE.CatmullRomCurve3(flow.points);
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.012, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: flow.color,
      transparent: true,
      opacity: 0.35,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    vnGroup.add(tubeMesh);
    vnLineMeshes.push(tubeMesh);

    const pMat = new THREE.MeshBasicMaterial({ color: flow.color });
    for (let i = 0; i < flow.count; i++) {
      const dot = new THREE.Mesh(pulseSphereGeo, pMat);
      vnGroup.add(dot);
      vnParticles.push({
        mesh: dot,
        curve,
        offset: i / flow.count,
        speed: flow.speed,
      });
    }
  });

  return {
    pcRoot,
    moboRoot,
    moboTarget,
    moboScrews,
    cpuGroup,
    socketILM,
    socketLeverPivot,
    coolerGroup,
    fanRotor,
    fanCableMesh,
    fanCableGeo,
    fanCableTotalIdx,
    ramSticks,
    ramSlotLatches,
    hddGroup,
    hddPlatter,
    ssdGroup,
    step5Cables,
    step6Cables,
    step7Cables,
    plug24Pin,
    vnGroup,
    vnParticles,
    vnLineMeshes,
    xrayManagedMaterials,
    materials: {
      matHeatsinkFin,
      matHeatsinkDark,
      fanFrame,
      bladeMat,
      matIhs,
      matRearIoPulse,
      matLedCyan,
      matLedGreen,
      matCuGlow,
      matNorthGlow,
      matSouthGlow,
      siliconDieMat,
    },
  };
}

export function disposeSceneResources(root: THREE.Object3D): void {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();
  const disposedTextures = new Set<THREE.Texture>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
      disposedGeometries.add(mesh.geometry);
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        if (disposedMaterials.has(m)) return;
        disposedMaterials.add(m);
        const stdMat = m as THREE.MeshStandardMaterial;
        [stdMat.map, stdMat.roughnessMap, stdMat.normalMap, stdMat.emissiveMap].forEach((tex) => {
          if (tex && !disposedTextures.has(tex)) {
            disposedTextures.add(tex);
            tex.dispose();
          }
        });
        m.dispose();
      });
    }
  });
}
