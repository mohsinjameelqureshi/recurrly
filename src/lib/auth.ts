export type AuthField = "email" | "password" | "code" | "fullName";
export type AuthErrors = Partial<Record<AuthField, string>>;

export function signupName(value: string) {
  const parts = value.trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

export function validateName(value: string): string | undefined {
  if (!value.trim()) return "Enter your full name.";
  if (value.trim().length > 200) return "Use a name under 200 characters.";
}

export function validateAuth(email: string, password?: string): AuthErrors {
  const errors: AuthErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = "Enter a valid email address.";
  if (password !== undefined && !password.length)
    errors.password = "Enter your password.";
  return errors;
}

export function canEnterApp(
  isSignedIn: boolean | undefined,
  sessionStatus?: string,
  hasTask = false,
) {
  return Boolean(isSignedIn && sessionStatus === "active" && !hasTask);
}

export function authNextStep(status: string | null | undefined) {
  if (status === "complete") return "complete";
  if (status === "needs_client_trust") return "trust";
  return "blocked";
}

// Password authentication creates a session even before finalize(). End that
// provisional session, then start an email-code attempt. Only the verified
// code attempt may be finalized by the form.
export async function requireEmailConfirmation({
  attempt,
  sessions,
  reset,
  sendCode,
}: {
  attempt: { status: string | null; createdSessionId: string | null };
  sessions: {
    id: string;
    status: string;
    currentTask?: unknown;
    end: () => Promise<unknown>;
  }[];
  reset: () => Promise<void>;
  sendCode: () => Promise<void>;
}) {
  const session = sessions.find((item) => item.id === attempt.createdSessionId);
  if (
    attempt.status !== "complete" ||
    !session ||
    !canEnterApp(true, session.status, !!session.currentTask)
  ) {
    throw { code: "confirmation_not_allowed" };
  }
  await session.end();
  await reset();
  await sendCode();
}

export function authError(error: unknown): {
  message: string;
  field?: AuthField;
} {
  type ServiceError = {
    errors?: ServiceError[];
    code?: string;
    longMessage?: string;
    cause?: ServiceError;
  };
  const value = error as ServiceError | null;
  const item = value?.errors?.[0] ?? value?.cause?.errors?.[0] ?? value;
  const code = item?.code ?? "";
  if (/identifier_exists/.test(code))
    return {
      field: "email",
      message: "An account with this email already exists. Try signing in.",
    };
  if (/password_incorrect|identifier_not_found|invalid_credentials/.test(code))
    return {
      message: "We couldn’t sign you in. Check your email and password.",
    };
  if (/password/.test(code))
    return {
      field: "password",
      message:
        item?.longMessage && !/clerk/i.test(item.longMessage)
          ? item.longMessage
          : "Choose a stronger, unique password and try again.",
    };
  if (/verification|code_incorrect|code_expired/.test(code))
    return {
      field: "code",
      message:
        "That code is invalid or has expired. Try again or request a new one.",
    };
  if (/rate|too_many/.test(code))
    return {
      message: "Too many attempts. Please wait a moment before trying again.",
    };
  if (/email_address|identifier_invalid/.test(code))
    return { field: "email", message: "Enter a valid email address." };
  if (/session|not_found|not_allowed|not_supported/.test(code))
    return {
      message:
        "This attempt couldn’t continue. Start over or try another sign-in method.",
    };
  if (/network|offline/.test(code) || error instanceof TypeError)
    return { message: "Check your connection and try again." };
  return { message: "Something went wrong. Please try again." };
}

export function checkResult(result: { error?: unknown }) {
  if (result.error) throw result.error;
}
