/**
 * config/flow.config.ts
 * Декларативное описание анкеты записи — ЕДИНЫЙ источник шагов и их текстов.
 * Для новой ниши меняем порядок/тексты/типы полей здесь.
 *
 * Сейчас экраны читают отсюда заголовки (pageTitle/title/subtitle). Поле `field`
 * описывает тип шага и задел под будущий generic-рендерер (один движок на конфиг).
 */
import { CLIENT_ROUTES } from '../routes';

export type StepField =
  | 'file'
  | 'segmented'
  | 'dimensions'
  | 'number'
  | 'checklist'
  | 'experience'
  | 'textarea';

export interface BookingStep {
  id: string;
  route: string;
  field: StepField;
  pageTitle: string; // верхняя плашка/таб
  title: string; // крупный заголовок
  subtitle?: string;
}

export const BOOKING_STEPS: BookingStep[] = [
  {
    id: 'sketch',
    route: CLIENT_ROUTES.FORM_SKETCH,
    field: 'file',
    pageTitle: 'Фото',
    title: 'Загрузите эскиз',
    subtitle: 'Прикрепите изображение желаемой татуировки',
  },
  {
    id: 'placement',
    route: CLIENT_ROUTES.FORM_PLACEMENT,
    field: 'segmented',
    pageTitle: 'Расположение',
    title: 'Где будет располагаться татуировка?',
  },
  {
    id: 'size',
    route: CLIENT_ROUTES.FORM_SIZE,
    field: 'dimensions',
    pageTitle: 'Размер',
    title: 'Укажите примерный размер',
    subtitle: 'Если не знаете точный размер, укажите приблизительно.',
  },
  {
    id: 'age',
    route: CLIENT_ROUTES.FORM_AGE,
    field: 'number',
    pageTitle: 'Возраст',
    title: 'Сколько вам лет?',
  },
  {
    id: 'health',
    route: CLIENT_ROUTES.FORM_HEALTH,
    field: 'checklist',
    pageTitle: 'Здоровье',
    title: 'Есть ли противопоказания?',
    subtitle: 'Выберите всё, что относится к вам',
  },
  {
    id: 'experience',
    route: CLIENT_ROUTES.FORM_EXPERIENCE,
    field: 'experience',
    pageTitle: 'Опыт',
    title: 'Есть ли у вас опыт татуировок?',
  },
  {
    id: 'wishes',
    route: CLIENT_ROUTES.FORM_WISHES,
    field: 'textarea',
    pageTitle: 'Пожелания',
    title: 'Дополнительная информация',
    subtitle: 'Необязательно, но поможет мастеру лучше понять ваш проект',
  },
];

export const TOTAL_STEPS = BOOKING_STEPS.length;

/** Копия шага по id (для экрана). Бросает понятную ошибку, если id опечатан. */
export function getStep(id: string): BookingStep {
  const s = BOOKING_STEPS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown booking step: ${id}`);
  return s;
}
