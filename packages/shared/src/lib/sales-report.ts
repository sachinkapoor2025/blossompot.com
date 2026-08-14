import { ORDER_STATUS } from "../constants";
import type { Order } from "../schemas/order";
import {
  ADMIN_ANALYTICS_UTC_OFFSET,
  businessDayKey,
  instantToBusinessDay,
} from "./admin-analytics-tz";

/** Order statuses that count as received payment (excludes pending, cancelled, refunded). */
export const REVENUE_ORDER_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.ON_HOLD,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERY_EXCEPTION,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETE,
] as const;

export type RevenueOrderStatus = (typeof REVENUE_ORDER_STATUSES)[number];

export function isRevenueOrder(status: string): boolean {
  return (REVENUE_ORDER_STATUSES as readonly string[]).includes(status);
}

/** When payment was received — paid status history entry or createdAt fallback. */
export function getOrderPaidAt(order: Pick<Order, "status" | "createdAt" | "statusHistory">): string | null {
  if (!isRevenueOrder(order.status)) return null;
  const paidEntry = order.statusHistory?.find((h) => h.status === ORDER_STATUS.PAID);
  return paidEntry?.at ?? order.createdAt;
}

export type SalesPeriod = "day" | "week" | "month";

export type SalesOrderRow = {
  orderId: string;
  paidAt: string;
  customerName: string;
  email: string;
  total: number;
  currency: "USD" | "INR";
  status: string;
  paymentProvider?: string;
  itemCount: number;
};

export type SalesBucket = {
  label: string;
  date: string;
  orderCount: number;
  revenueUSD: number;
  revenueINR: number;
};

export type SalesPeriodReport = {
  period: SalesPeriod;
  label: string;
  from: string;
  to: string;
  orderCount: number;
  revenueUSD: number;
  revenueINR: number;
  excluded: {
    refunded: number;
    cancelled: number;
    pendingPayment: number;
  };
  breakdown: SalesBucket[];
  orders: SalesOrderRow[];
};

export type SalesReportResponse = {
  generatedAt: string;
  day: SalesPeriodReport;
  week: SalesPeriodReport;
  month: SalesPeriodReport;
};

/** Start of the current IST calendar day (00:00:00 Asia/Kolkata). */
export function startOfIstDay(now = new Date()): Date {
  const day = businessDayKey(now);
  return new Date(`${day}T00:00:00${ADMIN_ANALYTICS_UTC_OFFSET}`);
}

/**
 * Sales period windows use IST midnight (Asia/Kolkata), not UTC.
 * "Today" = from 12:00 AM IST through now.
 */
export function periodRange(period: SalesPeriod, now = new Date()): { from: Date; to: Date; label: string } {
  const to = new Date(now);
  const todayStart = startOfIstDay(now);

  if (period === "day") {
    return { from: todayStart, to, label: "Today" };
  }
  if (period === "week") {
    return {
      from: new Date(todayStart.getTime() - 6 * 86_400_000),
      to,
      label: "Last 7 days",
    };
  }
  return {
    from: new Date(todayStart.getTime() - 29 * 86_400_000),
    to,
    label: "Last 30 days",
  };
}

/** YYYY-MM-DD bucket for sales charts — IST calendar day. */
export function salesDayBucket(isoOrDate: string | Date): string {
  if (isoOrDate instanceof Date) {
    return businessDayKey(isoOrDate);
  }
  return instantToBusinessDay(isoOrDate) ?? businessDayKey(new Date(isoOrDate));
}

export function addToRevenue(totals: { USD: number; INR: number }, currency: "USD" | "INR", amount: number) {
  totals[currency] += amount;
}
