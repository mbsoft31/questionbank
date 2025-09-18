import { sqlite } from "@/lib/sqlite";

/* ========= Common Types ========= */

export type UUID = string;
export type ISO = string;

export type Strand = "algebra" | "functions" | "geometry" | "calculus" | "stats";
export type ItemType = "mcq" | "multi_select" | "numeric" | "short_text" | "proof";
export type ItemStatus = "draft" | "in_review" | "changes_requested" | "archived";
export type OwnerType = "draft" | "prod";

export interface Paginated<T> {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
}

const parse = <T = unknown>(x: unknown): T =>
    typeof x === "string" ? (JSON.parse(x) as T) : (x as T);
const toBool = (n: unknown) => !!Number(n);

export function getPage(searchParams: URLSearchParams) {
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    return { page, pageSize, limit, offset };
}

type Bind = Record<string, unknown>;

function allRows<T>(sql: string, params: Bind = {}): T[] {
    return sqlite.prepare(sql).all(params) as T[];
}
function getRow<T>(sql: string, params: Bind = {}): T | undefined {
    return sqlite.prepare(sql).get(params) as T | undefined;
}


/* ========= DB Row Shapes (raw table outputs) ========= */

interface DbUser {
    id: UUID; name: string; email: string; role: string; locale: string; created_at: ISO; updated_at: ISO;
}
interface DbConcept {
    id: UUID; code: string; name_ar: string; grade: number; strand: Strand;
    parent_id: UUID | null; order_index: number; meta: string | null; created_at: ISO; updated_at: ISO;
}
interface DbTag { id: UUID; code: string; name_ar: string; kind: string; created_at: ISO; }
interface DbMediaAsset {
    id: UUID; s3_url: string; kind: string; sha256: string; width: number | null; height: number | null;
    meta: string | null; created_at: ISO;
}
interface DbItemDraft {
    id: UUID; status: ItemStatus; item_type: ItemType; stem_ar: string; latex: string | null;
    difficulty_est: number | null; content_hash: string | null; created_by: UUID; updated_by: UUID;
    meta: string | null; created_at: ISO; updated_at: ISO;
}
interface DbItemProd {
    id: UUID; source_draft_id: UUID; item_type: ItemType; stem_ar: string; latex: string | null;
    difficulty_params: string | null; published_ver: number; concept_main_id: UUID | null;
    meta: string | null; published_at: ISO;
}
interface DbItemOption {
    id: UUID; owner_id: UUID; owner_type: OwnerType; order_index: number; text_ar: string; latex: string | null;
    is_correct: number; explanation_ar: string | null; meta: string | null;
}
interface DbItemHint {
    id: UUID; owner_id: UUID; owner_type: OwnerType; order_index: number; hint_ar: string;
    trigger_rule: string | null; meta: string | null;
}
interface DbItemSolution {
    id: UUID; owner_id: UUID; owner_type: OwnerType; steps: string; final_answer: string | null; final_latex: string | null; meta: string | null;
}
interface DbItemMedia { id: UUID; owner_id: UUID; owner_type: OwnerType; media_id: UUID; role: string | null; order_index: number; }
/*interface DbItemTag { item_id: UUID; tag_id: UUID; }
interface DbItemConcept { item_id: UUID; concept_id: UUID; weight: number; }*/

/* ========= Public API Shapes (decoded JSON) ========= */

export interface Concept {
    id: UUID; code: string; name_ar: string; grade: number; strand: Strand;
    parent_id: UUID | null; order_index: number; meta: Record<string, unknown> | null; created_at: ISO; updated_at: ISO;
}
export interface MediaAsset {
    id: UUID; s3_url: string; kind: string; sha256: string; width: number | null; height: number | null;
    meta: Record<string, unknown> | null; created_at: ISO;
}
export interface Option {
    id: UUID; owner_id: UUID; owner_type: OwnerType; order_index: number; text_ar: string; latex: string | null;
    is_correct: boolean; explanation_ar: string | null; meta: Record<string, unknown> | null;
}
export interface Hint {
    id: UUID; owner_id: UUID; owner_type: OwnerType; order_index: number; hint_ar: string;
    trigger_rule: string | null; meta: Record<string, unknown> | null;
}
export interface SolutionStep { text_ar: string; expr_latex?: string | null; }
export interface Solution {
    id: UUID; owner_id: UUID; owner_type: OwnerType; steps: SolutionStep[];
    final_answer: string | null; final_latex: string | null; meta: Record<string, unknown> | null;
}
export interface DraftItem {
    id: UUID; status: ItemStatus; item_type: ItemType; stem_ar: string; latex: string | null;
    difficulty_est: number | null; content_hash: string | null; created_by: UUID; updated_by: UUID;
    meta: Record<string, unknown> | null; created_at: ISO; updated_at: ISO;
}
export interface DraftWithChildren extends DraftItem {
    options?: Option[]; hints?: Hint[]; solution?: Solution; media?: DbItemMedia[];
    tags?: (DbTag & { item_id?: UUID })[]; concepts?: (Concept & { item_id?: UUID })[];
}
export interface ProdItem {
    id: UUID; source_draft_id: UUID; item_type: ItemType; stem_ar: string; latex: string | null;
    difficulty_params: Record<string, number> | null; published_ver: number; concept_main_id: UUID | null;
    meta: Record<string, unknown> | null; published_at: ISO;
}
export interface ProdWithChildren extends ProdItem { options?: Option[]; hints?: Hint[]; solution?: Solution; }
export interface MsDraftDoc {
    id: UUID; item_type: ItemType; status: ItemStatus; stem_ar: string; latex: string | null;
    concept_codes: string[]; tag_codes: string[]; updated_at?: ISO;
}
export interface MsConceptDoc { id: UUID; code: string; name_ar: string; grade: number; strand: Strand; }

/* ========= WHERE builder ========= */

function whereDraft(params: {
    status?: string | null; item_type?: string | null; concept_id?: string | null; q?: string | null;
}) {
    const conds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (params.status) { conds.push("d.status = @status"); bind.status = params.status; }
    if (params.item_type) { conds.push("d.item_type = @item_type"); bind.item_type = params.item_type; }
    if (params.concept_id) {
        conds.push(`EXISTS (SELECT 1 FROM item_concepts ic WHERE ic.item_id = d.id AND ic.concept_id = @concept_id)`);
        bind.concept_id = params.concept_id;
    }
    if (params.q && params.q.trim()) {
        conds.push(`(LOWER(d.stem_ar) LIKE '%'||LOWER(@q)||'%' OR LOWER(IFNULL(d.latex,'')) LIKE '%'||LOWER(@q)||'%')`);
        bind.q = params.q.trim();
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    return { where, bind };
}

export type IncludeDraft = Array<"options" | "hints" | "solution" | "media" | "tags" | "concepts">;

/* ========= Batch child fetch (typed arrays & map<...>) ========= */

type DraftChildren = Partial<{
    options: Option[]; hints: Hint[]; solutions: Solution[]; media: DbItemMedia[];
    tags: (DbTag & { item_id: UUID })[]; concepts: (Concept & { item_id: UUID })[];
}>;

function fetchDraftChildren(ids: UUID[], include: IncludeDraft): DraftChildren {
    const result: Partial<{
        options: Option[]; hints: Hint[]; solutions: Solution[]; media: DbItemMedia[];
        tags: (DbTag & { item_id: UUID })[]; concepts: (Concept & { item_id: UUID })[];
    }> = {};
    if (!ids.length || !include.length) return result;

    const placeholders = ids.map((_x, i) => `@id${i}`).join(",");
    const idBind = Object.fromEntries(ids.map((id, i) => [`id${i}`, id]));

    if (include.includes("options")) {
        const rows = allRows<DbItemOption>(
            `SELECT * FROM item_options WHERE owner_type='draft' AND owner_id IN (${placeholders}) ORDER BY order_index`,
            idBind
        );
        result.options = rows.map<Option>((o) => ({
            ...o, is_correct: toBool(o.is_correct), meta: parse<Record<string, unknown> | null>(o.meta),
        }));
    }

    if (include.includes("hints")) {
        const rows = allRows<DbItemHint>(
            `SELECT * FROM item_hints WHERE owner_type='draft' AND owner_id IN (${placeholders}) ORDER BY order_index`,
            idBind
        );
        result.hints = rows.map<Hint>((h) => ({ ...h, meta: parse<Record<string, unknown> | null>(h.meta) }));
    }

    if (include.includes("solution")) {
        const rows = allRows<DbItemSolution>(
            `SELECT * FROM item_solutions WHERE owner_type='draft' AND owner_id IN (${placeholders})`,
            idBind
        );
        result.solutions = rows.map<Solution>((s) => ({
            ...s, steps: parse<SolutionStep[]>(s.steps), meta: parse<Record<string, unknown> | null>(s.meta),
        }));
    }

    if (include.includes("media")) {
        result.media = allRows<DbItemMedia>(
            `SELECT * FROM item_media WHERE owner_type='draft' AND owner_id IN (${placeholders}) ORDER BY order_index`,
            idBind
        );
    }

    if (include.includes("tags")) {
        result.tags = allRows<DbTag & { item_id: UUID }>(`
            SELECT it.item_id, t.*
            FROM item_tags it
                     JOIN tags t ON t.id = it.tag_id
            WHERE it.item_id IN (${placeholders})
        `, idBind);
    }

    if (include.includes("concepts")) {
        const rows = allRows<DbConcept & { item_id: UUID }>(`
            SELECT ic.item_id, c.*
            FROM item_concepts ic
                     JOIN concepts c ON c.id = ic.concept_id
            WHERE ic.item_id IN (${placeholders})
        `, idBind);
        result.concepts = rows.map<(Concept & { item_id: UUID })>((c) => ({
            ...c, meta: parse<Record<string, unknown> | null>(c.meta),
        }));
    }

    return result;
}


/* ========= Drafts ========= */

export async function fetchDraftPage(
    searchParams: URLSearchParams,
    include: IncludeDraft
): Promise<Paginated<DraftWithChildren>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const status = searchParams.get("status");
    const item_type = searchParams.get("item_type");
    const concept_id = searchParams.get("concept_id");
    const q = searchParams.get("q");

    const { where, bind } = whereDraft({ status, item_type, concept_id, q });

    const total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM items_draft d ${where}`, bind)?.n) ?? 0;

    const rows = allRows<DbItemDraft>(`
    SELECT d.*
    FROM items_draft d
    ${where}
    ORDER BY d.updated_at DESC
    LIMIT @limit OFFSET @offset
  `, { ...bind, limit, offset });

    const decoded = rows.map<DraftWithChildren>((d) => ({
        ...d,
        meta: parse<Record<string, unknown> | null>(d.meta),
    }));

    if (!include.length) return { data: decoded, page, pageSize, total };

    const ids = decoded.map<string>((r) => r.id);
    const child = fetchDraftChildren(ids, include);

    const byId: Record<UUID, DraftWithChildren> =
        Object.fromEntries(decoded.map<[UUID, DraftWithChildren]>((r) => [r.id, { ...r }]));

    child.options?.forEach((o) => ((byId[o.owner_id].options ??= []).push(o)));
    child.hints?.forEach((h) => ((byId[h.owner_id].hints ??= []).push(h)));
    child.solutions?.forEach((s) => (byId[s.owner_id].solution = s));
    child.media?.forEach((m) => ((byId[m.owner_id].media ??= []).push(m)));
    child.tags?.forEach((t) => ((byId[t.item_id].tags ??= []).push(t)));
    child.concepts?.forEach((c) => ((byId[c.item_id].concepts ??= []).push(c)));

    const data = ids.map<DraftWithChildren>((id) => byId[id]);
    return { data, page, pageSize, total };
}


export async function fetchDraftById(id: UUID, include: IncludeDraft): Promise<DraftWithChildren | null> {
    const row = getRow<DbItemDraft>(`SELECT * FROM items_draft WHERE id=@id`, { id });
    if (!row) return null;

    const item: DraftWithChildren = { ...row, meta: parse<Record<string, unknown> | null>(row.meta) };
    if (!include.length) return item;

    const child = fetchDraftChildren([id], include);
    if (child.options) item.options = child.options.filter((x) => x.owner_id === id);
    if (child.hints) item.hints = child.hints.filter((x) => x.owner_id === id);
    if (child.solutions) item.solution = child.solutions.find((x) => x.owner_id === id);
    if (child.media) item.media = child.media.filter((x) => x.owner_id === id);
    if (child.tags) item.tags = child.tags.filter((x) => x.item_id === id);
    if (child.concepts) item.concepts = child.concepts.filter((x) => x.item_id === id);
    return item;
}


/* ========= Prod ========= */

type ProdChildren = Partial<{ options: Option[]; hints: Hint[]; solutions: Solution[] }>;

export type IncludeProd = Array<"options" | "hints" | "solution">;

function fetchProdChildren(ids: UUID[], include: IncludeProd): ProdChildren {
    const result: Partial<{ options: Option[]; hints: Hint[]; solutions: Solution[] }> = {};
    if (!ids.length || !include.length) return result;

    const placeholders = ids.map((_x, i) => `@id${i}`).join(",");
    const idBind = Object.fromEntries(ids.map((id, i) => [`id${i}`, id]));

    if (include.includes("options")) {
        const rows = allRows<DbItemOption>(
            `SELECT * FROM item_options WHERE owner_type='prod' AND owner_id IN (${placeholders}) ORDER BY order_index`,
            idBind
        );
        result.options = rows.map<Option>((o) => ({
            ...o, is_correct: toBool(o.is_correct), meta: parse<Record<string, unknown> | null>(o.meta),
        }));
    }

    if (include.includes("hints")) {
        const rows = allRows<DbItemHint>(
            `SELECT * FROM item_hints WHERE owner_type='prod' AND owner_id IN (${placeholders}) ORDER BY order_index`,
            idBind
        );
        result.hints = rows.map<Hint>((h) => ({ ...h, meta: parse<Record<string, unknown> | null>(h.meta) }));
    }

    if (include.includes("solution")) {
        const rows = allRows<DbItemSolution>(
            `SELECT * FROM item_solutions WHERE owner_type='prod' AND owner_id IN (${placeholders})`,
            idBind
        );
        result.solutions = rows.map<Solution>((s) => ({
            ...s, steps: parse<SolutionStep[]>(s.steps), meta: parse<Record<string, unknown> | null>(s.meta),
        }));
    }

    return result;
}


export async function fetchProdPage(
    searchParams: URLSearchParams,
    include: IncludeProd
): Promise<Paginated<ProdWithChildren>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const item_type = searchParams.get("item_type");
    const concept_id = searchParams.get("concept_id");
    const q = searchParams.get("q");

    const conds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (item_type) { conds.push("p.item_type = @item_type"); bind.item_type = item_type; }
    if (concept_id) { conds.push("p.concept_main_id = @concept_id"); bind.concept_id = concept_id; }
    if (q && q.trim()) {
        conds.push(`(LOWER(p.stem_ar) LIKE '%'||LOWER(@q)||'%' OR LOWER(IFNULL(p.latex,'')) LIKE '%'||LOWER(@q)||'%')`);
        bind.q = q.trim();
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM items_prod p ${where}`, bind)?.n) ?? 0;

    const rows = allRows<DbItemProd>(`
    SELECT p.* FROM items_prod p
    ${where}
    ORDER BY p.published_at DESC
    LIMIT @limit OFFSET @offset
  `, { ...bind, limit, offset });

    const decoded = rows.map<ProdWithChildren>((p) => ({
        ...p,
        difficulty_params: parse<Record<string, number> | null>(p.difficulty_params),
        meta: parse<Record<string, unknown> | null>(p.meta),
    }));

    if (!include.length) return { data: decoded, page, pageSize, total };

    const ids = decoded.map<string>((r) => r.id);
    const child = fetchProdChildren(ids, include);

    const byId: Record<UUID, ProdWithChildren> =
        Object.fromEntries(decoded.map<[UUID, ProdWithChildren]>((r) => [r.id, { ...r }]));

    child.options?.forEach((o) => ((byId[o.owner_id].options ??= []).push(o)));
    child.hints?.forEach((h) => ((byId[h.owner_id].hints ??= []).push(h)));
    child.solutions?.forEach((s) => (byId[s.owner_id].solution = s));

    const data = ids.map<ProdWithChildren>((id) => byId[id]);
    return { data, page, pageSize, total };
}


export async function fetchProdById(id: UUID, include: IncludeProd): Promise<ProdWithChildren | null> {
    const p = getRow<DbItemProd>(`SELECT * FROM items_prod WHERE id=@id`, { id });
    if (!p) return null;

    const item: ProdWithChildren = {
        ...p,
        difficulty_params: parse<Record<string, number> | null>(p.difficulty_params),
        meta: parse<Record<string, unknown> | null>(p.meta),
    };
    if (!include.length) return item;

    const child = fetchProdChildren([id], include);
    if (child.options) item.options = child.options.filter((x) => x.owner_id === id);
    if (child.hints) item.hints = child.hints.filter((x) => x.owner_id === id);
    if (child.solutions) item.solution = child.solutions.find((x) => x.owner_id === id) ?? item.solution;
    return item;
}

/* ========= Concepts ========= */

export async function fetchConceptById(id: UUID): Promise<Concept | null> {
    const row = getRow<DbConcept>(`
    SELECT id, code, name_ar, grade, strand, parent_id,
           order_index, meta, created_at, updated_at
    FROM concepts
    WHERE id = @id
  `, { id });
    if (!row) return null;
    return { ...row, meta: parse<Record<string, unknown> | null>(row.meta) };
}

export async function fetchConceptPage(searchParams: URLSearchParams): Promise<Paginated<Concept>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const grade = searchParams.get("grade");
    const strand = searchParams.get("strand");
    const q = searchParams.get("q");

    const conds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (grade) { conds.push("c.grade = @grade"); bind.grade = Number(grade); }
    if (strand) { conds.push("c.strand = @strand"); bind.strand = strand; }
    if (q && q.trim()) {
        conds.push("(LOWER(c.name_ar) LIKE '%'||LOWER(@q)||'%' OR LOWER(c.code) LIKE '%'||LOWER(@q)||'%')");
        bind.q = q.trim();
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM concepts c ${where}`, bind)?.n) ?? 0;

    const rows = allRows<DbConcept>(`
    SELECT c.* FROM concepts c
    ${where}
    ORDER BY c.grade, c.order_index
    LIMIT @limit OFFSET @offset
  `, { ...bind, limit, offset });

    const data = rows.map<Concept>((c) => ({ ...c, meta: parse<Record<string, unknown> | null>(c.meta) }));
    return { data, page, pageSize, total };
}

/* ========= Tags & Media ========= */

export async function fetchTagPage(searchParams: URLSearchParams): Promise<Paginated<DbTag>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const kind = searchParams.get("kind");
    const q = searchParams.get("q");

    const conds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (kind) { conds.push("t.kind = @kind"); bind.kind = kind; }
    if (q && q.trim()) {
        conds.push("(LOWER(t.name_ar) LIKE '%'||LOWER(@q)||'%' OR LOWER(t.code) LIKE '%'||LOWER(@q)||'%')");
        bind.q = q.trim();
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM tags t ${where}`, bind)?.n) ?? 0;

    const data = allRows<DbTag>(`
    SELECT t.* FROM tags t
    ${where}
    ORDER BY t.created_at DESC
    LIMIT @limit OFFSET @offset
  `, { ...bind, limit, offset });

    return { data, page, pageSize, total };
}


export async function fetchMediaPage(searchParams: URLSearchParams): Promise<Paginated<MediaAsset>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const kind = searchParams.get("kind");
    const q = searchParams.get("q");

    const conds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (kind) { conds.push("m.kind = @kind"); bind.kind = kind; }
    if (q && q.trim()) { conds.push("(LOWER(m.s3_url) LIKE '%'||LOWER(@q)||'%')"); bind.q = q.trim(); }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM media_assets m ${where}`, bind)?.n) ?? 0;

    const rows = allRows<DbMediaAsset>(`
    SELECT m.* FROM media_assets m
    ${where}
    ORDER BY m.created_at DESC
    LIMIT @limit OFFSET @offset
  `, { ...bind, limit, offset });

    const data = rows.map<MediaAsset>((m) => ({ ...m, meta: parse<Record<string, unknown> | null>(m.meta) }));
    return { data, page, pageSize, total };
}


/* ========= Search Docs ========= */

export async function searchDraftDocsPage(
    searchParams: URLSearchParams
): Promise<Paginated<MsDraftDoc>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const q = searchParams.get("q");
    const concept = searchParams.get("concept");
    const status = searchParams.get("status");
    const item_type = searchParams.get("item_type");

    const dConds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (status) { dConds.push("d.status = @status"); bind.status = status; }
    if (item_type) { dConds.push("d.item_type = @item_type"); bind.item_type = item_type; }
    if (concept) {
        dConds.push(`
      EXISTS (
        SELECT 1 FROM item_concepts ic
        JOIN concepts c ON c.id = ic.concept_id
        WHERE ic.item_id = d.id AND c.code = @concept
      )
    `);
        bind.concept = concept;
    }
    const dWhere = dConds.length ? `WHERE ${dConds.join(" AND ")}` : "";

    type Row = {
        id: UUID; item_type: ItemType; status: ItemStatus; stem_ar: string; latex: string | null; updated_at: ISO;
        concept_codes_csv: string | null; tag_codes_csv: string | null;
    };

    let total = 0;
    let rows: Row[] = [];

    if (q && q.trim()) {
        bind.q = q.trim();
        total = (getRow<{ n: number }>(`
      SELECT COUNT(1) AS n
      FROM items_draft_fts f
      JOIN items_draft d ON d.id = f.rowid
      ${dWhere ? dWhere.replace(/^WHERE/, "WHERE") + " AND " : "WHERE"} items_draft_fts MATCH @q
    `, bind)?.n) ?? 0;

        rows = allRows<Row>(`
      SELECT d.id, d.item_type, d.status, d.stem_ar, d.latex, d.updated_at,
        (SELECT GROUP_CONCAT(code, ',') FROM (
          SELECT c.code FROM item_concepts ic
          JOIN concepts c ON c.id = ic.concept_id
          WHERE ic.item_id = d.id
          ORDER BY c.code
        )) AS concept_codes_csv,
        (SELECT GROUP_CONCAT(code, ',') FROM (
          SELECT t.code FROM item_tags it
          JOIN tags t ON t.id = it.tag_id
          WHERE it.item_id = d.id
          ORDER BY t.code
        )) AS tag_codes_csv
      FROM items_draft_fts f
      JOIN items_draft d ON d.id = f.rowid
      ${dWhere ? dWhere.replace(/^WHERE/, "WHERE") + " AND " : "WHERE"} items_draft_fts MATCH @q
      ORDER BY d.updated_at DESC
      LIMIT @limit OFFSET @offset
    `, { ...bind, limit, offset });
    } else {
        total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM items_draft d ${dWhere}`, bind)?.n) ?? 0;

        rows = allRows<Row>(`
      SELECT d.id, d.item_type, d.status, d.stem_ar, d.latex, d.updated_at,
        (SELECT GROUP_CONCAT(code, ',') FROM (
          SELECT c.code FROM item_concepts ic
          JOIN concepts c ON c.id = ic.concept_id
          WHERE ic.item_id = d.id
          ORDER BY c.code
        )) AS concept_codes_csv,
        (SELECT GROUP_CONCAT(code, ',') FROM (
          SELECT t.code FROM item_tags it
          JOIN tags t ON t.id = it.tag_id
          WHERE it.item_id = d.id
          ORDER BY t.code
        )) AS tag_codes_csv
      FROM items_draft d
      ${dWhere}
      ORDER BY d.updated_at DESC
      LIMIT @limit OFFSET @offset
    `, { ...bind, limit, offset });
    }

    const data = rows.map<MsDraftDoc>((r) => ({
        id: r.id,
        item_type: r.item_type,
        status: r.status,
        stem_ar: r.stem_ar,
        latex: r.latex ?? null,
        concept_codes: r.concept_codes_csv ? String(r.concept_codes_csv).split(",") : [],
        tag_codes: r.tag_codes_csv ? String(r.tag_codes_csv).split(",") : [],
        updated_at: r.updated_at,
    }));

    return { data, page, pageSize, total };
}

export async function searchConceptDocsPage(
    searchParams: URLSearchParams
): Promise<Paginated<MsConceptDoc>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const q = searchParams.get("q");
    const grade = searchParams.get("grade");

    const conds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (grade) { conds.push("c.grade = @grade"); bind.grade = Number(grade); }
    if (q && q.trim()) {
        conds.push("(LOWER(c.name_ar) LIKE '%'||LOWER(@q)||'%' OR LOWER(c.code) LIKE '%'||LOWER(@q)||'%')");
        bind.q = q.trim();
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM concepts c ${where}`, bind)?.n) ?? 0;

    const data = allRows<MsConceptDoc>(`
    SELECT c.id, c.code, c.name_ar, c.grade, c.strand
    FROM concepts c
    ${where}
    ORDER BY c.grade, c.order_index
    LIMIT @limit OFFSET @offset
  `, { ...bind, limit, offset });

    return { data, page, pageSize, total };
}


/* ========= Users ========= */

export async function fetchUserPage(searchParams: URLSearchParams): Promise<Paginated<DbUser>> {
    const { page, pageSize, limit, offset } = getPage(searchParams);
    const role = searchParams.get("role");
    const q = searchParams.get("q");

    const conds: string[] = [];
    const bind: Record<string, unknown> = {};
    if (role) { conds.push("u.role = @role"); bind.role = role; }
    if (q && q.trim()) {
        conds.push("(LOWER(u.name) LIKE '%'||LOWER(@q)||'%' OR LOWER(u.email) LIKE '%'||LOWER(@q)||'%')");
        bind.q = q.trim();
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const total = (getRow<{ n: number }>(`SELECT COUNT(1) AS n FROM users u ${where}`, bind)?.n) ?? 0;

    const data = allRows<DbUser>(`
    SELECT u.*
    FROM users u
    ${where}
    ORDER BY u.created_at DESC
    LIMIT @limit OFFSET @offset
  `, { ...bind, limit, offset });

    return { data, page, pageSize, total };
}

export async function fetchUserById(id: UUID): Promise<DbUser | null> {
    const row = getRow<DbUser>(`SELECT * FROM users WHERE id = @id`, { id });
    return row ?? null;
}

