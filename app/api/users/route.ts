import { mock, ok, paginate } from "../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // admin | content-author | reviewer | ...
    let data = mock.users;

    if (role) data = data.filter((u) => u.role === role);
    return ok(paginate(data, searchParams));
}
