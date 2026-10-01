import { Link, type Href } from "expo-router";
import { styled } from "nativewind";
import { useState, type PropsWithChildren, type Ref } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView as NativeSafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/theme";

const SafeAreaView = styled(NativeSafeAreaView);

export function AuthShell({
  title,
  subtitle,
  children,
  referenceLayout = false,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
  referenceLayout?: boolean;
}>) {
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName={
            referenceLayout ? "auth-reference-content" : "auth-content"
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            className={`auth-width ${referenceLayout ? "auth-reference" : ""}`}
          >
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <Image
                  source={require("@/assets/icons/logo.png")}
                  accessibilityLabel="Recurrly logo"
                  className="size-14"
                  resizeMode="contain"
                />
                <View>
                  <Text className="auth-wordmark">Recurrly</Text>
                  <Text className="auth-wordmark-sub">SMART BILLING</Text>
                </View>
              </View>
              <Text accessibilityRole="header" className="auth-title">
                {title}
              </Text>
              <Text className="auth-subtitle">{subtitle}</Text>
            </View>
            <View className="auth-card">
              <View className="auth-form">{children}</View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({
  label,
  error,
  password,
  showToggle = true,
  inputRef,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  password?: boolean;
  showToggle?: boolean;
  inputRef?: Ref<TextInput>;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <View
        className={`auth-input-wrap ${focused ? "auth-input-focused" : ""} ${error ? "auth-input-error" : ""}`}
      >
        <TextInput
          {...props}
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.mutedForeground}
          className="auth-text-input"
          secureTextEntry={password && !visible}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {password && showToggle && (
          <Pressable
            disabled={props.editable === false}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            onPress={() => setVisible(!visible)}
            className="auth-reveal"
          >
            <Text className="auth-link">{visible ? "Hide" : "Show"}</Text>
          </Pressable>
        )}
      </View>
      {error && <AuthMessage message={error} />}
    </View>
  );
}

export function AuthMessage({
  message,
  success = false,
}: {
  message?: string;
  success?: boolean;
}) {
  if (!message) return null;
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={success ? "auth-helper" : "auth-error"}
    >
      {message}
    </Text>
  );
}

export function AuthButton({
  label,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      className={`${secondary ? "auth-secondary-button" : "auth-button"} ${disabled || busy ? "auth-button-disabled" : ""}`}
    >
      <View className="auth-action-row">
        {busy && <ActivityIndicator color={colors.primary} />}
        <Text
          className={
            secondary ? "auth-secondary-button-text" : "auth-button-text"
          }
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function AuthLink({
  href,
  children,
  disabled = false,
}: PropsWithChildren<{ href: Href; disabled?: boolean }>) {
  return (
    <Link href={href} replace asChild>
      <Pressable
        disabled={disabled}
        accessibilityState={{ disabled }}
        accessibilityRole="link"
        className="auth-text-link"
      >
        <Text className="auth-link">{children}</Text>
      </Pressable>
    </Link>
  );
}
