/**
 * config/theme.config.ts
 * ★★ ЕДИНЫЙ КОНФИГ ДИЗАЙНА — меняешь значения, меняется весь вид приложения.
 *
 * Как это работает (без правки компонентов):
 *   тема (обычные значения)  →  applyTheme() пишет CSS-переменные на :root
 *   →  Tailwind-токены (bg-brand, bg-card, text-muted…) читают эти переменные
 *   →  фон/кнопки/цвета/иконки берут цвет из текущей темы.
 *
 * Чтобы сменить тему — поменяй ОДНУ строку внизу: `ACTIVE_THEME = themes.<имя>`.
 * Чтобы сделать свою — скопируй любой блок в `themes` и поменяй значения.
 */

import type { CSSProperties } from 'react';

export type BackgroundType = 'solid' | 'gradient' | 'animated' | 'aurora';
export type ButtonShape = 'rounded' | 'pill' | 'sharp';
export type ButtonElevation = 'none' | 'subtle' | 'raised';
export type ButtonMaterial = 'solid' | 'glass';
export type RadiusScale = 'sharp' | 'soft' | 'round';

export interface Theme {
  name: string;

  /** Цвета (hex). Управляют фоном, карточками, текстом, акцентом, кнопками. */
  colors: {
    page: string;          // базовый фон страницы
    surface: string;       // карточки / инпуты (bg-card)
    surface2: string;      // приподнятая поверхность (bg-card-2)
    line: string;          // границы / разделители (border-line)
    text: string;          // основной текст
    muted: string;         // вторичный текст (text-muted)
    hint: string;          // подсказки / плейсхолдеры (text-hint)
    brand: string;         // акцент (bg-brand, иконки, активные элементы)
    brandLight: string;    // светлый край градиента кнопки
    brandDark: string;     // тёмный край градиента кнопки + hover
    brandMuted: string;    // disabled-состояние primary
    brandContrast: string; // текст НА акцентной заливке (на bg-brand)
  };

  /** Фон приложения. */
  background: {
    type: BackgroundType;  // solid | gradient | animated
    colors: string[];      // 2–4 цвета для gradient/animated
    speed: number;         // сек на цикл (для animated)
  };

  /** Кнопки. */
  button: {
    shape: ButtonShape;          // rounded | pill | sharp
    elevation: ButtonElevation;  // none | subtle | raised
    primaryGradient: boolean;    // заливать primary градиентом из brand-цветов
    material?: ButtonMaterial;   // solid (по умолчанию) | glass (жидкое стекло)
    uppercase?: boolean;         // КАПС + трекинг (редакторский/брутальный вид)
  };

  /** Глобальное скругление углов карточек/плиток. По умолчанию 'soft'. */
  radius?: RadiusScale;          // sharp (острые) | soft | round

  /** Доп. эффекты слоёв. */
  effects?: {
    grain?: boolean;             // плёночное зерно поверх всего
  };
}

/* ============================================================
   ТЕМЫ. Скопируй блок и поменяй значения — получишь свою.
   ============================================================ */
export const themes = {
  /** Nails Verkula — белый с золотом (светлая тема). */
  nailsGold: {
    name: 'Nails Gold',
    colors: {
      page: '#ffffff',
      surface: '#ffffff',
      surface2: '#fbf3e2',
      line: '#f0d888',
      text: '#1a1208',
      muted: '#b09050',
      hint: '#c4a870',
      brand: '#c9a84c',
      brandLight: '#dcc06a',
      brandDark: '#8a6418',
      brandMuted: '#e3d4a3',
      brandContrast: '#ffffff',
    },
    background: { type: 'solid', colors: ['#ffffff'], speed: 0 },
    button: { shape: 'rounded', elevation: 'subtle', primaryGradient: false, material: 'solid' },
    radius: 'soft',
  },

  /** Премиум: золото на чёрном. */
  premiumDark: {
    name: 'Premium Dark',
    colors: {
      page: '#000000',
      surface: '#141414',
      surface2: '#1f1f1f',
      line: '#2b2b2b',
      text: '#ffffff',
      muted: '#a8a8a8',
      hint: '#6e6e6e',
      brand: '#d4af37',
      brandLight: '#e8c659',
      brandDark: '#a68d28',
      brandMuted: '#6b5a23',
      brandContrast: '#1a1400',
    },
    background: { type: 'animated', colors: ['#1a1a1a', '#000000', '#121212'], speed: 22 },
    button: { shape: 'rounded', elevation: 'raised', primaryGradient: true },
  },

  /** Ink & Void: глубокий navy + фиолетовый акцент. */
  inkVoid: {
    name: 'Ink & Void',
    colors: {
      page: '#0a0e27',
      surface: '#141829',
      surface2: '#1a1f3a',
      line: '#2a3550',
      text: '#e8e9f3',
      muted: '#a0a8c0',
      hint: '#7a8299',
      brand: '#7c3aed',
      brandLight: '#a78bfa',
      brandDark: '#6d28d9',
      brandMuted: '#5b21b6',
      brandContrast: '#ffffff',
    },
    background: { type: 'animated', colors: ['#0a0e27', '#1a1f3a', '#2d1b4e'], speed: 20 },
    button: { shape: 'pill', elevation: 'raised', primaryGradient: true },
  },

  /** Soft Glass: нежная лавандовая пастель на мягком тёмном + жидкое стекло. */
  softGlass: {
    name: 'Soft Glass',
    colors: {
      page: '#181526',
      surface: '#221d33',
      surface2: '#2b2540',
      line: '#38304f',
      text: '#efeaf6',
      muted: '#bcb4cf',
      hint: '#877e9e',
      brand: '#c4b5fd',
      brandLight: '#ddd2ff',
      brandDark: '#a78bfa',
      brandMuted: '#6c5f93',
      brandContrast: '#221a33',
    },
    background: { type: 'aurora', colors: ['#1b1730', '#241d3d', '#322a4f'], speed: 24 },
    button: { shape: 'pill', elevation: 'raised', primaryGradient: false, material: 'glass' },
    radius: 'round',
    effects: { grain: false },
  },

  /** Ink Noir: дерзкий монохром — костяной текст + кровяной акцент на чёрном, острые углы, зерно. */
  inkNoir: {
    name: 'Ink Noir',
    colors: {
      page: '#0b0a0a',
      surface: '#141211',
      surface2: '#1d1a18',
      line: '#2c2825',
      text: '#f2ede2',
      muted: '#9a948a',
      hint: '#6a655d',
      brand: '#d6492f',
      brandLight: '#e8654b',
      brandDark: '#a8331f',
      brandMuted: '#5e2a22',
      brandContrast: '#f2ede2',
    },
    background: { type: 'animated', colors: ['#0b0a0a', '#141110', '#0b0a0a'], speed: 26 },
    button: { shape: 'sharp', elevation: 'none', primaryGradient: false, material: 'solid', uppercase: true },
    radius: 'sharp',
    effects: { grain: true },
  },

  /** Тёмно-синий «glass»-вайб. */
  darkBlue: {
    name: 'Dark Blue',
    colors: {
      page: '#0f0f1e',
      surface: '#1a1a2e',
      surface2: '#222244',
      line: '#2f2f55',
      text: '#ffffff',
      muted: '#aab3d6',
      hint: '#6b73a0',
      brand: '#3b82f6',
      brandLight: '#60a5fa',
      brandDark: '#1e40af',
      brandMuted: '#3a4a78',
      brandContrast: '#04122e',
    },
    background: { type: 'animated', colors: ['#0f0f1e', '#16213e', '#1a1a2e'], speed: 20 },
    button: { shape: 'rounded', elevation: 'raised', primaryGradient: true },
  },

  /** Неон: тёмный фон + кислотный акцент. */
  neon: {
    name: 'Neon',
    colors: {
      page: '#0a0e27',
      surface: '#141829',
      surface2: '#1f2542',
      line: '#2b3358',
      text: '#ffffff',
      muted: '#9fb0c9',
      hint: '#5e6b8a',
      brand: '#39ff14',
      brandLight: '#7dff5e',
      brandDark: '#16c000',
      brandMuted: '#1d5a14',
      brandContrast: '#02240a',
    },
    background: { type: 'animated', colors: ['#0a0e27', '#1a1f3a', '#141829'], speed: 14 },
    button: { shape: 'pill', elevation: 'raised', primaryGradient: true },
  },

  /** Светлая пастель (зелёный). ⚠️ светлая тема — см. README ниже. */
  lightGreen: {
    name: 'Light Green',
    colors: {
      page: '#FEFEF9',
      surface: '#ffffff',
      surface2: '#F5F1E8',
      line: '#E2DECF',
      text: '#1F2937',
      muted: '#4B5563',
      hint: '#9CA3AF',
      brand: '#9DC183',
      brandLight: '#B8C5A6',
      brandDark: '#7BA860',
      brandMuted: '#C2D1B3',
      brandContrast: '#1f2e14',
    },
    background: { type: 'animated', colors: ['#9DC183', '#E8E4D0', '#FEFEF9'], speed: 18 },
    button: { shape: 'rounded', elevation: 'subtle', primaryGradient: true },
  },
} satisfies Record<string, Theme>;

/* ============================================================
   ★ АКТИВНАЯ ТЕМА — поменяй здесь.
   Доступно: themes.premiumDark | themes.darkBlue | themes.neon | themes.lightGreen
   ============================================================ */
export const ACTIVE_THEME: Theme = themes.nailsGold;

/** Алиас для обратной совместимости (Button и т.п. читают THEME.button). */
export const THEME = ACTIVE_THEME;

/* ============================================================
   Применение темы: пишем CSS-переменные на :root.
   Каналы (R G B) — чтобы Tailwind-утилиты с прозрачностью (bg-brand/15) работали.
   ============================================================ */
function hexToChannels(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function applyTheme(theme: Theme = ACTIVE_THEME): void {
  const root = document.documentElement;
  const c = theme.colors;
  const v = (k: string, val: string) => root.style.setProperty(k, val);

  v('--page', hexToChannels(c.page));
  v('--surface', hexToChannels(c.surface));
  v('--surface-2', hexToChannels(c.surface2));
  v('--line', hexToChannels(c.line));
  v('--text', hexToChannels(c.text));
  v('--muted', hexToChannels(c.muted));
  v('--hint', hexToChannels(c.hint));
  v('--brand', hexToChannels(c.brand));
  v('--brand-light', hexToChannels(c.brandLight));
  v('--brand-dark', hexToChannels(c.brandDark));
  v('--brand-muted', hexToChannels(c.brandMuted));
  v('--brand-contrast', hexToChannels(c.brandContrast));

  const [c1, c2, c3] = theme.background.colors;
  v('--bg-c1', c1);
  v('--bg-c2', c2 ?? c1);
  v('--bg-c3', c3 ?? c2 ?? c1);
  v('--bg-speed', `${theme.background.speed}s`);

  // Радиус карточек/плиток (rounded-card / rounded-tile в Tailwind).
  const r = RADIUS_PX[theme.radius ?? 'soft'];
  v('--radius-card', r.card);
  v('--radius-tile', r.tile);
}

const RADIUS_PX: Record<RadiusScale, { card: string; tile: string }> = {
  sharp: { card: '2px', tile: '2px' },
  soft: { card: '16px', tile: '12px' },
  round: { card: '24px', tile: '18px' },
};

/* ============================================================
   Хелперы вида (классы — литералы, чтобы Tailwind их не вырезал).
   ============================================================ */

/** Класс фона для корневого контейнера лейаута. */
export function getBackgroundProps(): { className: string; style: CSSProperties } {
  switch (ACTIVE_THEME.background.type) {
    case 'aurora':
      // Аврора — отдельный fixed-слой <AuroraBackground/>; на корне фона нет.
      return { className: '', style: {} };
    case 'animated':
      return { className: 'bg-animated', style: {} };
    case 'gradient':
      return { className: 'bg-theme-gradient', style: {} };
    case 'solid':
    default:
      return { className: 'bg-theme-solid', style: {} };
  }
}

/** Нужно ли рендерить компонент авроры для активной темы. */
export function isAuroraBackground(): boolean {
  return ACTIVE_THEME.background.type === 'aurora';
}

/** Включено ли плёночное зерно в активной теме. */
export function hasGrain(): boolean {
  return ACTIVE_THEME.effects?.grain === true;
}

/** Скругление кнопок. */
export function getButtonShapeClass(): string {
  switch (ACTIVE_THEME.button.shape) {
    case 'pill':
      return 'rounded-full';
    case 'sharp':
      return 'rounded-none';
    case 'rounded':
    default:
      return 'rounded-2xl';
  }
}

/** Тень/объём кнопок. */
export function getButtonElevationClass(): string {
  switch (ACTIVE_THEME.button.elevation) {
    case 'raised':
      return 'shadow-lg shadow-black/25';
    case 'subtle':
      return 'shadow-sm';
    case 'none':
    default:
      return '';
  }
}
