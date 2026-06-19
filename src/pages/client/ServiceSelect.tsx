/**
 * pages/client/ServiceSelect.tsx
 * Выбор услуги: запись / перекрытие / коррекция / консультация (бесплатно).
 */
import React, { useEffect } from 'react';
import { useNav } from '../../hooks';
import { useFormStore } from '../../store';
import { hideMainButton } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { SERVICE_OPTIONS } from '../../constants';
import type { ServiceType } from '../../types';
import { Icon } from '../../components/icons';
import type { IconName } from '../../components/icons';

export const ServiceSelect: React.FC = () => {
  const { navigate } = useNav();
  const resetForm = useFormStore((s) => s.resetForm);
  const setServiceType = useFormStore((s) => s.setServiceType);

  useEffect(() => {
    hideMainButton();
  }, []);

  const choose = (type: ServiceType) => {
    resetForm();
    setServiceType(type);
    navigate(type === 'consultation' ? CLIENT_ROUTES.CONSULT : CLIENT_ROUTES.FORM_SKETCH);
  };

  return (
    <div className="flex-1 flex flex-col">
      <button
        onClick={() => navigate(CLIENT_ROUTES.HOME)}
        className="inline-flex items-center gap-1 text-brand font-medium text-sm self-start mb-5"
      >
        ‹ На главную
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Выберите услугу</h1>
      <p className="text-sm text-muted mb-6">С чем хотите записаться к мастеру</p>

      <div className="space-y-3">
        {SERVICE_OPTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => choose(s.id)}
            className="w-full text-left flex items-center gap-3 rounded-card bg-card border border-line px-4 py-3.5 hover:bg-card-2 transition-colors"
          >
            <div
              className="shrink-0 w-11 h-11 rounded-tile flex items-center justify-center border border-white/10"
              style={{ background: 'rgb(var(--brand) / 0.18)', color: 'rgb(var(--brand))' }}
            >
              <Icon name={s.icon as IconName} size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-white">
                  {s.label}
                </span>
                {s.free && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgb(var(--brand))', color: 'rgb(var(--brand-contrast))' }}
                  >
                    Бесплатно
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">{s.desc}</p>
            </div>
            <span className="text-muted">›</span>
          </button>
        ))}
      </div>
    </div>
  );
};
