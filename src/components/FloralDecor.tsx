/**
 * components/FloralDecor.tsx
 * Декоративные тонкие дуги (как в прототипе). Родитель должен иметь
 * position:relative и overflow:hidden. Не перехватывает клики.
 */
import React from 'react';

export const FloralDecor: React.FC = () => (
  <>
    <svg
      className="pointer-events-none absolute -top-5 -right-5 opacity-[0.07]"
      width="140" height="140" viewBox="0 0 140 140" aria-hidden="true"
    >
      <circle cx="120" cy="20" r="70" fill="none" stroke="#9b6db5" strokeWidth="1.2" />
      <circle cx="120" cy="20" r="46" fill="none" stroke="#9b6db5" strokeWidth=".7" />
    </svg>
    <svg
      className="pointer-events-none absolute -bottom-4 -left-4 opacity-[0.07]"
      width="100" height="100" viewBox="0 0 100 100" aria-hidden="true"
    >
      <circle cx="0" cy="100" r="65" fill="none" stroke="#9b6db5" strokeWidth="1" />
    </svg>
  </>
);
