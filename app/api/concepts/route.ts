import { mock, ok, paginate } from "../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const strand = searchParams.get("strand"); // algebra | functions | geometry | calculus | stats
    const q = (searchParams.get("q") ?? "").trim();

    let data = mock.concepts;
    if (grade) data = data.filter((c) => String(c.grade) === grade);
    if (strand) data = data.filter((c) => c.strand === strand);
    if (q) data = data.filter((c) =>
        (c.name_ar + " " + c.code).toLowerCase().includes(q.toLowerCase())
    );

    return ok(paginate(data, searchParams));
}
