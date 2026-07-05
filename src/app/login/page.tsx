import { signIn, signUp } from "./actions";

const errorMessages: Record<string, string> = {
  invalid: "Enter a valid email and a password between 8 and 128 characters.",
  authentication: "We could not sign you in with those credentials.",
  signup: "We could not create the account. Try again or contact support.",
  confirmation: "The confirmation link is invalid or expired.",
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
    <main className="shell">
      <section className="card" aria-labelledby="login-title">
        <p className="eyebrow">RetailOS secure foundation</p>
        <h1 id="login-title">Sign in to your organization</h1>
        <p className="lede">
          Authentication is provided by Supabase. Organization access is
          enforced again by database row-level security.
        </p>

        {errorMessage ? (
          <p className="notice notice-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {messageKey === "confirm" ? (
          <p className="notice notice-success" role="status">
            Check your email to confirm the account before signing in.
          </p>
        ) : null}

        <form className="stack">
          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              maxLength={128}
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <div className="actions">
            <button className="primary" formAction={signIn} type="submit">
              Sign in
            </button>
            <button className="secondary" formAction={signUp} type="submit">
              Create account
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
