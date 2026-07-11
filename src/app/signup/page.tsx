import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";

import { signUp } from "@/app/login/actions";

const errorMessages: Record<string, string> = {
  invalid: "Enter a valid email and a password between 8 and 128 characters.",
  signup: "We could not create the account. Try again or contact support.",
};

type SignUpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "";
  const errorMessage = errorMessages[errorKey];

  return (
    <AuthShell>
      <div className="auth-card">
        <header className="auth-card-header">
          <p className="eyebrow">Start securely</p>
          <h1>Create your RetailOS account</h1>
          <p className="lede">
            Establish your identity first. Organization access is granted only
            through a verified membership.
          </p>
        </header>

        {errorMessage ? (
          <Notice title="Account creation needs attention" tone="error">
            {errorMessage}
          </Notice>
        ) : null}

        <form action={signUp} className="stack">
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
            autoComplete="new-password"
            help="Use at least 8 characters. A password manager is recommended."
            label="Password"
            maxLength={128}
            minLength={8}
            name="password"
            required
            type="password"
          />
          <button className="button button-primary button-full" type="submit">
            Create account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
