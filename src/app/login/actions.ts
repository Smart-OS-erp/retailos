"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCredentials(formData: FormData, errorPath: "/login" | "/signup") {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    !EMAIL_PATTERN.test(email)
    || email.length > 254
    || password.length < 8
    || password.length > 128
  ) {
    redirect(`${errorPath}?error=invalid`);
  }

  return { email, password };
}

function safeOrigin(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

async function confirmationRedirectTo() {
  const requestHeaders = await headers();
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  const vercelDeploymentUrl = process.env.VERCEL_URL;
  const vercelHost = vercelBranchUrl || vercelDeploymentUrl;

  if (vercelHost) {
    return `https://${vercelHost}/auth/confirm`;
  }

  const origin = safeOrigin(requestHeaders.get("origin"));
  if (origin) {
    return `${origin}/auth/confirm`;
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return "/auth/confirm";
  }

  return `${proto}://${host}/auth/confirm`;
}

export async function signIn(formData: FormData) {
  const credentials = getCredentials(formData, "/login");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    redirect("/login?error=authentication");
  }

  redirect("/onboarding");
}

export async function signUp(formData: FormData) {
  const credentials = getCredentials(formData, "/signup");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: await confirmationRedirectTo(),
    },
  });

  if (error) {
    redirect("/signup?error=signup");
  }

  redirect("/login?message=confirm");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
