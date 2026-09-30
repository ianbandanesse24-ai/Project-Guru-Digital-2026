import {
  AppThemeConfig,
  ThemeColorPreset,
  ThemeFontFamily,
  ThemeMenuPosition,
  ThemeDensity,
  ThemeRadius,
  ThemeContentWidth,
  AppTheme,
} from '../types';

export const DEFAULT_THEME_CONFIG: AppThemeConfig = {
  preset: 'saas',
  font: 'jakarta',
  menuPosition: 'left',
  density: 'comfortable',
  radius: 'standard',
  contentWidth: 'boxed',
};

export interface ThemePresetDefinition {
  id: string;
  name: string;
  description: string;
  config: AppThemeConfig;
  previewColors: {
    bg: string;
    surface: string;
    accent: string;
    border: string;
    text: string;
  };
}

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'preset_saas',
    name: 'Clean SaaS Blue (Default)',
    description: 'Tampilan bersih, modern, dan profesional dengan latar putih netral, teks kontras tinggi, dan aksen Royal Blue.',
    config: {
      preset: 'saas',
      font: 'jakarta',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      accent: '#2563eb',
      border: '#e2e8f0',
      text: '#0f172a',
    },
  },
  {
    id: 'preset_nordic',
    name: 'Nordic Frost & Sky',
    description: 'Nuansa minimalis Skandinavia berlatar abu-abu es sejuk dengan aksen Sky Blue yang jernih dan segar.',
    config: {
      preset: 'nordic',
      font: 'outfit',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#f0f4f8',
      surface: '#ffffff',
      accent: '#0284c7',
      border: '#cbd5e1',
      text: '#0c1a2e',
    },
  },
  {
    id: 'preset_violet',
    name: 'Neo Violet Studio (Linear Style)',
    description: 'Estetika modern kontemporer bergaya Linear & Raycast dengan aksen Electric Violet dan permukaan jernih.',
    config: {
      preset: 'violet',
      font: 'inter',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#faf5ff',
      surface: '#ffffff',
      accent: '#7c3aed',
      border: '#e9d5ff',
      text: '#1e1b4b',
    },
  },
  {
    id: 'preset_rose',
    name: 'Rose Quartz & Crimson',
    description: 'Desain hangat bernuansa mewah kontemporer dengan aksen Rose Crimson dan latar lembut berkelas.',
    config: {
      preset: 'rose',
      font: 'editorial',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'soft',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#fff5f5',
      surface: '#ffffff',
      accent: '#e11d48',
      border: '#fecdd3',
      text: '#261214',
    },
  },
  {
    id: 'preset_dark',
    name: 'Obsidian Dark Mode',
    description: 'Tema gelap nyaman di mata untuk kerja malam hari dengan kontras tinggi & aksen Ice Blue.',
    config: {
      preset: 'dark',
      font: 'inter',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#0b0f19',
      surface: '#111827',
      accent: '#38bdf8',
      border: '#334155',
      text: '#f8fafc',
    },
  },
  {
    id: 'preset_carbon',
    name: 'Carbon & Cyber Mint',
    description: 'Tema gelap pekat bergaya tech developer profesional dengan latar Zinc 950 dan aksen neon Cyber Mint.',
    config: {
      preset: 'carbon',
      font: 'system',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'sharp',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#09090b',
      surface: '#18181b',
      accent: '#10b981',
      border: '#27272a',
      text: '#f4f4f5',
    },
  },
  {
    id: 'preset_warm',
    name: 'Warm Paper & Amber',
    description: 'Bernuansa hangat kertas buku/editorial klasik dengan aksen amber dan tipografi elegan.',
    config: {
      preset: 'warm',
      font: 'editorial',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#faf8f5',
      surface: '#ffffff',
      accent: '#d97706',
      border: '#e6dfd5',
      text: '#292524',
    },
  },
  {
    id: 'preset_navy',
    name: 'Midnight Navy & Indigo',
    description: 'Kedalaman warna biru laut malam dengan aksen indigo yang berwibawa dan teratur.',
    config: {
      preset: 'navy',
      font: 'inter',
      menuPosition: 'left',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#0f172a',
      surface: '#1e293b',
      accent: '#6366f1',
      border: '#475569',
      text: '#f1f5f9',
    },
  },
  {
    id: 'preset_monochrome',
    name: 'Swiss Monochrome',
    description: 'Minimalisme absolut hitam-putih presisi tinggi terinspirasi desain Swiss & Bauhaus.',
    config: {
      preset: 'monochrome',
      font: 'system',
      menuPosition: 'left',
      density: 'compact',
      radius: 'sharp',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#f4f4f5',
      surface: '#ffffff',
      accent: '#18181b',
      border: '#d4d4d8',
      text: '#18181b',
    },
  },
  {
    id: 'preset_top_nav',
    name: 'Full Width Top Navigation',
    description: 'Menu horizontal di bagian atas layar untuk ruang kerja kanvas yang jauh lebih lega.',
    config: {
      preset: 'saas',
      font: 'jakarta',
      menuPosition: 'top',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'wide',
    },
    previewColors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      accent: '#2563eb',
      border: '#e2e8f0',
      text: '#0f172a',
    },
  },
  {
    id: 'preset_right_sidebar',
    name: 'Ergonomic Right Sidebar',
    description: 'Sidebar diletakkan di sisi kanan layar untuk navigasi tangan kanan yang ergonomis.',
    config: {
      preset: 'saas',
      font: 'jakarta',
      menuPosition: 'right',
      density: 'comfortable',
      radius: 'standard',
      contentWidth: 'boxed',
    },
    previewColors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      accent: '#2563eb',
      border: '#e2e8f0',
      text: '#0f172a',
    },
  },
];

export const COLOR_OPTIONS: { id: ThemeColorPreset; label: string; bg: string; accent: string; dark: boolean }[] = [
  { id: 'saas', label: 'Clean SaaS Blue (Default)', bg: '#f8fafc', accent: '#2563eb', dark: false },
  { id: 'nordic', label: 'Nordic Frost & Sky', bg: '#f0f4f8', accent: '#0284c7', dark: false },
  { id: 'violet', label: 'Neo Violet Studio', bg: '#faf5ff', accent: '#7c3aed', dark: false },
  { id: 'rose', label: 'Rose Quartz & Crimson', bg: '#fff5f5', accent: '#e11d48', dark: false },
  { id: 'warm', label: 'Warm Sand & Amber', bg: '#faf8f5', accent: '#d97706', dark: false },
  { id: 'monochrome', label: 'Swiss Monochrome', bg: '#f4f4f5', accent: '#18181b', dark: false },
  { id: 'dark', label: 'Obsidian Dark', bg: '#0b0f19', accent: '#38bdf8', dark: true },
  { id: 'carbon', label: 'Carbon & Cyber Mint', bg: '#09090b', accent: '#10b981', dark: true },
  { id: 'navy', label: 'Midnight Navy', bg: '#0f172a', accent: '#6366f1', dark: true },
];

export const FONT_OPTIONS: { id: ThemeFontFamily; label: string; preview: string; description: string }[] = [
  {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    preview: 'Aa Bb Gg 123',
    description: 'Geometrik modern, tajam, dan sangat nyaman dibaca di layar digital.',
  },
  {
    id: 'inter',
    label: 'Inter',
    preview: 'Aa Bb Gg 123',
    description: 'Standar emas tipografi SaaS global dengan legibilitas mikro tinggi.',
  },
  {
    id: 'editorial',
    label: 'Editorial Serif (Newsreader)',
    preview: 'Aa Bb Gg 123',
    description: 'Kombinasi klasik serif prestisius akademis untuk judul dan sans untuk isi.',
  },
  {
    id: 'outfit',
    label: 'Outfit Geometric',
    preview: 'Aa Bb Gg 123',
    description: 'Elegan, bulat harmonis, dan memberikan kesan ramah serta kontemporer.',
  },
  {
    id: 'system',
    label: 'System Native UI',
    preview: 'Aa Bb Gg 123',
    description: 'Menggunakan font bawaan perangkat (Apple SF / Segoe UI / Roboto) tanpa beban unduh.',
  },
];

export const MENU_POSITION_OPTIONS: { id: ThemeMenuPosition; label: string; description: string }[] = [
  {
    id: 'left',
    label: 'Sidebar Kiri (Standar)',
    description: 'Panel menu vertikal di sisi kiri layar dengan opsi buka/tutup fleksibel.',
  },
  {
    id: 'right',
    label: 'Sidebar Kanan (Ergonomis)',
    description: 'Panel menu dipindahkan ke sisi kanan, memudahkan navigasi mouse satu sisi.',
  },
  {
    id: 'top',
    label: 'Navigasi Atas (Horizontal)',
    description: 'Menu horizontal penuh di bilah atas layar, memaksimalkan area kerja konten.',
  },
];

export const DENSITY_OPTIONS: { id: ThemeDensity; label: string; description: string }[] = [
  {
    id: 'comfortable',
    label: 'Nyaman (Comfortable)',
    description: 'Jarak lapang dengan padding standar, optimal untuk membaca lama.',
  },
  {
    id: 'compact',
    label: 'Padat (Compact)',
    description: 'Jarak lebih rapat, memaksimalkan banyak data tampil sekaligus.',
  },
];

export const RADIUS_OPTIONS: { id: ThemeRadius; label: string; description: string }[] = [
  {
    id: 'sharp',
    label: 'Tegas (4px)',
    description: 'Sudut kotak minimalis presisi tinggi bergaya modern technical.',
  },
  {
    id: 'standard',
    label: 'Standar (12px)',
    description: 'Lengkungan proporsional modern SaaS yang seimbang dan rapi.',
  },
  {
    id: 'soft',
    label: 'Lembut (18px)',
    description: 'Lengkungan halus yang ramah dan bersahabat.',
  },
];

export const CONTENT_WIDTH_OPTIONS: { id: ThemeContentWidth; label: string; description: string }[] = [
  {
    id: 'boxed',
    label: 'Fokus Tengah (Boxed)',
    description: 'Lebar maksimal 7xl yang ergonomis untuk fokus membaca tanpa mata lelah.',
  },
  {
    id: 'wide',
    label: 'Layar Penuh (Fluid Wide)',
    description: 'Memanfaatkan seluruh lebar monitor, ideal untuk tabel data lebar & jadwal.',
  },
];

/**
 * Normalizes any saved theme representation (old string or new object) into a strict AppThemeConfig
 */
export function normalizeThemeConfig(raw: any): AppThemeConfig {
  if (!raw) {
    return { ...DEFAULT_THEME_CONFIG };
  }

  // If already a full config object
  if (typeof raw === 'object' && raw !== null && 'preset' in raw) {
    const rawPreset = raw.preset === 'emerald' ? 'saas' : raw.preset;
    return {
      preset: (rawPreset || 'saas') as ThemeColorPreset,
      font: (raw.font || 'jakarta') as ThemeFontFamily,
      menuPosition: (raw.menuPosition || 'left') as ThemeMenuPosition,
      density: (raw.density || 'comfortable') as ThemeDensity,
      radius: (raw.radius || 'standard') as ThemeRadius,
      contentWidth: (raw.contentWidth || 'boxed') as ThemeContentWidth,
    };
  }

  // If string from old theme version
  if (typeof raw === 'string') {
    switch (raw) {
      case 'dark':
        return { ...DEFAULT_THEME_CONFIG, preset: 'dark', font: 'inter' };
      case 'warm':
        return { ...DEFAULT_THEME_CONFIG, preset: 'warm', font: 'editorial' };
      case 'navy':
      case 'slate':
        return { ...DEFAULT_THEME_CONFIG, preset: 'navy', font: 'inter' };
      case 'monochrome':
        return { ...DEFAULT_THEME_CONFIG, preset: 'monochrome', font: 'system', radius: 'sharp' };
      case 'emerald':
      case 'saas':
      case 'light':
      default:
        return { ...DEFAULT_THEME_CONFIG, preset: 'saas', font: 'jakarta' };
    }
  }

  return { ...DEFAULT_THEME_CONFIG };
}

/**
 * Applies theme CSS classes to document.documentElement and document.body
 */
export function applyThemeToDOM(config: AppThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // Remove existing theme classes
  const classesToRemove = [
    'theme-preset-saas',
    'theme-preset-nordic',
    'theme-preset-violet',
    'theme-preset-rose',
    'theme-preset-dark',
    'theme-preset-carbon',
    'theme-preset-warm',
    'theme-preset-emerald',
    'theme-preset-navy',
    'theme-preset-monochrome',
    'dark',
    'font-theme-jakarta',
    'font-theme-inter',
    'font-theme-editorial',
    'font-theme-outfit',
    'font-theme-system',
    'density-comfortable',
    'density-compact',
    'radius-sharp',
    'radius-standard',
    'radius-soft',
  ];

  classesToRemove.forEach((cls) => {
    root.classList.remove(cls);
    body.classList.remove(cls);
  });

  // Add preset class
  const presetClass = `theme-preset-${config.preset}`;
  root.classList.add(presetClass);
  body.classList.add(presetClass);

  if (config.preset === 'dark' || config.preset === 'navy' || config.preset === 'carbon') {
    root.classList.add('dark');
    body.classList.add('dark');
  }

  // Add font class
  const fontClass = `font-theme-${config.font}`;
  root.classList.add(fontClass);
  body.classList.add(fontClass);

  // Add density class
  root.classList.add(`density-${config.density}`);

  // Add radius class
  root.classList.add(`radius-${config.radius}`);

  // Update meta theme-color if available
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    const colorMap: Record<ThemeColorPreset, string> = {
      saas: '#2563eb',
      nordic: '#0284c7',
      violet: '#7c3aed',
      rose: '#e11d48',
      dark: '#0b0f19',
      carbon: '#09090b',
      warm: '#d97706',
      navy: '#0f172a',
      monochrome: '#18181b',
      emerald: '#2563eb',
    };
    metaThemeColor.setAttribute('content', colorMap[config.preset] || '#2563eb');
  }
}
