/**
 * types/order.ts
 * Типы для заказов (татуировок)
 */

import { Price, Size } from './types_common';

// ============================================================================
// ENUM-LIKE TYPES
// ============================================================================

export type OrderStatus =
  | 'pending'        // Заявка отправлена, ждёт ответа мастера
  | 'awaiting_price' // Мастер запросил уточнение
  | 'price_set'      // Мастер назначил цену
  | 'payment_pending' // Ожидание оплаты предоплаты
  | 'confirmed'      // Запись подтверждена
  | 'rejected'       // Отклонено мастером
  | 'cancelled';     // Отменено клиентом

export type TattooPlacement =
  | 'arm'
  | 'forearm'
  | 'shoulder'
  | 'hand'
  | 'leg'
  | 'thigh'
  | 'calf'
  | 'back'
  | 'chest'
  | 'neck'
  | 'ribs'
  | 'other';

// ============================================================================
// CLIENT DATA TYPES
// ============================================================================

export interface ClientData {
  name: string;
  age: number;
  phone: string;
  parentName?: string;      // если age < 18
  parentPhone?: string;     // если age < 18
  hasParentalConsent?: boolean; // TODO Backend
}

export interface HealthInfo {
  contraindications: string[];
  otherHealth?: string;
}

export interface ExperienceInfo {
  hasTattoos: boolean;
  tattooCount?: number | null;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface OrderFormData {
  sketches: File[];
  placement: TattooPlacement;
  size: Size;
  client: ClientData;
  health: HealthInfo;
  experience: ExperienceInfo;
  wishes?: string;
}

// ============================================================================
// ORDER ENTITY TYPES
// ============================================================================

export type ServiceType = 'tattoo' | 'coverup' | 'correction' | 'consultation';

export interface Order {
  id: string;
  serviceType?: ServiceType;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAge: number;

  // Данные заявки
  placement: TattooPlacement;
  size: Size;
  sketchUrl: string;
  health: HealthInfo;
  experience: ExperienceInfo;
  wishes?: string;

  // Согласование
  status: OrderStatus;
  masterFeedback?: string;

  // Цена и оплата
  totalPrice?: Price;
  prepayment?: Price;
  paymentProofUrl?: string;

  // Дата и время сеанса
  proposedSlots?: string[]; // ISO-строки, предложенные мастером
  selectedSlot?: string; // выбранный клиентом слот

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// FORM STATE TYPES
// ============================================================================

export interface FormState {
  serviceType: ServiceType;
  sketch: File | null;
  placement: TattooPlacement | null;
  size: Size | null;
  clientName: string;
  clientPhone: string;
  clientAge: number | null;
  parentName: string;
  parentPhone: string;
  contraindications: string[];
  otherHealth: string;
  hasTattoos: boolean | null;
  tattooCount: number | null;
  wishes: string;

  // Metadata
  currentStep: number;
  isValid: boolean;
  errors: Record<string, string>;
}
