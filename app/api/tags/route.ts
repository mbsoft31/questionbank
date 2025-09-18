import { mock, ok, paginate } from "../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind"); // e.g., "skill"
    let data = mock.tags;
    if (kind) data = data.filter((t) => t.kind === kind);
    return ok(paginate(data, searchParams));
}
