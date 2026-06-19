/**
 * MASTER STORE - Zustand store для управления состоянием кабинета мастера
 * Отдельный модуль для возможности выделения в отдельное приложение
 */

import { create } from 'zustand';
import { Order, Price } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface MasterStoreState {
  // Orders
  orders: Order[];
  selectedOrderId: string | null;
  selectedOrder: Order | null;
  filterStatus: string | null;
  isLoadingOrders: boolean;
  ordersError: string | null;

  // Order actions
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (orderId: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  setLoadingOrders: (loading: boolean) => void;
  setOrdersError: (error: string | null) => void;

  // Order mutations
  updateOrderStatus: (orderId: string, status: string) => void;
  updateOrderPrice: (orderId: string, totalPrice: Price, prepayment: Price) => void;
  updateOrderFeedback: (orderId: string, feedback: string) => void;
  removeOrder: (orderId: string) => void;

  // Filter & Sort
  getFilteredOrders: () => Order[];
  getSortedOrders: (orders: Order[]) => Order[];
}

// ============================================================================
// STORE
// ============================================================================

export const useMasterStore = create<MasterStoreState>((set, get) => ({
  // Initial state
  orders: [],
  selectedOrderId: null,
  selectedOrder: null,
  filterStatus: 'pending',
  isLoadingOrders: false,
  ordersError: null,

  // ====================================================================
  // ORDERS MANAGEMENT
  // ====================================================================

  setOrders: (orders: Order[]) => {
    set({ orders });
  },

  setSelectedOrder: (orderId: string | null) => {
    const order = orderId
      ? get().orders.find((o) => o.id === orderId) || null
      : null;

    set({
      selectedOrderId: orderId,
      selectedOrder: order,
    });
  },

  setFilterStatus: (status: string | null) => {
    set({ filterStatus: status });
  },

  setLoadingOrders: (loading: boolean) => {
    set({ isLoadingOrders: loading });
  },

  setOrdersError: (error: string | null) => {
    set({ ordersError: error });
  },

  // ====================================================================
  // ORDER MUTATIONS
  // ====================================================================

  updateOrderStatus: (orderId: string, status: string) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) =>
        order.id === orderId ? { ...order, status: status as any } : order
      );

      return {
        orders: updatedOrders,
        selectedOrder:
          state.selectedOrder?.id === orderId
            ? { ...state.selectedOrder, status: status as any }
            : state.selectedOrder,
      };
    });
  },

  updateOrderPrice: (orderId: string, totalPrice: Price, prepayment: Price) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              totalPrice,
              prepayment,
              status: 'price_set' as const,
            }
          : order
      );

      return {
        orders: updatedOrders,
        selectedOrder:
          state.selectedOrder?.id === orderId
            ? {
                ...state.selectedOrder,
                totalPrice,
                prepayment,
                status: 'price_set' as const,
              }
            : state.selectedOrder,
      };
    });
  },

  updateOrderFeedback: (orderId: string, feedback: string) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              masterFeedback: feedback,
              status: 'awaiting_price' as const,
            }
          : order
      );

      return {
        orders: updatedOrders,
        selectedOrder:
          state.selectedOrder?.id === orderId
            ? {
                ...state.selectedOrder,
                masterFeedback: feedback,
                status: 'awaiting_price' as const,
              }
            : state.selectedOrder,
      };
    });
  },

  removeOrder: (orderId: string) => {
    set((state) => {
      const updatedOrders = state.orders.filter((o) => o.id !== orderId);
      return {
        orders: updatedOrders,
        selectedOrder:
          state.selectedOrder?.id === orderId ? null : state.selectedOrder,
        selectedOrderId:
          state.selectedOrderId === orderId ? null : state.selectedOrderId,
      };
    });
  },

  // ====================================================================
  // FILTERING & SORTING
  // ====================================================================

  getFilteredOrders: () => {
    const { orders, filterStatus } = get();

    if (!filterStatus) {
      return orders;
    }

    return orders.filter((order) => order.status === filterStatus);
  },

  getSortedOrders: (orders: Order[]) => {
    // Сортируем по дате создания (новые первыми)
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
}));

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Получает отфильтрованные и отсортированные заказы
 */
export const useFilteredOrders = (): Order[] => {
  const filtered = useMasterStore((state) => state.getFilteredOrders());
  const sorted = useMasterStore((state) => state.getSortedOrders(filtered));
  return sorted;
};

/**
 * Получает текущий выбранный заказ
 */
export const useSelectedOrder = (): Order | null => {
  return useMasterStore((state) => state.selectedOrder);
};

/**
 * Получает статус загрузки заказов
 */
export const useOrdersLoading = (): boolean => {
  return useMasterStore((state) => state.isLoadingOrders);
};

/**
 * Получает ошибку при загрузке заказов
 */
export const useOrdersError = (): string | null => {
  return useMasterStore((state) => state.ordersError);
};
