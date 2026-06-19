/**
 * components/GrainOverlay.tsx
 * Плёночное зерно поверх всего интерфейса (fixed-слой, не ловит клики).
 * Стили — .grain в styles/index.css. Рендерится из лейаутов, когда
 * theme.config → effects.grain === true.
 */
import React from 'react';

export const GrainOverlay: React.FC = () => (
  <div className="grain" aria-hidden="true" />
);
