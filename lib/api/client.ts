"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
    zConceptPage,
    zConcept,
    zDraftPage,
    zDraftPageExpanded,
    zDraftWithChildren,
    zItemDraft,
    zProdPage,
    zProdPageExpanded,
    zProdWithChildren,
    zItemProd,
    zMsDraftDocPage,
    zMsConceptDocPage,
} from "./schemas";

/** Base */
const BASE = ""; // same-origin; change to NEXT_PUBLIC_API_BASE if needed

/** Minimal typed fetcher with Zod parsing */
async function getParsed<T>(
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: { ...(init?.headers || {}), "content-type": "application/json" },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    const json = await res.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
        // Surface validation failure clearly
        const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error(`ZodParseError: ${issues}`);
    }
    return parsed.data;
}

/** Query Keys */
export const qk = {
    users: (params?: Record<string, unknown>) => ["users", params] as const,
    concepts: (params?: Record<string, unknown>) => ["concepts", params] as const,
    concept: (id: string) => ["concept", id] as const,

    drafts: (params?: Record<string, unknown>) => ["drafts", params] as const,
    draft: (id: string, params?: Record<string, unknown>) => ["draft", id, params] as const,

    prod: (params?: Record<string, unknown>) => ["prod", params] as const,
    prodOne: (id: string, params?: Record<string, unknown>) => ["prodOne", id, params] as const,

    searchDrafts: (params?: Record<string, unknown>) => ["searchDrafts", params] as const,
    searchConcepts: (params?: Record<string, unknown>) => ["searchConcepts", params] as const,
};

/** ---------------------------
 * Concepts
 * -------------------------- */
export function useConcepts(params?: {
    grade?: number | string;
    strand?: "algebra" | "functions" | "geometry" | "calculus" | "stats";
    q?: string;
    page?: number;
    pageSize?: number;
}) {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => v != null && sp.set(k, String(v)));
    const qs = sp.toString();
    return useQuery({
        queryKey: qk.concepts(params),
        queryFn: () => getParsed(`/api/concepts${qs ? `?${qs}` : ""}`, zConceptPage),
    });
}

export function useConcept(id: string) {
    return useQuery({
        queryKey: qk.concept(id),
        queryFn: () => getParsed(`/api/concepts/${id}`, zConcept),
        enabled: Boolean(id),
    });
}

/** ---------------------------
 * Draft Items (list/detail with includes)
 * -------------------------- */
type IncludeDraft = Array<"options" | "hints" | "solution" | "media" | "tags" | "concepts">;

export function useDraftItems(params?: {
    status?: "draft" | "in_review" | "changes_requested" | "archived";
    item_type?: "mcq" | "multi_select" | "numeric" | "short_text" | "proof";
    concept_id?: string;
    q?: string;
    include?: IncludeDraft;
    page?: number;
    pageSize?: number;
}) {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v == null) return;
        if (k === "include" && Array.isArray(v)) sp.set("include", v.join(","));
        else sp.set(k, String(v));
    });
    const qs = sp.toString();
    const withChildren = params?.include && params.include.length > 0;

    return useQuery({
        queryKey: qk.drafts(params),
        queryFn: () =>
            getParsed(
                `/api/items/draft${qs ? `?${qs}` : ""}`,
                withChildren ? zDraftPageExpanded : zDraftPage
            ),
    });
}

export function useDraftItem(id: string, include?: IncludeDraft) {
    const sp = new URLSearchParams();
    if (include?.length) sp.set("include", include.join(","));
    const qs = sp.toString();

    return useQuery({
        queryKey: qk.draft(id, { include }),
        queryFn: () =>
            getParsed(
                `/api/items/draft/${id}${qs ? `?${qs}` : ""}`,
                include?.length ? zDraftWithChildren : zItemDraft
            ),
        enabled: Boolean(id),
    });
}

/** ---------------------------
 * Prod Items
 * -------------------------- */
type IncludeProd = Array<"options" | "hints" | "solution">;

export function useProdItems(params?: {
    item_type?: "mcq" | "multi_select" | "numeric" | "short_text" | "proof";
    concept_id?: string;
    q?: string;
    include?: IncludeProd;
    page?: number;
    pageSize?: number;
}) {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v == null) return;
        if (k === "include" && Array.isArray(v)) sp.set("include", v.join(","));
        else sp.set(k, String(v));
    });
    const qs = sp.toString();
    const withChildren = params?.include && params.include.length > 0;

    return useQuery({
        queryKey: qk.prod(params),
        queryFn: () =>
            getParsed(
                `/api/items/prod${qs ? `?${qs}` : ""}`,
                withChildren ? zProdPageExpanded : zProdPage
            ),
    });
}

export function useProdItem(id: string, include?: IncludeProd) {
    const sp = new URLSearchParams();
    if (include?.length) sp.set("include", include.join(","));
    const qs = sp.toString();

    return useQuery({
        queryKey: qk.prodOne(id, { include }),
        queryFn: () =>
            getParsed(
                `/api/items/prod/${id}${qs ? `?${qs}` : ""}`,
                include?.length ? zProdWithChildren : zItemProd
            ),
        enabled: Boolean(id),
    });
}

/** ---------------------------
 * Search (mock Meili docs)
 * -------------------------- */
export function useSearchDraftDocs(params?: {
    q?: string;
    concept?: string; // concept code
    status?: "draft" | "in_review" | "changes_requested" | "archived";
    item_type?: "mcq" | "multi_select" | "numeric" | "short_text" | "proof";
    page?: number;
    pageSize?: number;
}) {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => v != null && sp.set(k, String(v)));
    const qs = sp.toString();
    return useQuery({
        queryKey: qk.searchDrafts(params),
        queryFn: () => getParsed(`/api/search/drafts${qs ? `?${qs}` : ""}`, zMsDraftDocPage),
    });
}

export function useSearchConceptDocs(params?: { q?: string; grade?: number | string; page?: number; pageSize?: number; }) {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => v != null && sp.set(k, String(v)));
    const qs = sp.toString();
    return useQuery({
        queryKey: qk.searchConcepts(params),
        queryFn: () => getParsed(`/api/search/concepts${qs ? `?${qs}` : ""}`, zMsConceptDocPage),
    });
}
