"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    !EMAIL_PATTERN.test(email)
    || email.length > 254
    || password.length < 8
    || password.length > 128
  ) {
    redirect("/login?error=invalid");
  }

  return { email, password };
}

export async function signIn(formData: FormData) {
  const credentials = getCredentials(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    redirect("/login?error=authentication");
  }

  redirect("/onboarding");
}

export async function signUp(formData: FormData) {
  const credentials = getCredentials(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(credentials);

  if (error) {
    redirect("/login?error=signup");
  }

  redirect("/login?message=confirm");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
