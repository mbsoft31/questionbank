import { z } from "zod";

/** Shared */
export const zUUID = z.string().uuid().or(z.string()); // mock UUIDs may not be strict RFC4122
export const zISO = z.string();

/** Pagination envelope */
export const zPage = <T extends z.ZodTypeAny>(inner: T) =>
    z.object({
        data: z.array(inner),
        page: z.number(),
        pageSize: z.number(),
        total: z.number(),
    });

/** Concepts */
export const zConcept = z.object({
    id: zUUID,
    code: z.string(),
    name_ar: z.string(),
    grade: z.number().int(),
    strand: z.enum(["algebra", "functions", "geometry", "calculus", "stats"]),
    parent_id: zUUID.nullish(),
    order_index: z.number().int(),
    meta: z.record(z.unknown()),
    created_at: zISO,
    updated_at: zISO,
});
export const zConceptPage = zPage(zConcept);

/** Draft item + children (subset needed for UI) */
export const zItemDraft = z.object({
    id: zUUID,
    status: z.enum(["draft", "in_review", "changes_requested", "archived"]),
    item_type: z.enum(["mcq", "multi_select", "numeric", "short_text", "proof"]),
    stem_ar: z.string(),
    latex: z.string().nullable().optional(),
    difficulty_est: z.number().nullable().optional(),
    created_by: zUUID,
    updated_by: zUUID,
    meta: z.record(z.unknown()),
    created_at: zISO,
    updated_at: zISO,
});

export const zOption = z.object({
    id: zUUID,
    owner_id: zUUID,
    owner_type: z.enum(["draft", "prod"]),
    order_index: z.number().int(),
    text_ar: z.string(),
    latex: z.string().nullable().optional(),
    is_correct: z.boolean(),
    explanation_ar: z.string().nullable().optional(),
    meta: z.record(z.unknown()),
});

export const zHint = z.object({
    id: zUUID,
    owner_id: zUUID,
    owner_type: z.enum(["draft", "prod"]),
    order_index: z.number().int(),
    hint_ar: z.string(),
    trigger_rule: z.string().nullable().optional(),
    meta: z.record(z.unknown()),
});

export const zSolution = z.object({
    id: zUUID,
    owner_id: zUUID,
    owner_type: z.enum(["draft", "prod"]),
    steps: z.array(z.object({ text_ar: z.string(), expr_latex: z.string().nullable().optional() })),
    final_answer: z.string().nullable().optional(),
    final_latex: z.string().nullable().optional(),
    meta: z.record(z.unknown()),
});

export const zDraftWithChildren = zItemDraft.extend({
    options: z.array(zOption).optional(),
    hints: z.array(zHint).optional(),
    solution: zSolution.optional(),
    media: z.any().optional(),
    tags: z.array(z.object({ id: zUUID, code: z.string(), name_ar: z.string() })).optional(),
    concepts: z.array(zConcept).optional(),
});
export const zDraftPage = zPage(zItemDraft);
export const zDraftPageExpanded = zPage(zDraftWithChildren);

/** Prod item + children */
export const zItemProd = z.object({
    id: zUUID,
    source_draft_id: zUUID,
    item_type: z.enum(["mcq", "multi_select", "numeric", "short_text", "proof"]),
    stem_ar: z.string(),
    latex: z.string().nullable().optional(),
    difficulty_params: z.record(z.number()).partial().nullable().optional(),
    published_ver: z.number().int(),
    concept_main_id: zUUID.nullish(),
    meta: z.record(z.unknown()),
    published_at: zISO,
});
export const zProdWithChildren = zItemProd.extend({
    options: z.array(zOption).optional(),
    hints: z.array(zHint).optional(),
    solution: zSolution.optional(),
});
export const zProdPage = zPage(zItemProd);
export const zProdPageExpanded = zPage(zProdWithChildren);

/** Search docs */
export const zMsDraftDoc = z.object({
    id: zUUID,
    item_type: z.enum(["mcq", "multi_select", "numeric", "short_text", "proof"]),
    status: z.enum(["draft", "in_review", "changes_requested", "archived"]),
    stem_ar: z.string(),
    latex: z.string().nullable().optional(),
    concept_codes: z.array(z.string()),
    tag_codes: z.array(z.string()).optional(),
    updated_at: zISO.optional(),
});
export const zMsConceptDoc = z.object({
    id: zUUID,
    code: z.string(),
    name_ar: z.string(),
    grade: z.number().int(),
    strand: z.enum(["algebra", "functions", "geometry", "calculus", "stats"]),
});
export const zMsDraftDocPage = zPage(zMsDraftDoc);
export const zMsConceptDocPage = zPage(zMsConceptDoc);
