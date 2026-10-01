import { useClerk, useSignIn, useSignUp } from "@clerk/expo";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import {
  authError,
  authNextStep,
  requireEmailConfirmation,
  canEnterApp,
  checkResult,
  validateAuth,
  validateName,
  signupName,
  type AuthErrors,
} from "@/lib/auth";
import {
  AuthButton,
  AuthField,
  AuthLink,
  AuthMessage,
  AuthShell,
} from "./AuthUI";
type Mode = "signIn" | "signUp" | "forgotPassword";
type Step =
  | "form"
  | "signupCode"
  | "signinCode"
  | "trustCode"
  | "resetCode"
  | "newPassword";
const blocked =
  "Your account needs an additional security step that isn’t available here yet. Start over or contact support.";

export default function AuthFlow({ mode }: { mode: Mode }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const clerk = useClerk();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [photo, setPhoto] = useState<{ uri: string; data: string } | null>(
    null,
  );
  const [photoError, setPhotoError] = useState("");
  const photoSaved = useRef(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const locked = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const emailRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);
  const cooldown = Math.max(0, Math.ceil((resendAt - now) / 1000));
  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
        generation.current++;
        locked.current = false;
        setPassword("");
        setPhoto(null);
        setCode("");
        setBusy(null);
      };
    }, []),
  );
  useEffect(() => {
    if (!resendAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  async function run(action: string, operation: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    const current = generation.current;
    setBusy(action);
    setMessage("");
    setNotice("");
    setErrors({});
    try {
      await operation();
    } catch (error) {
      if (mounted.current && current === generation.current) {
        const mapped = authError(error);
        if (mapped.field) {
          setErrors({ [mapped.field]: mapped.message });
          ({
            email: emailRef,
            password: passwordRef,
            code: codeRef,
            fullName: nameRef,
          })[mapped.field].current?.focus();
        } else setMessage(mapped.message);
      }
    } finally {
      if (mounted.current && current === generation.current) {
        locked.current = false;
        setBusy(null);
      }
    }
  }
  function validate(needsPassword: boolean) {
    const next: AuthErrors =
      step === "newPassword"
        ? !password.length
          ? { password: "Enter your new password." }
          : {}
        : validateAuth(email, needsPassword ? password : undefined);
    if (mode === "signUp" && step === "form")
      next.fullName = validateName(fullName);
    setErrors(next);
    if (next.fullName) nameRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
    return !Object.values(next).some(Boolean);
  }
  async function pickPhoto() {
    await run("photo", async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (result.canceled || !mounted.current) return;
      const image = result.assets[0];
      if (!image.base64) {
        setPhotoError("That photo could not be read. Choose another one.");
        return;
      }
      if (image.base64.length > 8 * 1024 * 1024) {
        setPhotoError("Choose a smaller photo (under 6 MB).");
        return;
      }
      setPhoto({
        uri: image.uri,
        data: `data:image/jpeg;base64,${image.base64}`,
      });
      setPhotoError("");
      photoSaved.current = false;
    });
  }
  function sent(next: Step) {
    if (!mounted.current) return;
    setStep(next);
    setPassword("");
    setCode("");
    setResendAt(Date.now() + 30000);
    setNow(Date.now());
  }
  async function finalize(
    resource: {
      status: string | null;
      createdSessionId: string | null;
      finalize: () => Promise<{ error: unknown }>;
    },
    skipPhoto = false,
  ) {
    if (!mounted.current) return;
    const session = clerk.client?.sessions.find(
      (item) => item.id === resource.createdSessionId,
    );
    if (
      resource.status !== "complete" ||
      !canEnterApp(true, session?.status, !!session?.currentTask)
    ) {
      setMessage(blocked);
      return;
    }
    if (mode === "signUp" && photo && !photoSaved.current && !skipPhoto) {
      try {
        if (!session?.user) throw new Error("Profile unavailable");
        await session.user.setProfileImage({ file: photo.data });
        photoSaved.current = true;
        setPhotoError("");
      } catch {
        setPhotoError(
          "Your account is ready, but the photo could not be saved. Retry or continue without it.",
        );
        return;
      }
    }
    checkResult(await resource.finalize());
  }
  async function finishSignIn() {
    if (!mounted.current) return;
    if (authNextStep(signIn.status) === "trust") {
      setStep("trustCode");
      setPassword("");
      checkResult(await signIn.mfa.sendEmailCode());
      sent("trustCode");
      return;
    }
    if (signIn.status !== "complete") {
      setMessage(blocked);
      return;
    }
    await finalize(signIn);
  }
  async function beginConfirmation(attempt: {
    status: string | null;
    createdSessionId: string | null;
  }) {
    await requireEmailConfirmation({
      attempt,
      sessions: clerk.client?.sessions ?? [],
      reset: async () => {
        checkResult(await signIn.reset());
        checkResult(await signUp.reset());
      },
      sendCode: async () => {
        if (!mounted.current) return;
        setStep("signinCode");
        setPassword("");
        checkResult(
          await signIn.emailCode.sendCode({ emailAddress: email.trim() }),
        );
        sent("signinCode");
      },
    });
  }
  async function submit() {
    if (busy || !validate(mode !== "forgotPassword" || step === "newPassword"))
      return;
    await run("submit", async () => {
      if (step === "newPassword") {
        checkResult(
          await signIn.resetPasswordEmailCode.submitPassword({
            password,
            signOutOfOtherSessions: true,
          }),
        );
        await finishSignIn();
        return;
      }
      if (mode === "signUp") {
        checkResult(
          await signUp.password({
            emailAddress: email.trim(),
            password,
            ...signupName(fullName),
          }),
        );
        if (signUp.status === "complete") {
          await beginConfirmation(signUp);
          return;
        }
        if (
          signUp.missingFields.length ||
          !signUp.unverifiedFields.includes("email_address")
        ) {
          setMessage(blocked);
          return;
        }
        if (!mounted.current) return;
        setStep("signupCode");
        setPassword("");
        checkResult(await signUp.verifications.sendEmailCode());
        sent("signupCode");
      } else if (mode === "signIn") {
        checkResult(
          await signIn.password({ emailAddress: email.trim(), password }),
        );
        if (!mounted.current) return;
        if (signIn.status === "complete") {
          await beginConfirmation(signIn);
        } else await finishSignIn();
      } else {
        checkResult(await signIn.create({ identifier: email.trim() }));
        if (!mounted.current) return;
        setStep("resetCode");
        checkResult(await signIn.resetPasswordEmailCode.sendCode());
        sent("resetCode");
      }
    });
  }
  async function verify() {
    if (busy) return;
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: "Enter the 6-digit code from your email." });
      codeRef.current?.focus();
      return;
    }
    await run("verify", async () => {
      if (step === "signupCode") {
        if (signUp.status !== "complete")
          checkResult(await signUp.verifications.verifyEmailCode({ code }));
        if (mounted.current && signUp.status === "complete")
          await finalize(signUp);
        else setMessage(blocked);
      } else if (step === "signinCode") {
        checkResult(await signIn.emailCode.verifyCode({ code }));
        await finishSignIn();
      } else if (step === "trustCode") {
        checkResult(await signIn.mfa.verifyEmailCode({ code }));
        await finishSignIn();
      } else {
        checkResult(await signIn.resetPasswordEmailCode.verifyCode({ code }));
        if (signIn.status === "needs_new_password") {
          setStep("newPassword");
          setCode("");
        } else setMessage(blocked);
      }
    });
  }
  async function resend() {
    if (busy || cooldown) return;
    await run("resend", async () => {
      if (step === "signupCode") {
        checkResult(await signUp.verifications.sendEmailCode());
      } else if (step === "signinCode") {
        checkResult(await signIn.emailCode.sendCode());
      } else if (step === "trustCode") {
        checkResult(await signIn.mfa.sendEmailCode());
      } else checkResult(await signIn.resetPasswordEmailCode.sendCode());
      setResendAt(Date.now() + 30000);
      setNow(Date.now());
      setNotice("A new code is on its way.");
    });
  }
  function startOver() {
    if (busy) return;
    void run("restart", async () => {
      checkResult(await signIn.reset());
      checkResult(await signUp.reset());
      setStep("form");
      setPassword("");
      setCode("");
      setResendAt(0);
    });
  }
  const verifying = step.endsWith("Code");
  const title = verifying
    ? "Check your email"
    : step === "newPassword"
      ? "A fresh start"
      : mode === "signIn"
        ? "Welcome back"
        : mode === "signUp"
          ? "Make room for clarity"
          : "Reset your password";
  const subtitle = verifying
    ? `Enter the code sent to ${email}.`
    : step === "newPassword"
      ? "Choose a new password for your Recurrly account."
      : mode === "signIn"
        ? "Sign in to continue managing your subscriptions"
        : mode === "signUp"
          ? "Your subscriptions, together. Create your Recurrly account."
          : "Enter your email and we’ll help you get back in.";
  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      referenceLayout={mode === "signIn" && step === "form"}
    >
      {verifying ? (
        <>
          <AuthField
            inputRef={codeRef}
            label="Verification code"
            placeholder="6-digit code"
            value={code}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, "").slice(0, 6));
              setErrors({});
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            editable={!busy}
            error={errors.code}
            onSubmitEditing={() => void verify()}
          />
          <AuthButton
            label="Verify and continue"
            onPress={() => void verify()}
            busy={busy === "verify"}
            disabled={!!busy}
          />
          <AuthButton
            secondary
            label={cooldown ? `Resend code in ${cooldown}s` : "Resend code"}
            onPress={() => void resend()}
            busy={busy === "resend"}
            disabled={!!busy || cooldown > 0}
          />
          <AuthButton
            secondary
            label="Change email or start over"
            onPress={startOver}
            disabled={!!busy}
          />
          {photoError && (
            <AuthButton
              secondary
              label="Continue without photo"
              disabled={!!busy}
              onPress={() =>
                void run("skipPhoto", async () => {
                  await finalize(
                    signUp.status === "complete" ? signUp : signIn,
                    true,
                  );
                })
              }
            />
          )}
        </>
      ) : (
        <>
          {mode === "signUp" && step === "form" && (
            <>
              <View className="auth-photo-row">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    photo
                      ? "Change profile photo"
                      : "Add optional profile photo"
                  }
                  disabled={!!busy}
                  onPress={() => void pickPhoto()}
                  className="auth-photo-preview"
                >
                  {photo ? (
                    <Image
                      source={{ uri: photo.uri }}
                      className="size-16 rounded-full"
                    />
                  ) : (
                    <Text className="auth-photo-initial">
                      {fullName.trim().slice(0, 1).toUpperCase() || "+"}
                    </Text>
                  )}
                </Pressable>
                <View className="flex-1 gap-1">
                  <Text className="auth-label">
                    Profile photo{" "}
                    <Text className="auth-helper">(optional)</Text>
                  </Text>
                  <AuthButton
                    secondary
                    label={photo ? "Change photo" : "Choose photo"}
                    busy={busy === "photo"}
                    disabled={!!busy}
                    onPress={() => void pickPhoto()}
                  />
                  {photo && (
                    <Pressable
                      accessibilityRole="button"
                      disabled={!!busy}
                      onPress={() => {
                        setPhoto(null);
                        setPhotoError("");
                      }}
                      className="auth-text-link"
                    >
                      <Text className="auth-link">Remove photo</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <AuthField
                label="Full name"
                placeholder="Enter your full name"
                inputRef={nameRef}
                value={fullName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                maxLength={200}
                returnKeyType="next"
                editable={!busy}
                error={errors.fullName}
                onChangeText={(value) => {
                  setFullName(value);
                  setErrors((current) => ({ ...current, fullName: undefined }));
                }}
                onBlur={() =>
                  setErrors((current) => ({
                    ...current,
                    fullName: validateName(fullName),
                  }))
                }
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </>
          )}
          {step !== "newPassword" && (
            <AuthField
              inputRef={emailRef}
              label="Email"
              value={email}
              placeholder="Enter your email"
              onChangeText={(value) => {
                setEmail(value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              onBlur={() =>
                setErrors((current) => ({
                  ...current,
                  email: validateAuth(email).email,
                }))
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType={mode === "forgotPassword" ? "done" : "next"}
              onSubmitEditing={() =>
                mode === "forgotPassword"
                  ? void submit()
                  : passwordRef.current?.focus()
              }
              editable={!busy}
              error={errors.email}
            />
          )}
          {(mode !== "forgotPassword" || step === "newPassword") && (
            <AuthField
              inputRef={passwordRef}
              password
              showToggle={mode !== "signIn"}
              label={step === "newPassword" ? "New password" : "Password"}
              value={password}
              placeholder={
                mode === "signIn" ? "Enter your password" : "Create a password"
              }
              onChangeText={(value) => {
                setPassword(value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              onBlur={() => {
                if (!password.length)
                  setErrors((current) => ({
                    ...current,
                    password: "Enter your password.",
                  }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={
                mode === "signIn" ? "current-password" : "new-password"
              }
              textContentType={mode === "signIn" ? "password" : "newPassword"}
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              editable={!busy}
              error={errors.password}
            />
          )}
          {(mode === "signUp" || step === "newPassword") && (
            <Text className="auth-helper">
              Use at least 8 characters. A longer, unique password is best.
            </Text>
          )}
          <AuthButton
            label={
              step === "newPassword"
                ? "Save password and continue"
                : mode === "signIn"
                  ? "Sign in"
                  : mode === "signUp"
                    ? "Create account"
                    : "Send reset code"
            }
            onPress={() => void submit()}
            busy={busy === "submit"}
            disabled={!!busy}
          />
          <View className="auth-link-row">
            <Text className="auth-link-copy">
              {mode === "signIn"
                ? "New to Recurrly?"
                : mode === "signUp"
                  ? "Already have an account?"
                  : "Remember your password?"}
            </Text>
            <AuthLink
              disabled={!!busy}
              href={mode === "signIn" ? "/(auth)/signUp" : "/(auth)/signIn"}
            >
              {mode === "signIn" ? "Create an account" : "Sign in"}
            </AuthLink>
          </View>
        </>
      )}
      <AuthMessage message={message} />
      <AuthMessage message={photoError} />
      {mode === "signIn" && step === "form" && (message || errors.password) && (
        <AuthLink disabled={!!busy} href="/(auth)/forgotPassword">
          Forgot password?
        </AuthLink>
      )}
      <AuthMessage message={notice} success />
    </AuthShell>
  );
}
