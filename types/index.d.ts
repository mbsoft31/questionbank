/*

export enum QuestionType {
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

export enum QuestionStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
}

export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

export interface Choice {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface Concept {
    id: string;
    name: string;
}

export interface Question {
    id: string;
    conceptId: string;
    stem: string;
    type: QuestionType;
    choices: Choice[];
    difficulty: Difficulty;
    status: QuestionStatus;
    solution: string;
}
*/


/* types.ts — Project Mounir (Phase 0) */

// Optional: npm i zod
import { z } from "zod";

/* ──────────────────────────────────────────────────────────────────────────
 *  Utility Branded Types
 * ────────────────────────────────────────────────────────────────────────── */
export type UUID = string
export type ISO = string

/* ──────────────────────────────────────────────────────────────────────────
 *  Enums / Unions (match DB CHECKs)
 * ────────────────────────────────────────────────────────────────────────── */
export type Role = "admin" | "content-author" | "reviewer" | "teacher" | "student";
export type ItemStatus = "draft" | "in_review" | "changes_requested" | "archived";
export type ItemType = "mcq" | "multi_select" | "numeric" | "short_text" | "proof";
export type OwnerType = "draft" | "prod";
export type SrcType = "csv" | "json" | "ocr";
export type ImportStatus = "pending" | "running" | "done" | "failed" | "partial";

/** Curriculum strands (tune to DZ taxonomy) */
export type Strand = "algebra" | "functions" | "geometry" | "calculus" | "stats";

/* ──────────────────────────────────────────────────────────────────────────
 *  Core Entities (Phase 0)
 * ────────────────────────────────────────────────────────────────────────── */
export interface User {
    id: UUID;
    name: string;
    email: string;
    role: Role;
    locale: "ar";
    created_at: ISO;
    updated_at: ISO;
}

export interface Concept {
    id: UUID;
    code: string;          // e.g., ALG-11-LINEAR
    name_ar: string;
    grade: 9 | 10 | 11 | 12;
    strand: Strand;
    parent_id?: UUID | null;
    order_index: number;
    meta: Record<string, unknown>;
    created_at: ISO;
    updated_at: ISO;
}

/** Draft item (mutable) */
export interface ItemDraft {
    id: UUID;
    status: ItemStatus;
    item_type: ItemType;
    stem_ar: string;       // rich text serialized (markdown/HTML)
    latex?: string | null;
    difficulty_est?: number | null; // 0..10
    content_hash?: string | null;
    created_by: UUID;
    updated_by?: UUID;
    meta: Record<string, unknown>;
    created_at?: ISO;
    updated_at?: ISO;
}

/** Published item (immutable) */
export interface ItemProd {
    id: UUID;
    source_draft_id: UUID;
    item_type: ItemType;
    stem_ar: string;
    latex?: string | null;
    difficulty_params?: { irt_a?: number; irt_b?: number; irt_c?: number } | null;
    published_ver: number;
    concept_main_id?: UUID | null;
    meta: Record<string, unknown>;
    published_at?: ISO;
}

/** Child tables reused by draft/prod via (owner_id, owner_type) */
export interface ItemOption {
    id: UUID;
    owner_id: UUID;
    owner_type: OwnerType;
    order_index: number;
    text_ar: string;
    latex?: string | null;
    is_correct: boolean;
    explanation_ar?: string | null;
    meta: Record<string, unknown>;
}

export interface ItemHint {
    id: UUID;
    owner_id: UUID;
    owner_type: OwnerType;
    order_index: number;
    hint_ar: string;
    /** e.g., "after_1_wrong", "time>120s" */
    trigger_rule?: string | null;
    meta: Record<string, unknown>;
}

export interface ItemSolution {
    id: UUID;
    owner_id: UUID;
    owner_type: OwnerType;
    steps: Array<{ text_ar: string; expr_latex?: string | null }>;
    final_answer?: string | null;
    final_latex?: string | null;
    meta: Record<string, unknown>;
}

/** Many-to-many concept mapping (draft-side) */
export interface ItemConcept {
    item_id: UUID;
    concept_id: UUID;
    weight: number; // 0..1 relative contribution
}

/** Media repository + attachments */
export interface MediaAsset {
    id: UUID;
    s3_url: string;
    kind: "image" | "svg" | "audio" | "pdf";
    sha256: string;
    width?: number | null;
    height?: number | null;
    meta: Record<string, unknown>;
    created_at: ISO;
}

export interface ItemMedia {
    id: UUID;
    owner_id: UUID;
    owner_type: OwnerType;
    media_id: UUID;
    role?: string | null;         // "diagram" | "figure" | ...
    order_index: number;
}

/** Tagging */
export interface Tag {
    id: UUID;
    code: string;
    name_ar: string;
    kind?: string | null;        // taxonomy namespace
    created_at: ISO;
}
export interface ItemTag {
    item_id: UUID;
    tag_id: UUID;
}

/** Review workflow */
export type ReviewDecision = "approved" | "rejected" | "changes_requested";
export interface ItemReview {
    id: UUID;
    item_id: UUID;
    reviewer_id: UUID;
    decision: ReviewDecision;
    notes?: string | null;
    created_at: ISO;
}

/** Versioning (for drafts) */
export interface ItemVersion {
    id: UUID;
    item_id: UUID;
    ver: number;
    diff_notes?: string | null;
    snapshot: Record<string, unknown>; // frozen JSON
    created_by: UUID;
    created_at: ISO;
}

/** Import pipeline */
export interface ImportBatch {
    id: UUID;
    src_type: SrcType;
    status: ImportStatus;
    summary: {
        total?: number;
        created?: number;
        duplicate?: number;
        error?: number;
    };
    created_by: UUID;
    created_at: ISO;
    updated_at: ISO;
}
export interface ImportLog {
    id: UUID;
    batch_id: UUID;
    row_ref?: string | null; // line number / original id
    action: "created" | "duplicate" | "error";
    item_id?: UUID | null;  // draft id if created
    notes?: string | null;
    created_at: ISO;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Meilisearch Document Shapes (authoring/search panes)
 * ────────────────────────────────────────────────────────────────────────── */
export interface MsConceptDoc {
    id: UUID;
    code: string;
    name_ar: string;
    grade: number;
    strand: Strand;
}

export interface MsItemDraftDoc {
    id: UUID;
    item_type: ItemType;
    status: ItemStatus;
    stem_ar: string;
    latex?: string | null;
    concept_codes: string[]; // denormalized for search chips
    tag_codes?: string[];
    updated_at: ISO;
}

export interface MsItemProdDoc {
    id: UUID;
    item_type: ItemType;
    stem_ar: string;
    latex?: string | null;
    concept_main_code?: string | null;
    published_ver: number;
    published_at: ISO;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  API DTOs (Phase 0 authoring/review/publish/import)
 * ────────────────────────────────────────────────────────────────────────── */

/** Create/Update Draft Item payloads */
export interface ItemDraftCreateDTO {
    item_type: ItemType;
    stem_ar: string;
    latex?: string | null;
    difficulty_est?: number | null;
    concept_ids: UUID[]; // at least 1
    tags?: string[];     // tag codes
    meta?: Record<string, unknown>;
    /** child rows */
    options?: Array<Pick<ItemOption, "order_index" | "text_ar" | "latex" | "is_correct" | "explanation_ar" | "meta">>;
    hints?: Array<Pick<ItemHint, "order_index" | "hint_ar" | "trigger_rule" | "meta">>;
    solution?: Pick<ItemSolution, "steps" | "final_answer" | "final_latex" | "meta">;
    media_ids?: UUID[];
}
export interface ItemDraftUpdateDTO extends Partial<ItemDraftCreateDTO> {
    status?: ItemStatus; // author can set draft→in_review
}

/** Publish endpoint */
export interface PublishRequestDTO {
    draft_id: UUID;
    notes?: string;      // release notes
}
export interface PublishResponseDTO {
    prod: ItemProd;
    options: ItemOption[];   // owner_type='prod'
    hints: ItemHint[];
    solution?: ItemSolution;
}

/** Review endpoints */
export interface ReviewDecisionDTO {
    item_id: UUID;
    decision: ReviewDecision;
    notes?: string;
}
export interface ReviewListQuery {
    status?: Extract<ItemStatus, "in_review" | "changes_requested" | "draft">;
    item_type?: ItemType;
    concept_id?: UUID;
    q?: string; // search
}

/** Import endpoints */
export interface ImportStartDTO {
    src_type: SrcType;
    file_id: UUID; // uploaded file handle from S3 pre-upload
}
export interface ImportReportDTO {
    batch: ImportBatch;
    logs: ImportLog[];
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Zod Schemas (optional but recommended in frontend)
 * ────────────────────────────────────────────────────────────────────────── */
const uuidRe = /^[0-9a-fA-F-]{36}$/;
export const zUUID = z.string().regex(uuidRe) as unknown as z.ZodType<UUID>;
export const zISO = z.string() as unknown as z.ZodType<ISO>;

export const zItemType = z.enum(["mcq", "multi_select", "numeric", "short_text", "proof"]);
export const zItemStatus = z.enum(["draft","in_review","changes_requested","archived"]);
export const zOwnerType = z.enum(["draft","prod"]);
export const zStrand = z.enum(["algebra","functions","geometry","calculus","stats"]);

export const zConcept = z.object({
    id: zUUID, code: z.string(), name_ar: z.string(),
    grade: z.union([z.literal(9), z.literal(10), z.literal(11), z.literal(12)]),
    strand: zStrand, parent_id: zUUID.nullish(), order_index: z.number(),
    meta: z.record(z.unknown()), created_at: zISO, updated_at: zISO
});

export const zItemDraft = z.object({
    id: zUUID, status: zItemStatus, item_type: zItemType,
    stem_ar: z.string(), latex: z.string().nullish(),
    difficulty_est: z.number().min(0).max(10).nullish(),
    content_hash: z.string().nullish(),
    created_by: zUUID, updated_by: zUUID,
    meta: z.record(z.unknown()), created_at: zISO, updated_at: zISO
});

export const zItemProd = z.object({
    id: zUUID, source_draft_id: zUUID, item_type: zItemType,
    stem_ar: z.string(), latex: z.string().nullish(),
    difficulty_params: z.record(z.number()).partial().nullish(),
    published_ver: z.number().int().nonnegative(),
    concept_main_id: zUUID.nullish(),
    meta: z.record(z.unknown()),
    published_at: zISO
});

export const zItemOption = z.object({
    id: zUUID, owner_id: zUUID, owner_type: zOwnerType,
    order_index: z.number().int(), text_ar: z.string(),
    latex: z.string().nullish(), is_correct: z.boolean(),
    explanation_ar: z.string().nullish(),
    meta: z.record(z.unknown())
});

export const zItemHint = z.object({
    id: zUUID, owner_id: zUUID, owner_type: zOwnerType,
    order_index: z.number().int(), hint_ar: z.string(),
    trigger_rule: z.string().nullish(),
    meta: z.record(z.unknown())
});

export const zItemSolution = z.object({
    id: zUUID, owner_id: zUUID, owner_type: zOwnerType,
    steps: z.array(z.object({ text_ar: z.string(), expr_latex: z.string().nullish() })),
    final_answer: z.string().nullish(),
    final_latex: z.string().nullish(),
    meta: z.record(z.unknown())
});

export const zImportBatch = z.object({
    id: zUUID, src_type: z.enum(["csv","json","ocr"]),
    status: z.enum(["pending","running","done","failed","partial"]),
    summary: z.object({
        total: z.number().int().nonnegative().optional(),
        created: z.number().int().nonnegative().optional(),
        duplicate: z.number().int().nonnegative().optional(),
        error: z.number().int().nonnegative().optional(),
    }),
    created_by: zUUID, created_at: zISO, updated_at: zISO
});

export const zImportLog = z.object({
    id: zUUID, batch_id: zUUID, row_ref: z.string().nullish(),
    action: z.enum(["created","duplicate","error"]),
    item_id: zUUID.nullish(), notes: z.string().nullish(),
    created_at: zISO
});

/* ──────────────────────────────────────────────────────────────────────────
 *  Form Helpers / Defaults (authoring UI)
 * ────────────────────────────────────────────────────────────────────────── */
export const newDraftDefaults = (over?: Partial<ItemDraftCreateDTO>): ItemDraftCreateDTO => ({
    item_type: "mcq",
    stem_ar: "",
    latex: null,
    difficulty_est: 3,
    concept_ids: [],
    tags: [],
    meta: {},
    options: [
        { order_index: 0, text_ar: "", latex: null, is_correct: true,  explanation_ar: null, meta: {} },
        { order_index: 1, text_ar: "", latex: null, is_correct: false, explanation_ar: null, meta: {} },
        { order_index: 2, text_ar: "", latex: null, is_correct: false, explanation_ar: null, meta: {} },
    ],
    hints: [],
    solution: { steps: [], final_answer: null, final_latex: null, meta: {} },
    media_ids: [],
    ...over,
});

/** Quick guard: exactly one correct option (for MCQ authoring) */
export const hasExactlyOneCorrect = (opts: Pick<ItemOption, "is_correct">[]) =>
    opts.filter(o => o.is_correct).length === 1;

/* ──────────────────────────────────────────────────────────────────────────
 *  Meilisearch Index Keys (frontend config helpers)
 * ────────────────────────────────────────────────────────────────────────── */
export const MS_INDEX = {
    concepts: "concepts",
    itemsDraft: "items_draft",
    itemsProd: "items_prod",
} as const;

export const msDraftSearchAttrs = {
    searchable: ["stem_ar", "latex", "concept_codes", "tag_codes"],
    filterable: ["item_type", "status", "updated_at"],
    sortable: ["updated_at"]
};
