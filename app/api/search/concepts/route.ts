import { mock, ok, paginate } from "../../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const grade = searchParams.get("grade");

    let docs = mock.msConceptDocs;
    if (q) docs = docs.filter((d) => (d.name_ar + " " + d.code).toLowerCase().includes(q));
    if (grade) docs = docs.filter((d) => String(d.grade) === grade);

    return ok(paginate(docs, searchParams));
}
