import { notFound, redirect } from "next/navigation";

const contentIDPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** The browser fallback keeps a canonical content URL without duplicating the reader. */
export default async function ContentFallbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!contentIDPattern.test(id)) notFound();
  redirect(`/news?item=${encodeURIComponent(id)}`);
}
