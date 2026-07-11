import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";

import { signIn } from "./actions";

const errorMessages: Record<string, string> = {
  invalid: "Enter a valid email and a password between 8 and 128 characters.",
  authentication: "We could not sign you in with those credentials.",
  confirmation: "This confirmation link is invalid or has expired.",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "";
  const messageKey = typeof params.message === "string" ? params.message : "";
  const errorMessage = errorMessages[errorKey];

  return (
    <AuthShell>
      <div className="auth-card">
        <header className="auth-card-header">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in to RetailOS</h1>
          <p className="lede">
            Continue to your organization’s secure operating workspace.
          </p>
        </header>

        {errorMessage ? (
          <Notice title="Sign-in needs attention" tone="error">
            {errorMessage}
          </Notice>
        ) : null}

        {messageKey === "confirm" ? (
          <Notice title="Confirm your email" tone="success">
            We sent a secure confirmation link. Use it before signing in.
          </Notice>
        ) : null}

        <form action={signIn} className="stack">
          <FormField
            autoComplete="email"
            inputMode="email"
            label="Work email"
            maxLength={254}
            name="email"
            required
            type="email"
          />
          <FormField
            autoComplete="current-password"
            label="Password"
            maxLength={128}
            minLength={8}
            name="password"
            required
            type="password"
          />
          <button className="button button-primary button-full" type="submit">
            Sign in securely
          </button>
        </form>

        <p className="auth-switch">
          New to RetailOS? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </AuthShell>
  );
}
