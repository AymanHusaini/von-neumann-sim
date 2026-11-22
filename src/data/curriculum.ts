export type ViewMode = 'assembly' | 'xray' | 'vonneumann';

export type CameraPresetKey = 'full' | 'cpu_ram' | 'storage_io' | 'psu_cable' | 'top';

export type VonNeumannNodeKey = 'cu' | 'alu' | 'ram' | 'storage' | 'io' | 'bus';

export interface CameraTarget {
  pos: [number, number, number];
  target: [number, number, number];
}

export interface StepItem {
  step: number;
  title: string;
  desc: string;
  vnRole: string;
  vnNodes: VonNeumannNodeKey[];
  camera: CameraTarget;
}

export interface CalloutItem {
  id: string;
  label: string;
  minStep: number;
  worldPos: [number, number, number];
  camera: CameraTarget;
  tag: string;
  title: string;
  body: string;
  specs: [string, string][];
}

export const VON_NEUMANN_NODES: { key: VonNeumannNodeKey; label: string }[] = [
  { key: 'cu', label: 'Unit Kawalan (CU)' },
  { key: 'alu', label: 'Unit ALU' },
  { key: 'ram', label: 'Ingatan Utama' },
  { key: 'storage', label: 'Ingatan Sekunder' },
  { key: 'io', label: 'Peranti I/O' },
  { key: 'bus', label: 'Bas Sistem / Kuasa' },
];

export const STEPS_DATA: StepItem[] = [
  {
    step: 0,
    title: 'Tapak Asas: Bekas (Casing) ATX & Unit Bekalan Kuasa',
    desc: 'Bekas (casing) ATX jenis menara pertengahan dengan panel sisi terbuka, lengkap dengan penyangga papan induk (standoffs), ruang cakera keras, potongan I/O belakang dan kotak bekalan kuasa (PSU) yang sedia terpasang.',
    vnRole: 'Struktur pelindung fizikal dan sumber tenaga elektrik utama sebelum komponen seni bina Von Neumann dipasang.',
    vnNodes: ['bus'],
    camera: { pos: [3.2, 3.6, 5.2], target: [-0.2, 2.35, -0.1] },
  },
  {
    step: 1,
    title: 'Langkah 1: Masukkan papan induk ke dalam bekas (casing)',
    desc: 'Letakkan papan induk pada kedudukan yang betul mengikut lubang skru dalam bekas, pastikan ia dipasang dengan kukuh dan tidak longgar.',
    vnRole: 'Papan litar utama (bas sistem) yang menghubungkan semua komponen seni bina Von Neumann.',
    vnNodes: ['bus'],
    camera: { pos: [1.4, 3.3, 4.4], target: [-0.85, 2.85, -0.5] },
  },
  {
    step: 2,
    title: 'Langkah 2: Pasang pemproses ke atas soket pemproses',
    desc: 'Masukkan CPU ke dalam soket (CPU bay) dengan arah yang betul, kemudian turunkan pengunci soket untuk menetapkan kedudukannya.',
    vnRole: 'Unit Pemprosesan Pusat (CPU) yang mengandungi Unit Aritmetik dan Logik (ALU) serta Unit Kawalan (CU).',
    vnNodes: ['cu', 'alu'],
    camera: { pos: [-0.45, 3.75, 1.55], target: [-1.1, 3.5, -0.55] },
  },
  {
    step: 3,
    title: 'Langkah 3: Pasang kipas pemproses',
    desc: 'Letakkan kipas di atas pemproses, kunci dengan betul dan sambungkan wayar kipas ke penyambung kipas CPU pada papan induk.',
    vnRole: 'Sistem penyejukan untuk memastikan CPU beroperasi pada suhu optimum semasa kitaran ambil-nyahkod-laksana (fetch-decode-execute).',
    vnNodes: ['cu', 'alu'],
    camera: { pos: [-0.25, 3.9, 1.85], target: [-1.05, 3.55, -0.35] },
  },
  {
    step: 4,
    title: 'Langkah 4: Pasang ingatan utama (RAM) pada slot ingatan',
    desc: "Buka kunci pada kedua-dua hujung slot RAM, masukkan kad RAM dan tekan kedua-dua hujung kad RAM sehingga kunci slot RAM tertutup rapat secara automatik berdasarkan bunyi 'klik'.",
    vnRole: 'Ingatan Utama (Main Memory) yang menyimpan data dan arahan program secara sementara untuk capaian pantas oleh CPU.',
    vnNodes: ['ram'],
    camera: { pos: [0.35, 3.65, 1.75], target: [-0.25, 3.5, -0.45] },
  },
  {
    step: 5,
    title: 'Langkah 5: Pasang ingatan sekunder (HDD/SSD)',
    desc: 'Pasang cakera keras pada bekas, sambungkan kabel data SATA/IDE dari cakera keras ke papan induk, serta sambungkan wayar bekalan kuasa (PSU) dari kotak bekalan kuasa ke cakera keras. Sekiranya ada ingatan sekunder lain (cth. CD-ROM), kaedah penyambungan adalah sama seperti yang dinyatakan.',
    vnRole: 'Ingatan Sekunder (Secondary Storage) untuk penyimpanan data dan perisian secara kekal.',
    vnNodes: ['storage'],
    camera: { pos: [2.8, 2.55, 2.95], target: [1.1, 1.8, -0.1] },
  },
  {
    step: 6,
    title: 'Langkah 6: Pasang wayar dari port I/O',
    desc: 'Sambungkan wayar dari port I/O pada panel hadapan ke pin penyambung di atas papan induk. Bagi port I/O pada panel belakang, tiada sambungan perlu dilakukan kerana embedded di atas papan induk.',
    vnRole: 'Peranti Input/Output (I/O) yang membolehkan komunikasi data antara pengguna/peranti luar dengan sistem komputer.',
    vnNodes: ['io'],
    camera: { pos: [0.65, 2.15, 3.65], target: [-0.35, 2.1, -0.35] },
  },
  {
    step: 7,
    title: 'Langkah 7: Berikan bekalan kuasa kepada papan induk',
    desc: 'Berikan bekalan kuasa kepada papan induk dengan menyambungkan wayar dari kotak bekalan kuasa ke pin penyambung (24-pin connector) di atas papan induk.',
    vnRole: 'Membekalkan tenaga elektrik terkawal kepada papan induk dan semua komponen elektronik yang terpasang.',
    vnNodes: ['bus'],
    camera: { pos: [1.15, 2.45, 3.1], target: [-0.15, 2.15, -0.25] },
  },
  {
    step: 8,
    title: 'Langkah 8: Unit kawalan',
    desc: 'Tiada pemasangan fizikal khusus bagi komponen ini kerana telah embedded di atas papan induk. Lokasi unit kawalan adalah samada embedded di dalam CPU, berdekatan dengan lokasi CPU, RAM dan kad grafik (dikenali juga sebagai northbridge) atau berdekatan dengan port I/O dan ingatan sekunder (dikenali juga sebagai southbridge).',
    vnRole: 'Unit Kawalan (Control Unit) yang mengurus dan menyelaras aliran arahan serta data antara CPU, ingatan, dan peranti I/O.',
    vnNodes: ['cu', 'alu', 'ram', 'storage', 'io', 'bus'],
    camera: { pos: [0.45, 3.25, 2.75], target: [-0.75, 2.9, -0.45] },
  },
];

export const CAMERA_PRESETS: Record<CameraPresetKey, { label: string } & CameraTarget> = {
  full: { label: 'Pandangan Penuh', pos: [3.15, 3.45, 5.15], target: [-0.1, 2.4, -0.15] },
  cpu_ram: { label: 'CPU & RAM', pos: [-0.15, 3.75, 1.85], target: [-0.65, 3.45, -0.45] },
  storage_io: { label: 'Storan & I/O', pos: [2.65, 2.55, 3.25], target: [0.75, 2.0, -0.15] },
  psu_cable: { label: 'PSU & Kabel', pos: [-0.4, 1.85, 3.35], target: [-0.65, 1.45, -0.2] },
  top: { label: 'Pandangan Atas', pos: [0.1, 6.4, 1.15], target: [-0.15, 2.35, -0.15] },
};

export const CALLOUTS_DATA: CalloutItem[] = [
  {
    id: 'mobo',
    label: 'Papan Induk',
    minStep: 1,
    worldPos: [-1.35, 1.95, -0.52],
    camera: { pos: [0.9, 2.8, 3.5], target: [-0.85, 2.6, -0.55] },
    tag: 'Langkah 1 · Bas Sistem',
    title: 'Papan Induk ATX (Motherboard)',
    body: 'Papan litar bercetak utama yang menyediakan bas data, alamat dan kawalan untuk menghubungkan CPU, RAM, storan dan peranti I/O secara bersepadu.',
    specs: [
      ['Faktor Bentuk', 'ATX Standard (305 × 244 mm)'],
      ['Set Cip', 'Northbridge & Southbridge Terbenam'],
      ['Slot Pengembangan', '2× PCIe x16, 4× DDR DIMM, 4× SATA'],
    ],
  },
  {
    id: 'cpu',
    label: 'CPU & Unit Kawalan',
    minStep: 2,
    worldPos: [-1.1, 3.5, -0.45],
    camera: { pos: [-0.45, 3.75, 1.55], target: [-1.1, 3.5, -0.55] },
    tag: 'Langkah 2 & 8 · CPU / CU / ALU',
    title: 'Pemproses (CPU) & Unit Kawalan',
    body: 'Otak sistem komputer. Mengandungi Unit Kawalan (CU) untuk mengambil dan menyahkod arahan serta Unit Aritmetik dan Logik (ALU) bagi pengiraan matematik dan logik.',
    specs: [
      ['Komponen Teras', 'Unit Kawalan (CU) + ALU + Daftar'],
      ['Soket', 'LGA dengan Tuil Pengunci Logam'],
      ['Kitaran', 'Ambil → Nyahkod → Laksana'],
    ],
  },
  {
    id: 'cooler',
    label: 'Kipas Pemproses',
    minStep: 3,
    worldPos: [-1.1, 3.75, 0.05],
    camera: { pos: [-0.25, 3.9, 1.85], target: [-1.05, 3.55, -0.35] },
    tag: 'Langkah 3 · Penyejukan',
    title: 'Penyerap Haba & Kipas CPU',
    body: 'Menyerap haba daripada IHS pemproses melalui sirip aluminium dan paip haba kuprum serta meniupkannya keluar bagi mengekalkan kestabilan kitaran CPU.',
    specs: [
      ['Penyambung', 'Header 4-Pin PWM (CPU_FAN)'],
      ['Bahan Sirip', 'Aluminium Anod & Paip Kuprum'],
      ['Kelajuan Kipas', 'Aktif (Dikawal PWM)'],
    ],
  },
  {
    id: 'ram',
    label: 'RAM (Ingatan Utama)',
    minStep: 4,
    worldPos: [-0.3, 3.5, -0.3],
    camera: { pos: [0.35, 3.65, 1.75], target: [-0.25, 3.5, -0.45] },
    tag: 'Langkah 4 · Ingatan Utama',
    title: 'Modul RAM (Ingatan Utama)',
    body: 'Menyimpan arahan program dan data yang sedang diproses secara sementara supaya CPU dapat mencapainya pada kelajuan amat tinggi melalui bas memori.',
    specs: [
      ['Konfigurasi', 'Dwi-Saluran (2× Modul DDR)'],
      ['Antara Muka', 'Jari Sentuh Emas & Selak Automatik'],
      ['Sifat Ingatan', 'Meruap (Volatile) & Capaian Rawak'],
    ],
  },
  {
    id: 'storage',
    label: 'HDD/SSD (Ingatan Sekunder)',
    minStep: 5,
    worldPos: [1.5, 2.1, 0.15],
    camera: { pos: [2.8, 2.55, 2.95], target: [1.1, 1.8, -0.1] },
    tag: 'Langkah 5 · Ingatan Sekunder',
    title: 'Cakera Keras (HDD) & SSD',
    body: 'Menyimpan sistem operasi, perisian dan fail pengguna secara kekal walaupun bekalan kuasa dimatikan. Dihubungkan ke papan induk melalui kabel data SATA.',
    specs: [
      ['Peranti', '1× HDD 3.5" + 1× SSD 2.5"'],
      ['Kabel Data', 'SATA ke Port SATA Papan Induk'],
      ['Kabel Kuasa', 'Kuasa SATA dari Kotak PSU'],
    ],
  },
  {
    id: 'io',
    label: 'Port I/O',
    minStep: 6,
    worldPos: [1.85, 4.35, 0.25],
    camera: { pos: [1.2, 3.2, 3.4], target: [0.25, 2.75, -0.2] },
    tag: 'Langkah 6 · Input / Output',
    title: 'Port Input / Output (Hadapan & Belakang)',
    body: 'Panel hadapan disambung melalui wayar jumper F_PANEL (Power SW, Reset SW, HDD LED, USB/Audio). Panel belakang pula terbina (embedded) terus di atas papan induk.',
    specs: [
      ['Panel Hadapan', 'Wayar F_PANEL & USB/Audio ke Header'],
      ['Panel Belakang', 'Terbenam (USB, LAN, Audio, Paparan)'],
      ['Kawalan Bas', 'Diurus melalui Southbridge (PCH)'],
    ],
  },
  {
    id: 'psu24',
    label: 'Bekalan Kuasa 24-Pin',
    minStep: 7,
    worldPos: [0.22, 3.25, -0.35],
    camera: { pos: [1.15, 2.45, 3.1], target: [-0.15, 2.15, -0.25] },
    tag: 'Langkah 7 · Bekalan Kuasa',
    title: 'Penyambung Kuasa ATX 24-Pin & PSU',
    body: 'Menyalurkan voltan DC teratur (+12V, +5V, +3.3V) daripada Kotak Bekalan Kuasa (PSU) ke seluruh papan induk dan komponen terpasang.',
    specs: [
      ['Penyambung Utama', '24-Pin ATX Beranyam (Braided)'],
      ['Unit Sumber', 'PSU 650W Terpasang di Bawah'],
      ['Perlindungan', 'OVP / UVP / SCP Terkawal'],
    ],
  },
];
