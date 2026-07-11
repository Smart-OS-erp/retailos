import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const code = firstParam(params.code);
  const tokenHash = firstParam(params.token_hash);
  const type = firstParam(params.type);
  const next = firstParam(params.next);

  if (code) {
    const query = new URLSearchParams({ code });
    if (next) query.set("next", next);
    redirect(`/auth/confirm?${query.toString()}`);
  }

  if (tokenHash && type) {
    const query = new URLSearchParams({ token_hash: tokenHash, type });
    if (next) query.set("next", next);
    redirect(`/auth/confirm?${query.toString()}`);
  }

  redirect("/onboarding");
}
