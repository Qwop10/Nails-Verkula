/**
 * services/orderService.ts
 * Service для работы с заказами — обращается к нашему backend REST API.
 */

import type { Order, ApiResponse, Price } from '../types';
import { apiGet, apiPost, apiDelete } from '../api/api_http';

class OrderService {
  /** Создаёт новую заявку (клиент определяется по Telegram initData на сервере). */
  async createOrder(
    orderData: Partial<Order>
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>('/orders', orderData);
  }

  /** Заявки текущего клиента. */
  async getClientOrders(): Promise<ApiResponse<Order[]>> {
    return apiGet<Order[]>('/orders/mine');
  }

  /** Кол-во активных заявок клиента. */
  async getActiveCount(): Promise<ApiResponse<{ count: number }>> {
    return apiGet<{ count: number }>('/orders/active-count');
  }

  /** Одна заявка по id (владелец или мастер). */
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiGet<Order>(`/orders/${orderId}`);
  }

  /** Клиент загружает чек об оплате (data URL изображения). */
  async uploadReceipt(
    orderId: string,
    dataUrl: string
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/receipt`, { dataUrl });
  }

  /** Все заявки (для мастера). */
  async getMasterOrders(): Promise<ApiResponse<Order[]>> {
    return apiGet<Order[]>('/orders');
  }

  /** Мастер подтверждает запись после оплаты. */
  async confirmOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/confirm`, {});
  }

  /** Удаляет заявку (клиент — свои завершённые/отклонённые; мастер — любые). */
  async deleteOrder(orderId: string): Promise<ApiResponse<{ id: string }>> {
    return apiDelete<{ id: string }>(`/orders/${orderId}`);
  }

  /** Клиент отвечает на запрос уточнения. */
  async replyToOrder(
    orderId: string,
    message: string
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/reply`, { message });
  }

  /** Назначить стоимость (+ предложить слоты времени). */
  async setOrderPrice(
    orderId: string,
    totalPrice: Price,
    slots: string[] = []
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/price`, {
      amount: totalPrice.amount,
      slots,
    });
  }

  /** Клиент выбирает предложенный слот времени. */
  async selectSlot(orderId: string, slot: string): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/select-slot`, { slot });
  }

  /** Мастер предлагает время без цены (бесплатная консультация). */
  async proposeTime(
    orderId: string,
    slots: string[]
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/propose-time`, { slots });
  }

  /** Запросить уточнение у клиента. */
  async requestClarification(
    orderId: string,
    message: string
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/clarify`, { message });
  }

  /** Отклонить заявку. */
  async rejectOrder(
    orderId: string,
    reason?: string
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/reject`, { reason });
  }

  /** Рассылка всем клиентам. */
  async broadcast(text: string): Promise<ApiResponse<{ total: number; sent: number }>> {
    return apiPost<{ total: number; sent: number }>('/broadcast', { text });
  }
}

export const orderService = new OrderService();
