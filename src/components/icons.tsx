/**
 * components/icons.tsx
 * Кастомный набор линейных иконок (не эмодзи). Один стиль: viewBox 24,
 * обводка currentColor, скруглённые концы. Цвет наследуется от родителя
 * (color / style), поэтому иконки автоматически следуют теме.
 *
 * Добавить иконку: новая запись в PATHS + имя в IconName.
 */
import React from 'react';

export type IconName =
  | 'home'
  | 'user'
  | 'needle'
  | 'layers'
  | 'edit'
  | 'chat'
  | 'search';

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M6 10.5V19a1 1 0 0 0 1 1h3.5v-4.5h3V20H17a1 1 0 0 0 1-1v-8.5" />
    </>
  ),
  user: (
    <>
      <path d="M12 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z" />
      <path d="M4.8 20c0-3.7 3.2-6.2 7.2-6.2s7.2 2.5 7.2 6.2" />
    </>
  ),
  // тату-машинка / лайнер
  needle: (
    <>
      <path d="M14.4 5.3l4.3 4.3" />
      <path d="M3 21l1.1-4.1L16.6 4.4a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L7.1 19.9 3 21Z" />
      <path d="M9.5 11.5l3 3" />
    </>
  ),
  // перекрытие — стопка слоёв
  layers: (
    <>
      <path d="M12 3.2l8.5 4.6L12 12.4 3.5 7.8 12 3.2Z" />
      <path d="M3.7 12 12 16.6 20.3 12" />
      <path d="M3.7 16.2 12 20.8l8.3-4.6" />
    </>
  ),
  // коррекция — карандаш
  edit: (
    <>
      <path d="M4 20.2h4L19 9.2a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L3.8 16.2v4Z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  // консультация — облако диалога
  chat: (
    <>
      <path d="M20.5 12a8 8 0 0 1-11.4 7.2L4 20.5l1.3-4.6A8 8 0 1 1 20.5 12Z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" />
    </>
  ),
};

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  strokeWidth = 1.7,
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    {PATHS[name]}
  </svg>
);
