import { getRegulations, PasalError } from "@/lib/pasal";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.has("uri") ? "detail" : "search";
  try {
    return Response.json(
      await getRegulations(kind, {
        q: params.get("q") ?? undefined,
        type: params.get("type") ?? undefined,
        uri: params.get("uri") ?? undefined,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof PasalError
            ? error.message
            : "Layanan regulasi belum tersedia. Silakan coba lagi.",
      },
      { status: error instanceof PasalError ? error.status : 500 },
    );
  }
}
