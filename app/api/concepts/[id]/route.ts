// app/api/concepts/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { ok, notFound } from "../../_lib/utils";
import { fetchConceptById } from "../../_lib/sql-dal";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/concepts/[id]">) {
    const { id } = await ctx.params; // Next 15: params is Promise
    const concept = await fetchConceptById(id);
    if (!concept) return notFound("Concept not found");
    return ok(concept);
}
