import * as THREE from 'three';

export interface MotherboardTextureSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export function createMotherboardTextures(maxAnisotropy: number): MotherboardTextureSet {
  const w = 1024;
  const h = 1280;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const ctx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext('2d')!;

  ctx.fillStyle = '#0e1726';
  ctx.fillRect(0, 0, w, h);
  rCtx.fillStyle = '#a8a8a8';
  rCtx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(30, 58, 95, 0.22)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  function drawTraceBus(
    points: [number, number][],
    color = '#1d4f7a',
    width = 3,
    count = 6,
    spacing = 7
  ) {
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      points.forEach((p, idx) => {
        const px = p[0] + offset * 0.7;
        const py = p[1] + offset * 0.7;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      rCtx.strokeStyle = '#383838';
      rCtx.lineWidth = width;
      rCtx.beginPath();
      points.forEach((p, idx) => {
        const px = p[0] + offset * 0.7;
        const py = p[1] + offset * 0.7;
        if (idx === 0) rCtx.moveTo(px, py);
        else rCtx.lineTo(px, py);
      });
      rCtx.stroke();
    }
  }

  // CPU <-> RAM traces
  drawTraceBus(
    [
      [440, 310],
      [540, 310],
      [580, 260],
      [720, 260],
    ],
    '#2563eb',
    2.6,
    10,
    8
  );
  drawTraceBus(
    [
      [440, 390],
      [560, 390],
      [600, 430],
      [720, 430],
    ],
    '#0284c7',
    2.6,
    10,
    8
  );

  // CPU <-> Northbridge
  drawTraceBus(
    [
      [380, 420],
      [380, 540],
      [410, 610],
    ],
    '#38bdf8',
    3,
    8,
    9
  );

  // Northbridge <-> PCIe x16
  drawTraceBus(
    [
      [390, 640],
      [330, 720],
      [330, 810],
    ],
    '#1d4ed8',
    2.8,
    9,
    8
  );

  // Northbridge <-> Southbridge
  drawTraceBus(
    [
      [450, 650],
      [580, 780],
      [680, 930],
    ],
    '#0ea5e9',
    3.2,
    6,
    10
  );

  // Southbridge <-> SATA & F_PANEL
  drawTraceBus(
    [
      [730, 980],
      [880, 980],
      [950, 940],
    ],
    '#b45309',
    3,
    6,
    9
  );
  drawTraceBus(
    [
      [700, 1020],
      [700, 1180],
      [740, 1210],
    ],
    '#0284c7',
    2.5,
    6,
    8
  );

  // Power rails from 24-pin
  drawTraceBus(
    [
      [950, 440],
      [860, 440],
      [810, 360],
    ],
    '#d97706',
    3.5,
    4,
    10
  );
  drawTraceBus(
    [
      [950, 490],
      [880, 560],
      [880, 850],
    ],
    '#b45309',
    3.5,
    3,
    10
  );

  // Mounting screw gold rings
  const holes: [number, number][] = [
    [60, 60],
    [512, 60],
    [964, 60],
    [60, 640],
    [512, 640],
    [964, 640],
    [60, 1220],
    [512, 1220],
    [964, 1220],
  ];
  holes.forEach(([hx, hy]) => {
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(hx, hy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090f19';
    ctx.beginPath();
    ctx.arc(hx, hy, 10, 0, Math.PI * 2);
    ctx.fill();
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(hx + Math.cos(ang) * 16, hy + Math.sin(ang) * 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Silkscreen technical labels
  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('ATX-VN SERIES PRO', 160, 90);
  ctx.font = 'bold 15px monospace';
  ctx.fillText('CPU_SOCKET', 350, 215);
  ctx.fillText('CPU_FAN', 415, 115);
  ctx.fillText('DIMM A1 A2 B1 B2', 640, 165);
  ctx.fillText('NORTHBRIDGE', 340, 595);
  ctx.fillText('PCIEX16_1', 160, 770);
  ctx.fillText('PCIEX16_2', 160, 940);
  ctx.fillText('SOUTHBRIDGE', 635, 900);
  ctx.fillText('ATX_24P', 875, 405);
  ctx.fillText('SATA 1-4', 865, 910);
  ctx.fillText('F_PANEL', 680, 1235);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, maxAnisotropy);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = Math.min(8, maxAnisotropy);

  return { map, roughnessMap };
}

export function createCpuIhsTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#cbd5e1');
  grad.addColorStop(0.5, '#e2e8f0');
  grad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  for (let y = 0; y < 512; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VON NEUMANN', 256, 200);
  ctx.font = 'bold 26px monospace';
  ctx.fillText('CORE CU + ALU', 256, 250);
  ctx.font = '20px monospace';
  ctx.fillText('ARCH-64 • 4.2 GHz', 256, 300);

  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(45, 467);
  ctx.lineTo(95, 467);
  ctx.lineTo(45, 417);
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function createSiliconDieTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#071426';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 512; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(6, 182, 212, 0.38)';
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 4;
  ctx.fillRect(36, 40, 205, 432);
  ctx.strokeRect(36, 40, 205, 432);

  ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
  ctx.strokeStyle = '#34d399';
  ctx.fillRect(270, 40, 205, 270);
  ctx.strokeRect(270, 40, 205, 270);

  ctx.fillStyle = 'rgba(245, 158, 11, 0.32)';
  ctx.strokeStyle = '#fbbf24';
  ctx.fillRect(270, 336, 205, 136);
  ctx.strokeRect(270, 336, 205, 136);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('UNIT', 138, 225);
  ctx.fillText('KAWALAN', 138, 260);
  ctx.fillText('(CU)', 138, 295);

  ctx.fillText('ALU', 372, 185);
  ctx.font = 'bold 22px monospace';
  ctx.fillText('DAFTAR', 372, 412);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function createDriveLabelTexture(
  title: string,
  sub: string,
  accent: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 512, 110);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(title, 34, 72);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px monospace';
  ctx.fillText(sub, 34, 185);
  ctx.fillStyle = '#475569';
  ctx.font = '22px monospace';
  ctx.fillText('INGATAN SEKUNDER SATA', 34, 240);
  ctx.fillText('PENYIMPANAN KEKAL', 34, 278);

  ctx.fillStyle = '#0f172a';
  for (let x = 34; x < 440; x += 9) {
    const bw = ((x * 7) % 5) + 2;
    ctx.fillRect(x, 360, bw, 75);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function createPsuLabelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 18, 256);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('BEKALAN KUASA', 44, 88);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 54px monospace';
  ctx.fillText('650W ATX', 44, 158);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px monospace';
  ctx.fillText('80+ KECEKAPAN TINGGI', 44, 206);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 124);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.36)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
