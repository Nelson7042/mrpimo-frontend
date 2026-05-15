export interface NotificationAction {
  label: string;
  getUrl: (notification: {
    data?: { redirectUrl?: string; entityId?: string };
  }) => string;
}

export const NOTIFICATION_ACTION_MAP: Record<string, NotificationAction> = {
  "bid:reservePriceNotMet": {
    label: "Re-auction Product",
    getUrl: (n) => `/vendor/dashboard/products/${n.data?.entityId}/edit`,
  },
  "product:low-stock": {
    label: "Restock Product",
    getUrl: (n) => `/vendor/dashboard/products/${n.data?.entityId}/edit`,
  },
  "verification:rejected": {
    label: "Resubmit Verification",
    getUrl: () => "/vendor/dashboard/settings",
  },
  "dispute:created": {
    label: "Respond to Dispute",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "dispute:vendor-responded": {
    label: "View Response",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "dispute:resolved": {
    label: "View Resolution",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "advertisement:rejected": {
    label: "Edit Advertisement",
    getUrl: () => "/vendor/dashboard/advert",
  },
  "advertisement:approved": {
    label: "View Advertisement",
    getUrl: () => "/vendor/dashboard/advert",
  },
  "payout:rejected": {
    label: "Request New Payout",
    getUrl: () => "/vendor/dashboard/wallets",
  },
  "subscription:trial_ended": {
    label: "Renew Subscription",
    getUrl: () => "/vendor/dashboard/settings",
  },
  "subscription:expired": {
    label: "Renew Subscription",
    getUrl: () => "/vendor/dashboard/settings",
  },
  "order:new-order": {
    label: "View Order",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "order:shipment_preparing_shipment": {
    label: "Track Order",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "order:shipment_shipped": {
    label: "Track Order",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "order:shipment_in_transit": {
    label: "Track Order",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "order:shipment_out_for_delivery": {
    label: "Track Order",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "order:shipment_delivered": {
    label: "View Order",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "order:shipment_failed": {
    label: "View Order",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "bid:win": {
    label: "View Won Auction",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
  "withdrawal:rejected": {
    label: "Retry Withdrawal",
    getUrl: () => "/vendor/dashboard/wallets",
  },
  "shipping:handoff_reminder": {
    label: "Review Handoff",
    getUrl: (n) => n.data?.redirectUrl || "/",
  },
};

export function getNotificationAction(
  type: string,
  notifCase: string
): NotificationAction | null {
  return NOTIFICATION_ACTION_MAP[`${type}:${notifCase}`] || null;
}
