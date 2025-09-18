import { mock, ok, paginate } from "../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind"); // image | svg | pdf | audio
    let data = mock.mediaAssets;
    if (kind) data = data.filter((m) => m.kind === kind);
    return ok(paginate(data, searchParams));
}
