/**
 * components/AuroraBackground.tsx
 * Анимированный фон-«аврора»: fixed-слой за контентом с тремя мягкими
 * размытыми пятнами, которые медленно дрейфуют. Цвета берутся из CSS-
 * переменных активной темы (--brand…), стили — в styles/index.css (.aurora).
 * Рендерится из лейаутов, когда theme.config → background.type === 'aurora'.
 */
import React from 'react';

export const AuroraBackground: React.FC = () => (
  <div className="aurora" aria-hidden="true">
    <span className="aurora__blob aurora__blob--1" />
    <span className="aurora__blob aurora__blob--2" />
    <span className="aurora__blob aurora__blob--3" />
  </div>
);
