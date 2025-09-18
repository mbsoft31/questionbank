// app/api/_lib/sql-dal.ts
import { sqlite } from "@/lib/sqlite";

// Small helpers
const parse = (x: any) => (typeof x === "string" ? JSON.parse(x) : x);
const toBool = (n: any) => !!Number(n);

// Converts URLSearchParams → {page,pageSize,limit,offset}
export function getPage(searchParams: URLSearchParams) {
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    return { page, pageSize, limit, offset };
}

// Build dynamic WHERE with named params
function whereDraft(params: {
    status?: string | null;
    item_type?: string | null;
    concept_id?: string | null;
    q?: string | null;
}) {
    const conds: string[] = [];
    const bind: Record<string, any> = {};

    if (params.status) { conds.push("d.status = @status"); bind.status = params.status; }
    if (params.item_type) { conds.push("d.item_type = @item_type"); bind.item_type = params.item_type; }
    if (params.concept_id) {
        conds.push(`EXISTS (SELECT 1 FROM item_concepts ic WHERE ic.item_id = d.id AND ic.concept_id = @concept_id)`);
        bind.concept_id = params.concept_id;
    }
    if (params.q && params.q.trim()) {
        // LIKE scan. Consider FTS5 for scale (see notes).
        conds.push(`(LOWER(d.stem_ar) LIKE '%' || LOWER(@q) || '%' OR LOWER(IFNULL(d.latex,'')) LIKE '%' || LOWER(@q) || '%')`);
        bind.q = params.q.trim();
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    return { where, bind };
}

export type IncludeDraft = Array<"options"|"hints"|"solution"|"media"|"tags"|"concepts">;

// Batch fetch child rows for many items (avoid N+1)
function fetchDraftChildren(ids: string[], include: IncludeDraft) {
    const result: any = {};
    if (!ids.length || !include.length) return result;

    const placeholders = ids.map((_, i) => `@id${i}`).join(",");
    const idBind = Object.fromEntries(ids.map((id, i) => [`id${i}`, id]));

    if (include.includes("options")) {
        result.options = sqlite
            .prepare(`SELECT * FROM item_options WHERE owner_type='draft' AND owner_id IN (${placeholders}) ORDER BY order_index`)
            .all(idBind)
            .map(o => ({ ...o, is_correct: toBool(o.is_correct), meta: parse(o.meta) }));
    }

    if (include.includes("hints")) {
        result.hints = sqlite
            .prepare(`SELECT * FROM item_hints WHERE owner_type='draft' AND owner_id IN (${placeholders}) ORDER BY order_index`)
            .all(idBind)
            .map(h => ({ ...h, meta: parse(h.meta) }));
    }

    if (include.includes("solution")) {
        result.solutions = sqlite
            .prepare(`SELECT * FROM item_solutions WHERE owner_type='draft' AND owner_id IN (${placeholders})`)
            .all(idBind)
            .map(s => ({ ...s, steps: parse(s.steps), meta: parse(s.meta) }));
    }

    if (include.includes("media")) {
        result.media = sqlite
            .prepare(`SELECT * FROM item_media WHERE owner_type='draft' AND owner_id IN (${placeholders}) ORDER BY order_index`)
            .all(idBind);
    }

    if (include.includes("tags")) {
        result.tags = sqlite
            .prepare(`
        SELECT it.item_id, t.* 
        FROM item_tags it 
        JOIN tags t ON t.id = it.tag_id
        WHERE it.item_id IN (${placeholders})
      `)
            .all(idBind);
    }

    if (include.includes("concepts")) {
        result.concepts = sqlite
            .prepare(`
        SELECT ic.item_id, c.* 
        FROM item_concepts ic 
        JOIN concepts c ON c.id = ic.concept_id
        WHERE ic.item_id IN (${placeholders})
      `)
            .all(idBind)
            .map((c:any) => ({ ...c, meta: parse(c.meta) }));
    }

    return result;
}

export async function fetchDraftPage(
    searchParams: URLSearchParams,
    include: IncludeDraft
) {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const status = searchParams.get("status");
    const item_type = searchParams.get("item_type");
    const concept_id = searchParams.get("concept_id");
    const q = searchParams.get("q");

    const { where, bind } = whereDraft({ status, item_type, concept_id, q });

    const total = sqlite.prepare(`SELECT COUNT(1) as n FROM items_draft d ${where}`).get(bind)?.n ?? 0;

    const rows = sqlite.prepare(`
    SELECT d.* 
    FROM items_draft d
    ${where}
    ORDER BY d.updated_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...bind, limit, offset })
        .map((d:any) => ({ ...d, meta: parse(d.meta) }));

    // Expand includes (batch)
    if (include.length) {
        const ids = rows.map((r:any) => r.id);
        const child = fetchDraftChildren(ids, include);

        // Attach
        const byId: any = Object.fromEntries(rows.map((r:any) => [r.id, { ...r }]));
        if (child.options) child.options.forEach((o:any)=>{ (byId[o.owner_id].options ||= []).push(o); });
        if (child.hints)   child.hints.forEach((h:any)=>{ (byId[h.owner_id].hints   ||= []).push(h); });
        if (child.solutions) child.solutions.forEach((s:any)=>{ byId[s.owner_id].solution = s; });
        if (child.media)   child.media.forEach((m:any)=>{ (byId[m.owner_id].media   ||= []).push(m); });
        if (child.tags)    child.tags.forEach((t:any)=>{ (byId[t.item_id].tags      ||= []).push(t); });
        if (child.concepts)child.concepts.forEach((c:any)=>{ (byId[c.item_id].concepts ||= []).push(c); });

        const data = ids.map(id => byId[id]);
        return { data, page, pageSize, total };
    }

    return { data: rows, page, pageSize, total };
}

export async function fetchDraftById(id: string, include: IncludeDraft) {
    const row = sqlite.prepare(`SELECT * FROM items_draft WHERE id=@id`).get({ id });
    if (!row) return null;
    const item = { ...row, meta: parse(row.meta) } as any;

    if (!include.length) return item;

    const child = fetchDraftChildren([id], include);
    if (child.options) item.options = child.options.filter((x:any)=>x.owner_id===id);
    if (child.hints) item.hints = child.hints.filter((x:any)=>x.owner_id===id);
    if (child.solutions) item.solution = child.solutions.find((x:any)=>x.owner_id===id);
    if (child.media) item.media = child.media.filter((x:any)=>x.owner_id===id);
    if (child.tags) item.tags = child.tags.filter((x:any)=>x.item_id===id);
    if (child.concepts) item.concepts = child.concepts.filter((x:any)=>x.item_id===id);

    return item;
}

// --------- PROD (same idea) ---------

export type IncludeProd = Array<"options"|"hints"|"solution">;

function fetchProdChildren(ids: string[], include: IncludeProd) {
    const result: any = {};
    if (!ids.length || !include.length) return result;
    const placeholders = ids.map((_, i) => `@id${i}`).join(",");
    const idBind = Object.fromEntries(ids.map((id, i) => [`id${i}`, id]));

    if (include.includes("options")) {
        result.options = sqlite
            .prepare(`SELECT * FROM item_options WHERE owner_type='prod' AND owner_id IN (${placeholders}) ORDER BY order_index`)
            .all(idBind)
            .map(o => ({ ...o, is_correct: toBool(o.is_correct), meta: parse(o.meta) }));
    }
    if (include.includes("hints")) {
        result.hints = sqlite
            .prepare(`SELECT * FROM item_hints WHERE owner_type='prod' AND owner_id IN (${placeholders}) ORDER BY order_index`)
            .all(idBind)
            .map(h => ({ ...h, meta: parse(h.meta) }));
    }
    if (include.includes("solution")) {
        result.solutions = sqlite
            .prepare(`SELECT * FROM item_solutions WHERE owner_type='prod' AND owner_id IN (${placeholders})`)
            .all(idBind)
            .map(s => ({ ...s, steps: parse(s.steps), meta: parse(s.meta) }));
    }
    return result;
}

export async function fetchProdPage(
    searchParams: URLSearchParams,
    include: IncludeProd
) {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const item_type = searchParams.get("item_type");
    const concept_id = searchParams.get("concept_id");
    const q = searchParams.get("q");

    const conds: string[] = [];
    const bind: Record<string, any> = {};
    if (item_type) { conds.push("p.item_type = @item_type"); bind.item_type = item_type; }
    if (concept_id) { conds.push("p.concept_main_id = @concept_id"); bind.concept_id = concept_id; }
    if (q && q.trim()) {
        conds.push(`(LOWER(p.stem_ar) LIKE '%' || LOWER(@q) || '%' OR LOWER(IFNULL(p.latex,'')) LIKE '%' || LOWER(@q) || '%')`);
        bind.q = q.trim();
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = sqlite.prepare(`SELECT COUNT(1) as n FROM items_prod p ${where}`).get(bind)?.n ?? 0;

    const rows = sqlite.prepare(`
    SELECT p.* FROM items_prod p
    ${where}
    ORDER BY p.published_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...bind, limit, offset })
        .map((p:any) => ({ ...p, difficulty_params: parse(p.difficulty_params), meta: parse(p.meta) }));

    if (include.length) {
        const ids = rows.map((r:any)=>r.id);
        const child = fetchProdChildren(ids, include);
        const byId: any = Object.fromEntries(rows.map((r:any)=>[r.id, { ...r }]));
        if (child.options) child.options.forEach((o:any)=>{ (byId[o.owner_id].options ||= []).push(o); });
        if (child.hints)   child.hints.forEach((h:any)=>{ (byId[h.owner_id].hints   ||= []).push(h); });
        if (child.solutions) child.solutions.forEach((s:any)=>{ byId[s.owner_id].solution = s; });
        const data = ids.map(id => byId[id]);
        return { data, page, pageSize, total };
    }
    return { data: rows, page, pageSize, total };
}

export async function fetchProdById(id: string, include: IncludeProd) {
    const p = sqlite.prepare(`SELECT * FROM items_prod WHERE id=@id`).get({ id });
    if (!p) return null;
    const item = { ...p, difficulty_params: parse(p.difficulty_params), meta: parse(p.meta) } as any;
    if (!include.length) return item;

    const child = fetchProdChildren([id], include);
    if (child.options) item.options = child.options.filter((x:any)=>x.owner_id===id);
    if (child.hints) item.hints = child.hints.filter((x:any)=>x.owner_id===id);
    if (child.solutions) item.solution = child.solutions.find((x:any)=>x.owner_id===id);
    return item;
}

// --------- Concepts (with filtering & pagination) ---------
export async function fetchConceptPage(searchParams: URLSearchParams) {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const grade = searchParams.get("grade");
    const strand = searchParams.get("strand");
    const q = searchParams.get("q");

    const conds: string[] = [];
    const bind: Record<string, any> = {};
    if (grade) { conds.push("c.grade = @grade"); bind.grade = Number(grade); }
    if (strand) { conds.push("c.strand = @strand"); bind.strand = strand; }
    if (q && q.trim()) { conds.push("(LOWER(c.name_ar) LIKE '%'||LOWER(@q)||'%' OR LOWER(c.code) LIKE '%'||LOWER(@q)||'%')"); bind.q = q.trim(); }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = sqlite.prepare(`SELECT COUNT(1) as n FROM concepts c ${where}`).get(bind)?.n ?? 0;
    const data = sqlite.prepare(`
    SELECT c.* FROM concepts c
    ${where}
    ORDER BY c.grade, c.order_index
    LIMIT @limit OFFSET @offset
  `).all({ ...bind, limit, offset })
        .map((c:any)=>({ ...c, meta: parse(c.meta) }));

    return { data, page, pageSize, total };
}
