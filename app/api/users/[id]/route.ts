import { mock, ok, notFound } from "../../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const user = mock.users.find((u) => u.id === params.id);
    if (!user) return notFound("User not found");
    return ok(user);
}
