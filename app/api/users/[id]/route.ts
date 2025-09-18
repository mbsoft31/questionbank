export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { ok, notFound } from "../../_lib/utils";
import { fetchUserById } from "../../_lib/sql-dal";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
    const { id } = await ctx.params; // Next.js 15: params is a Promise
    const user = await fetchUserById(id);
    if (!user) return notFound("User not found");
    return ok(user);
}
