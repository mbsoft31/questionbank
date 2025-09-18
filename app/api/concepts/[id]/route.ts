import { mock, ok, notFound } from "../../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const concept = mock.concepts.find((c) => c.id === params.id);
    if (!concept) return notFound("Concept not found");
    return ok(concept);
}
