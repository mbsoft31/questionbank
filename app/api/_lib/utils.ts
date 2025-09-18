import { sqlite } from "@/lib/sqlite";

export const dynamic = "force-dynamic"; // skip route/data cache during dev :contentReference[oaicite:2]{index=2}

export type Paginated<T> = { data: T[]; page: number; pageSize: number; total: number; };
export function ok<T>(data: T, init?: ResponseInit) { return Response.json(data, init); }
export function notFound(message = "Not Found") { return new Response(JSON.stringify({ error: message }), { status: 404, headers: { "content-type": "application/json" } }); }
export function badRequest(message = "Bad Request") { return new Response(JSON.stringify({ error: message }), { status: 400, headers: { "content-type": "application/json" } }); }

export function paginate<T>(list: T[], searchParams: URLSearchParams): Paginated<T> {
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { data: list.slice(start, end), page, pageSize, total: list.length };
}

// tiny helpers
const all = <T = any>(sql: string, params: any = {}) => sqlite.prepare(sql).all(params) as T[];
const one = <T = any>(sql: string, params: any = {}) => sqlite.prepare(sql).get(params) as T | undefined;
const parse = (x: any) => (typeof x === "string" ? JSON.parse(x) : x);

/**
 * Build the same "mock" bundle (arrays) but from SQLite.
 * Routes can keep: `import { mock } from "../_lib/utils"`
 */
function loadMockLike() {
    const users        = all(`SELECT * FROM users`);
    const concepts     = all(`SELECT * FROM concepts`).map(c => ({ ...c, meta: parse(c.meta) }));
    const tags         = all(`SELECT * FROM tags`);
    const mediaAssets  = all(`SELECT * FROM media_assets`).map(m => ({ ...m, meta: parse(m.meta) }));

    const itemsDraft   = all(`SELECT * FROM items_draft`).map(d => ({ ...d, meta: parse(d.meta) }));
    const itemOptions  = all(`SELECT * FROM item_options WHERE owner_type='draft'`).map(o => ({ ...o, is_correct: !!o.is_correct, meta: parse(o.meta) }));
    const itemHints    = all(`SELECT * FROM item_hints WHERE owner_type='draft'`).map(h => ({ ...h, meta: parse(h.meta) }));
    const itemSolutions= all(`SELECT * FROM item_solutions WHERE owner_type='draft'`).map(s => ({ ...s, steps: parse(s.steps), meta: parse(s.meta) }));
    const itemConcepts = all(`SELECT * FROM item_concepts`);
    const itemMedia    = all(`SELECT * FROM item_media WHERE owner_type='draft'`);
    const itemTags     = all(`SELECT * FROM item_tags`);
    const itemVersions = all(`SELECT * FROM item_versions`).map(v => ({ ...v, snapshot: parse(v.snapshot) }));
    const itemReviews  = all(`SELECT * FROM item_reviews`);

    const itemsProd    = all(`SELECT * FROM items_prod`).map(p => ({ ...p, difficulty_params: parse(p.difficulty_params), meta: parse(p.meta) }));
    const prodOptions  = all(`SELECT * FROM item_options WHERE owner_type='prod'`).map(o => ({ ...o, is_correct: !!o.is_correct, meta: parse(o.meta) }));
    const prodHints    = all(`SELECT * FROM item_hints WHERE owner_type='prod'`).map(h => ({ ...h, meta: parse(h.meta) }));
    const prodSolutions= all(`SELECT * FROM item_solutions WHERE owner_type='prod'`).map(s => ({ ...s, steps: parse(s.steps), meta: parse(s.meta) }));

    // Derived Meili-like docs (same shape you had)
    const msConceptDocs = concepts.map((c: any) => ({
        id: c.id, code: c.code, name_ar: c.name_ar, grade: c.grade, strand: c.strand
    }));

    const conceptCodeById = new Map(concepts.map((c:any) => [c.id, c.code]));
    const tagCodeById     = new Map(tags.map((t:any) => [t.id, t.code]));
    const msItemDraftDocs = itemsDraft.map((d:any) => {
        const concept_codes = itemConcepts.filter(ic => ic.item_id === d.id).map(ic => conceptCodeById.get(ic.concept_id)).filter(Boolean) as string[];
        const tag_codes     = itemTags.filter(it => it.item_id === d.id).map(it => tagCodeById.get(it.tag_id)).filter(Boolean) as string[];
        return {
            id: d.id,
            item_type: d.item_type,
            status: d.status,
            stem_ar: d.stem_ar,
            latex: d.latex ?? null,
            concept_codes,
            tag_codes,
            updated_at: d.updated_at
        };
    });

    return {
        users, concepts, tags, mediaAssets,
        itemsDraft, itemOptions, itemHints, itemSolutions, itemConcepts, itemMedia, itemTags, itemVersions, itemReviews,
        itemsProd, prodOptions, prodHints, prodSolutions,
        msConceptDocs, msItemDraftDocs
    };
}

// The exported name stays the same as before:
export const mock = loadMockLike();
