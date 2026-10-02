import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { HOME_SUBSCRIPTIONS } from "../../constants/data";
import { posthog } from "@/config/posthog";

interface SubscriptionsContextValue {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(
  null,
);

export function SubscriptionsProvider({ children }: PropsWithChildren) {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(HOME_SUBSCRIPTIONS);
  const addSubscription = useCallback((subscription: Subscription) => {
    setSubscriptions((current) => [subscription, ...current]);
    posthog?.capture("subscription_created", {
      subscription_id: subscription.id,
      subscription_name: subscription.name,
      price: subscription.price,
      currency: subscription.currency ?? "USD",
      frequency: subscription.frequency ?? subscription.billing,
      category: subscription.category ?? "Other",
      status: subscription.status ?? "active",
      brand_icon: subscription.brandIcon ?? null,
    });
  }, []);
  const value = useMemo(
    () => ({ subscriptions, addSubscription }),
    [subscriptions, addSubscription],
  );

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);
  if (!context) {
    throw new Error(
      "useSubscriptions must be used inside SubscriptionsProvider",
    );
  }
  return context;
}
