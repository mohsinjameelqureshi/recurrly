import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAuth,
  validateName,
  signupName,
  authError,
  authNextStep,
  canEnterApp,
  requireEmailConfirmation,
  checkResult,
} from "../src/lib/auth.ts";

test("signup requires a name without rejecting single or international names", () => {
  assert.ok(validateName("  "));
  assert.ok(validateName("a".repeat(201)));
  for (const name of ["Mohsin", "Jean-Luc O’Neill", "李 明"])
    assert.equal(validateName(name), undefined);
  assert.deepEqual(signupName("  Mary   Jane Smith  "), {
    firstName: "Mary",
    lastName: "Jane Smith",
  });
  assert.deepEqual(signupName("Mohsin"), { firstName: "Mohsin", lastName: "" });
});

test("email validation accepts surrounding whitespace and rejects missing domain or whitespace inside", () => {
  assert.deepEqual(validateAuth(" person@example.com ", "x"), {});
  for (const email of ["", "person", "person@", "p @example.com"])
    assert.ok(validateAuth(email).email);
});
test("sign-in does not impose new-password strength rules or trim passwords", () => {
  assert.deepEqual(validateAuth("p@example.com", " "), {});
  assert.deepEqual(validateAuth("p@example.com", "a"), {});
  assert.ok(validateAuth("p@example.com", "").password);
  assert.deepEqual(validateAuth("p@example.com"), {});
});
test("duplicate account errors belong to email", () => {
  assert.equal(
    authError({ errors: [{ code: "form_identifier_exists" }] }).field,
    "email",
  );
});
test("incorrect credentials use the same message for unknown email and incorrect password", () => {
  assert.equal(
    authError({ code: "form_password_incorrect" }).message,
    authError({ code: "form_identifier_not_found" }).message,
  );
});
test("password rejection exposes user-facing policy, including wrapped API errors", () => {
  assert.deepEqual(
    authError({
      cause: {
        errors: [
          {
            code: "form_password_length_too_short",
            longMessage: "Use at least 12 characters.",
          },
        ],
      },
    }),
    { field: "password", message: "Use at least 12 characters." },
  );
  assert.doesNotMatch(
    authError({
      code: "form_password_pwned",
      longMessage: "Clerk policy rejected it",
    }).message,
    /clerk/i,
  );
});
test("code expiry, throttling, and network failures are recoverable", () => {
  assert.equal(authError({ code: "verification_expired" }).field, "code");
  assert.match(authError({ code: "too_many_requests" }).message, /wait/);
  assert.match(
    authError(new TypeError("Failed to fetch")).message,
    /connection/,
  );
});
test("unknown errors never leak implementation details", () => {
  assert.equal(
    authError(new Error("secret internal request")).message,
    "Something went wrong. Please try again.",
  );
});
test("only active sessions without tasks enter protected routes", () => {
  assert.equal(canEnterApp(true, "active"), true);
  for (const status of ["pending", "ended", "expired", undefined])
    assert.equal(canEnterApp(true, status), false);
  assert.equal(canEnterApp(false, "active"), false);
  assert.equal(canEnterApp(undefined, "active"), false);
  assert.equal(canEnterApp(true, "active", true), false);
});
test("incomplete password authentication never counts as complete", () => {
  assert.equal(authNextStep("complete"), "complete");
  assert.equal(authNextStep("needs_client_trust"), "trust");
  for (const status of ["needs_second_factor", "needs_first_factor", null])
    assert.equal(authNextStep(status), "blocked");
});
test("returned SDK errors are thrown and successful results continue", () => {
  assert.doesNotThrow(() => checkResult({ error: null }));
  const error = new Error("failure");
  assert.throws(() => checkResult({ error }), error);
});

test("password session is ended before an email confirmation attempt starts", async () => {
  const calls = [];
  await requireEmailConfirmation({
    attempt: { status: "complete", createdSessionId: "password-session" },
    sessions: [
      {
        id: "password-session",
        status: "active",
        end: async () => {
          calls.push("end");
        },
      },
    ],
    reset: async () => {
      calls.push("reset");
    },
    sendCode: async () => {
      calls.push("send");
    },
  });
  assert.deepEqual(calls, ["end", "reset", "send"]);
});

test("incomplete, missing, pending, and task-bearing password sessions cannot start confirmation", async () => {
  for (const scenario of [
    {
      attempt: { status: "needs_first_factor", createdSessionId: null },
      sessions: [],
    },
    { attempt: { status: "complete", createdSessionId: "s" }, sessions: [] },
    {
      attempt: { status: "complete", createdSessionId: "s" },
      sessions: [{ id: "s", status: "pending", end: async () => {} }],
    },
    {
      attempt: { status: "complete", createdSessionId: "s" },
      sessions: [
        { id: "s", status: "active", currentTask: {}, end: async () => {} },
      ],
    },
  ]) {
    let sent = false;
    await assert.rejects(
      requireEmailConfirmation({
        ...scenario,
        reset: async () => {},
        sendCode: async () => {
          sent = true;
        },
      }),
    );
    assert.equal(sent, false);
  }
});

test("session cleanup failure stops confirmation and never resets or sends a code", async () => {
  const calls = [];
  await assert.rejects(
    requireEmailConfirmation({
      attempt: { status: "complete", createdSessionId: "s" },
      sessions: [
        {
          id: "s",
          status: "active",
          end: async () => {
            throw new Error("offline");
          },
        },
      ],
      reset: async () => {
        calls.push("reset");
      },
      sendCode: async () => {
        calls.push("send");
      },
    }),
  );
  assert.deepEqual(calls, []);
});

test("failed code delivery does not activate the provisional session", async () => {
  let ended = false;
  await assert.rejects(
    requireEmailConfirmation({
      attempt: { status: "complete", createdSessionId: "s" },
      sessions: [
        {
          id: "s",
          status: "active",
          end: async () => {
            ended = true;
          },
        },
      ],
      reset: async () => {},
      sendCode: async () => {
        throw new Error("delivery failed");
      },
    }),
  );
  assert.equal(ended, true);
});
