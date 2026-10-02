import { clsx } from "clsx";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_CATEGORY_COLORS,
} from "../../constants/data";
import { icons } from "../../constants/icon";
import { colors } from "../../constants/theme";
import { findBrandIcon } from "@/lib/brandIcons";
import SubscriptionIcon from "./SubscriptionIcon";

type Category = (typeof SUBSCRIPTION_CATEGORIES)[number];
type Frequency = "Monthly" | "Yearly";

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const insets = useSafeAreaInsets();
  const priceRef = useRef<TextInput>(null);
  const submitted = useRef(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<Category>("Other");
  const [nameTouched, setNameTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);
  const [cardTouched, setCardTouched] = useState(false);

  // Decimal keyboards can emit a comma depending on the device locale.
  const decimal = price.trim().replace(",", ".");
  const amount = Number(decimal);
  const validName = name.trim().length > 0;
  const validPrice =
    /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(decimal) &&
    Number.isFinite(amount) &&
    amount > 0;
  const validCard = /^\d{4}$/.test(cardLastFour);
  const brandIcon = findBrandIcon(name);
  const canSubmit = validName && validPrice && validCard;

  function reset() {
    setName("");
    setPrice("");
    setCardLastFour("");
    setFrequency("Monthly");
    setCategory("Other");
    setNameTouched(false);
    setPriceTouched(false);
    setCardTouched(false);
  }

  function close() {
    Keyboard.dismiss();
    reset();
    onClose();
  }

  function submit() {
    setNameTouched(true);
    setPriceTouched(true);
    setCardTouched(true);
    if (!canSubmit || submitted.current) return;
    submitted.current = true;
    const start = dayjs();
    onCreate({
      id: `subscription-${start.valueOf()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      price: amount,
      frequency,
      billing: frequency,
      category,
      status: "active",
      startDate: start.toISOString(),
      renewalDate: start
        .add(1, frequency === "Monthly" ? "month" : "year")
        .toISOString(),
      icon: icons.wallet,
      brandIcon,
      currency: "USD",
      paymentMethod: `Card ending in ${cardLastFour}`,
      color: SUBSCRIPTION_CATEGORY_COLORS[category],
    });

    close();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      onShow={() => {
        submitted.current = false;
      }}
    >
      <View className="modal-overlay">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ paddingTop: insets.top }}
        >
          <Pressable
            className="absolute inset-0"
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close new subscription"
          />
          <View className="modal-container" accessibilityViewIsModal>
            <View className="modal-header">
              <Text className="modal-title" accessibilityRole="header">
                New Subscription
              </Text>
              <Pressable
                className="modal-close"
                onPress={close}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close new subscription"
              >
                <Text className="modal-close-text">×</Text>
              </Pressable>
            </View>
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerClassName="modal-body"
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 20),
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View className="auth-field">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="auth-label">Name</Text>
                  <SubscriptionIcon
                    slug={brandIcon}
                    fallback={icons.wallet}
                    size={40}
                  />
                </View>
                <TextInput
                  className={clsx("auth-input", {
                    "auth-input-error": nameTouched && !validName,
                  })}
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setNameTouched(true)}
                  placeholder="e.g. Spotify"
                  placeholderTextColor={colors.mutedForeground}
                  accessibilityLabel="Subscription name"
                  returnKeyType="next"
                  onSubmitEditing={() => priceRef.current?.focus()}
                />
                {nameTouched && !validName && (
                  <Text className="auth-error" accessibilityLiveRegion="polite">
                    Enter a subscription name.
                  </Text>
                )}
              </View>
              <View className="auth-field">
                <Text className="auth-label">Price (USD)</Text>
                <TextInput
                  ref={priceRef}
                  className={clsx("auth-input", {
                    "auth-input-error": priceTouched && !validPrice,
                  })}
                  value={price}
                  onChangeText={setPrice}
                  onBlur={() => setPriceTouched(true)}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Subscription price in US dollars"
                />
                {priceTouched && !validPrice && (
                  <Text className="auth-error" accessibilityLiveRegion="polite">
                    Enter a price greater than zero.
                  </Text>
                )}
              </View>
              <View className="auth-field">
                <Text className="auth-label">Last four card digits</Text>
                <TextInput
                  className={clsx("auth-input", {
                    "auth-input-error": cardTouched && !validCard,
                  })}
                  value={cardLastFour}
                  onChangeText={(value) =>
                    setCardLastFour(value.replace(/\D/g, "").slice(0, 4))
                  }
                  onBlur={() => setCardTouched(true)}
                  placeholder="e.g. 0042"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoComplete="off"
                  accessibilityLabel="Last four digits of the card used for this subscription"
                />
                {cardTouched && !validCard && (
                  <Text className="auth-error" accessibilityLiveRegion="polite">
                    Enter exactly four card digits.
                  </Text>
                )}
              </View>
              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as const).map((option) => (
                    <Pressable
                      key={option}
                      className={clsx("picker-option", {
                        "picker-option-active": frequency === option,
                      })}
                      onPress={() => setFrequency(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: frequency === option }}
                      accessibilityLabel={`${option} billing`}
                    >
                      <Text
                        className={clsx("picker-option-text", {
                          "picker-option-text-active": frequency === option,
                        })}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {SUBSCRIPTION_CATEGORIES.map((option) => (
                    <Pressable
                      key={option}
                      className={clsx("category-chip", {
                        "category-chip-active": category === option,
                      })}
                      onPress={() => setCategory(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: category === option }}
                      accessibilityLabel={option}
                    >
                      <Text
                        className={clsx("category-chip-text", {
                          "category-chip-text-active": category === option,
                        })}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable
                className={clsx("auth-button", {
                  "auth-button-disabled": !canSubmit,
                })}
                onPress={submit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
              >
                <Text className="auth-button-text">Create Subscription</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
