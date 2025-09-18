import type {
    Concept,
    ItemConcept,
    ItemDraft,
    ItemHint,
    ItemMedia,
    ItemOption,
    ItemProd,
    ItemReview,
    ItemSolution,
    ItemStatus,
    ItemTag,
    ItemType,
    ItemVersion,
    MediaAsset,
    OwnerType,
    Strand,
    Tag,
    User,
    UUID
} from "@/types";

// —————————————————————————————————————————————
// Utilities
// —————————————————————————————————————————————
const nowISO = () => new Date().toISOString();
const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
const uuid = (): UUID => {
    // pseudo-uuid (works fine for UI mocks)
    const h = hex(16);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const range = (n: number) => Array.from({length: n}, (_, i) => i);

// —————————————————————————————————————————————
// Seed Users (authors/reviewers)
// —————————————————————————————————————————————
export const users: User[] = [
    {
        id: uuid(),
        name: "مدير النظام",
        email: "admin@mail.com",
        role: "admin",
        locale: "ar",
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        name: "مؤلف المحتوى",
        email: "author@mail.com",
        role: "content-author",
        locale: "ar",
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        name: "مراجع المحتوى",
        email: "reviewer@mail.com",
        role: "reviewer",
        locale: "ar",
        created_at: nowISO(),
        updated_at: nowISO()
    }
];
const ADMIN_ID = users[0].id;
const AUTHOR_ID = users[1].id;
const REVIEWER_ID = users[2].id;

// —————————————————————————————————————————————
// Concepts (DZ Secondary: 10 sample nodes)
// —————————————————————————————————————————————
export const concepts: Concept[] = [
    {
        id: uuid(),
        code: "ALG-10-LINEAR",
        name_ar: "المعادلات الخطية",
        grade: 10,
        strand: "algebra",
        order_index: 1,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "ALG-10-FACTOR",
        name_ar: "التحليل إلى عوامل",
        grade: 10,
        strand: "algebra",
        order_index: 2,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "FUN-11-FUNC-BASIC",
        name_ar: "مفاهيم الدوال الأساسية",
        grade: 11,
        strand: "functions",
        order_index: 1,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "FUN-11-LINEAR",
        name_ar: "الدالة الخطية وتمثيلها",
        grade: 11,
        strand: "functions",
        order_index: 2,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "GEO-10-TRI",
        name_ar: "المثلثات ومتطابقاتها",
        grade: 10,
        strand: "geometry",
        order_index: 1,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "GEO-11-CIRC",
        name_ar: "الدائرة والزاويا",
        grade: 11,
        strand: "geometry",
        order_index: 2,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "CAL-12-DERIV",
        name_ar: "المشتقات وقواعدها",
        grade: 12,
        strand: "calculus",
        order_index: 1,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "CAL-12-APPL",
        name_ar: "تطبيقات المشتقات",
        grade: 12,
        strand: "calculus",
        order_index: 2,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "STA-12-DESC",
        name_ar: "الإحصاء الوصفي",
        grade: 12,
        strand: "stats",
        order_index: 1,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    },
    {
        id: uuid(),
        code: "ALG-11-QUAD",
        name_ar: "المعادلات التربيعية",
        grade: 11,
        strand: "algebra",
        order_index: 3,
        meta: {},
        parent_id: null,
        created_at: nowISO(),
        updated_at: nowISO()
    }
];
const conceptByCode = Object.fromEntries(concepts.map(c => [c.code, c]));

// —————————————————————————————————————————————
// Tags
// —————————————————————————————————————————————
export const tags: Tag[] = [
    {id: uuid(), code: "SKILL-FACTOR", name_ar: "مهارة التحليل", kind: "skill", created_at: nowISO()},
    {id: uuid(), code: "SKILL-Graph", name_ar: "مهارة التمثيل البياني", kind: "skill", created_at: nowISO()},
    {id: uuid(), code: "CONTEXT-MARKET", name_ar: "سياق سوق محلي", kind: "context", created_at: nowISO()},
    {id: uuid(), code: "FORM-Word", name_ar: "مسألة لفظية", kind: "form", created_at: nowISO()},
];

// —————————————————————————————————————————————
// Media assets (few examples)
// —————————————————————————————————————————————
export const mediaAssets: MediaAsset[] = [
    {
        id: uuid(),
        s3_url: "s3://mounir/media/triangles1.png",
        kind: "image",
        sha256: hex(32),
        width: 1200,
        height: 800,
        meta: {exif_removed: true},
        created_at: nowISO()
    },
    {
        id: uuid(),
        s3_url: "s3://mounir/media/line-graph.svg",
        kind: "svg",
        sha256: hex(32),
        width: 800,
        height: 600,
        meta: {},
        created_at: nowISO()
    },
    {
        id: uuid(),
        s3_url: "s3://mounir/media/circle-theorem.pdf",
        kind: "pdf",
        sha256: hex(32),
        width: null,
        height: null,
        meta: {pages: 1},
        created_at: nowISO()
    },
];
const mediaPool = mediaAssets.map(m => m.id);

// —————————————————————————————————————————————
// Draft Items Generator (MCQ-focused)
// —————————————————————————————————————————————
const ITEM_COUNT = 60; // increase to generate a larger dataset (e.g., 120/300)
const statuses: ItemStatus[] = ["draft", "in_review", "changes_requested"];
const itemTypes: ItemType[] = ["mcq"]; // Phase-0 focus; extend later
const stemTemplates = [
    "أوجد قيمة \\(x\\) في المعادلة: {{latex}}",
    "ما الحل الصحيح للمعادلة التالية؟ {{latex}}",
    "اختر الجواب الصحيح: {{latex}}",
    "إذا كانت {{latex}}، فما قيمة \\(x\\)؟"
];

// simple LaTeX pool by concept
const byConceptLatex: Record<string, string[]> = {
    "ALG-10-LINEAR": [
        "2x + 3 = 11", "5x - 7 = 23", "3x = 2x + 9", "7 - 2x = 1"
    ],
    "ALG-10-FACTOR": [
        "x^2 - 9", "x^2 + 5x + 6", "x^2 - 5x + 6", "x^2 - 4x"
    ],
    "FUN-11-LINEAR": [
        "y = 2x + 1", "y = -x + 4", "y = 3x - 2"
    ],
    "ALG-11-QUAD": [
        "x^2 - 4x + 3 = 0", "x^2 + x - 6 = 0", "x^2 - 9 = 0"
    ],
    "GEO-10-TRI": [
        "مثلث قائم الزاوية بطولَي ساقين 3 و4، طول الوتر؟"
    ],
    "GEO-11-CIRC": [
        "زاوية محيطية تقابل قوسًا قياسه 60^\\circ، قياس الزاوية؟"
    ],
    "CAL-12-DERIV": [
        "f(x)=x^2+3x، أوجد f'(x)", "f(x)=3x^3، أوجد f'(x)"
    ],
    "CAL-12-APPL": [
        "أوجد ميل المماس للدالة f(x)=x^2 عند x=2"
    ],
    "STA-12-DESC": [
        "المتوسط الحسابي للقيم 4,7,9"
    ],
    "FUN-11-FUNC-BASIC": [
        "إذا كانت f(x)=2x+1، أوجد f(3)"
    ]
};

const conceptCodes = Object.keys(byConceptLatex).filter(code => conceptByCode[code]);
const conceptWeights = (code: string) => {
    // some items touch two concepts (weight splits)
    if (Math.random() < 0.2 && code !== "CAL-12-APPL") {
        const alt = pick(conceptCodes.filter(c => c !== code));
        return [
            {code, weight: 0.7},
            {code: alt, weight: 0.3}
        ];
    }
    return [{code, weight: 1.0}];
};

const makeOptions = (owner_id: UUID, owner_type: OwnerType, correctText: string, distractors: string[]): ItemOption[] => {
    const optId = () => uuid();
    return [
        {
            id: optId(),
            owner_id,
            owner_type,
            order_index: 0,
            text_ar: correctText,
            latex: null,
            is_correct: true,
            explanation_ar: "الإجابة مطابقة لخطوات الحل.",
            meta: {}
        },
        {
            id: optId(),
            owner_id,
            owner_type,
            order_index: 1,
            text_ar: distractors[0],
            latex: null,
            is_correct: false,
            explanation_ar: "سهو في النقل أو جمع الحدود.",
            meta: {}
        },
        {
            id: optId(),
            owner_id,
            owner_type,
            order_index: 2,
            text_ar: distractors[1],
            latex: null,
            is_correct: false,
            explanation_ar: "خطأ في الإشارة.",
            meta: {}
        },
        {
            id: optId(),
            owner_id,
            owner_type,
            order_index: 3,
            text_ar: distractors[2] ?? "لا شيء مما سبق",
            latex: null,
            is_correct: false,
            explanation_ar: "ليست النتيجة الصحيحة.",
            meta: {}
        },
    ];
};

const makeLinearSolution = (owner_id: UUID, owner_type: OwnerType, a: number, b: number, c: number): ItemSolution => {
    // ax + b = c -> x = (c-b)/a
    const steps = [
        {text_ar: `نطرح ${b} من الطرفين.`, expr_latex: `${a}x = ${c - b}`},
        {text_ar: `نقسم على ${a}.`, expr_latex: `x = ${(c - b)}/${a}`},
        {text_ar: `الحل النهائي.`, expr_latex: `x = ${(c - b) / a}`},
    ];
    return {
        id: uuid(),
        owner_id,
        owner_type,
        steps,
        final_answer: `${(c - b) / a}`,
        final_latex: `x=${(c - b) / a}`,
        meta: {}
    };
};

const makeHints = (owner_id: UUID, owner_type: OwnerType): ItemHint[] => ([
    {
        id: uuid(),
        owner_id,
        owner_type,
        order_index: 0,
        hint_ar: "ابدأ بعزل الطرف الذي يحوي المتغير.",
        trigger_rule: "after_1_wrong",
        meta: {}
    },
    {
        id: uuid(),
        owner_id,
        owner_type,
        order_index: 1,
        hint_ar: "تذكّر ترتيب العمليات وإشارات الحدود.",
        trigger_rule: "time>90s",
        meta: {}
    }
]);

const attachMediaMaybe = (owner_id: UUID, owner_type: OwnerType): ItemMedia[] => {
    if (Math.random() < 0.25 && mediaPool.length) {
        return [{
            id: uuid(), owner_id, owner_type, media_id: pick(mediaPool),
            role: pick(["diagram", "figure", "reference"]), order_index: 0
        }];
    }
    return [];
};

const makeStem = (latex: string) => pick(stemTemplates).replace("{{latex}}", `\\(${latex}\\)`);

// —————————————————————————————————————————————
// Build Drafts with children + concept mapping
// —————————————————————————————————————————————
export const itemsDraft: ItemDraft[] = [];
export const itemOptions: ItemOption[] = [];
export const itemHints: ItemHint[] = [];
export const itemSolutions: ItemSolution[] = [];
export const itemConcepts: ItemConcept[] = [];
export const itemMedia: ItemMedia[] = [];
export const itemTags: ItemTag[] = [];
export const itemVersions: ItemVersion[] = [];
export const itemReviews: ItemReview[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
for (const i of range(ITEM_COUNT)) {
    const conceptCode = pick(conceptCodes);
    const latexPool = byConceptLatex[conceptCode];
    const latex = pick(latexPool);
    const draftId = uuid();
    const status: ItemStatus = pick(statuses);

    const draft: ItemDraft = {
        id: draftId,
        status,
        item_type: pick(itemTypes),
        stem_ar: makeStem(latex),
        latex,
        difficulty_est: +(Math.random() * 8 + 1).toFixed(2),
        content_hash: null,
        created_by: AUTHOR_ID,
        updated_by: AUTHOR_ID,
        meta: {source: "manual", estimated_time_sec: Math.floor(Math.random() * 60) + 30},
        created_at: nowISO(),
        updated_at: nowISO(),
    };
    itemsDraft.push(draft);

    // Map one or two concepts
    const weights = conceptWeights(conceptCode);
    for (const w of weights) {
        const concept = conceptByCode[w.code];
        if (concept) itemConcepts.push({item_id: draftId, concept_id: concept.id, weight: w.weight});
    }

    // Simple correct/distractors generator
    let options: ItemOption[] = [];
    let solution: ItemSolution;

    if (conceptCode.startsWith("ALG-10-LINEAR")) {
        // parse "ax + b = c" if possible; else fallback
        const m = latex.match(/^\s*(-?\d+)\s*x\s*\+\s*(-?\d+)\s*=\s*(-?\d+)\s*$/);
        if (m) {
            const a = parseInt(m[1], 10), b = parseInt(m[2], 10), c = parseInt(m[3], 10);
            const x = (c - b) / a;
            solution = makeLinearSolution(draftId, "draft", a, b, c);
            options = makeOptions(draftId, "draft", `${x}`, [`${x + 1}`, `${x - 1}`, `${x * 2}`]);
        } else {
            solution = {
                id: uuid(),
                owner_id: draftId,
                owner_type: "draft",
                steps: [{text_ar: "أعد ترتيب الحدود."}],
                final_answer: null,
                final_latex: null,
                meta: {}
            };
            options = makeOptions(draftId, "draft", "3", ["2", "4", "1"]);
        }
    } else if (conceptCode === "ALG-11-QUAD") {
        // quadratic simple roots guessing
        const roots = [[1, 3], [2, 3], [3, -3], [1, -3]][Math.floor(Math.random() * 4)];
        const correct = roots[0];
        solution = {
            id: uuid(),
            owner_id: draftId, owner_type: "draft",
            steps: [
                {text_ar: "نطبّق القانون أو التحليل إلى عوامل."},
                {text_ar: "نساوي كل عامل بالصفر ونستنتج الجذور."}
            ],
            final_answer: `x=${correct}`, final_latex: `x=${correct}`, meta: {}
        };
        options = makeOptions(draftId, "draft", `x=${correct}`, ["x=0", "x=1", "x=2"]);
    } else if (conceptCode.startsWith("FUN-11")) {
        solution = {
            id: uuid(), owner_id: draftId, owner_type: "draft",
            steps: [{text_ar: "عوّض قيمة x في تعريف الدالة."}],
            final_answer: "", final_latex: null, meta: {}
        };
        options = makeOptions(draftId, "draft", "صحيحة", ["غير صحيحة", "لا يمكن التحديد", "لا شيء مما سبق"]);
    } else if (conceptCode.startsWith("CAL-12")) {
        solution = {
            id: uuid(), owner_id: draftId, owner_type: "draft",
            steps: [{text_ar: "استخدم قواعد الاشتقاق الأساسية."}],
            final_answer: "", final_latex: null, meta: {}
        };
        options = makeOptions(draftId, "draft", "الميل = 4", ["الميل = 2", "الميل = 0", "الميل = -4"]);
    } else {
        solution = {
            id: uuid(), owner_id: draftId, owner_type: "draft",
            steps: [{text_ar: "حل استدلالي وفق التعاريف."}],
            final_answer: "", final_latex: null, meta: {}
        };
        options = makeOptions(draftId, "draft", "الإجابة أ", ["الإجابة ب", "الإجابة ج", "الإجابة د"]);
    }

    itemSolutions.push(solution);
    itemOptions.push(...options);
    itemHints.push(...makeHints(draftId, "draft"));
    itemMedia.push(...attachMediaMaybe(draftId, "draft"));

    // Tags (random attach 0..2)
    if (Math.random() < 0.5) {
        const picked = pick(tags);
        itemTags.push({item_id: draftId, tag_id: picked.id});
    }

    // Version + (maybe) Review
    itemVersions.push({
        id: uuid(), item_id: draftId, ver: 1,
        diff_notes: "إنشاء أولي", snapshot: {stem_ar: draft.stem_ar, latex: draft.latex},
        created_by: AUTHOR_ID, created_at: nowISO()
    });
    if (status !== "draft") {
        itemReviews.push({
            id: uuid(), item_id: draftId, reviewer_id: REVIEWER_ID,
            decision: status === "in_review" ? "changes_requested" : "approved",
            notes: status === "in_review" ? "وضّح الخطوة الثانية." : "مطابق للمعيار.",
            created_at: nowISO()
        });
    }
}

// —————————————————————————————————————————————
// A few Published items (immutable) cloned from some drafts
// —————————————————————————————————————————————
const takeForPublish = itemsDraft.slice(0, 3);
export const itemsProd: ItemProd[] = takeForPublish.map((d, idx) => {
    const mainConcept = itemConcepts.find(ic => ic.item_id === d.id)?.concept_id ?? null;
    return {
        id: uuid(),
        source_draft_id: d.id,
        item_type: d.item_type,
        stem_ar: d.stem_ar,
        latex: d.latex ?? null,
        difficulty_params: null, // reserve for IRT later
        published_ver: 1 + idx,
        concept_main_id: mainConcept,
        meta: {release: "seed"},
        published_at: nowISO()
    };
});

// Copy child rows for prod (owner_type='prod')
export const prodOptions: ItemOption[] = [];
export const prodHints: ItemHint[] = [];
export const prodSolutions: ItemSolution[] = [];

for (const prod of itemsProd) {
    const draftId = prod.source_draft_id;
    const opts = itemOptions.filter(o => o.owner_id === draftId && o.owner_type === "draft")
        .map(o => ({...o, id: uuid(), owner_id: prod.id, owner_type: "prod" as OwnerType}));
    const hnts = itemHints.filter(h => h.owner_id === draftId && h.owner_type === "draft")
        .map(h => ({...h, id: uuid(), owner_id: prod.id, owner_type: "prod" as OwnerType}));
    const sol = itemSolutions.find(s => s.owner_id === draftId && s.owner_type === "draft");
    if (sol) prodSolutions.push({...sol, id: uuid(), owner_id: prod.id, owner_type: "prod"});

    prodOptions.push(...opts);
    prodHints.push(...hnts);
}

// —————————————————————————————————————————————
// Import Batch (example)
// —————————————————————————————————————————————
/*export const importBatch: ImportBatch = {
    id: uuid(),
    src_type: "csv",
    status: "done",
    summary: {total: 20, created: 18, duplicate: 2, error: 0},
    created_by: ADMIN_ID,
    created_at: nowISO(),
    updated_at: nowISO()
};*/
/*export const importLogs: ImportLog[] = [
    {
        id: uuid(),
        batch_id: importBatch.id,
        row_ref: "12",
        action: "duplicate",
        item_id: itemsDraft[5]?.id ?? null,
        notes: "hash collision",
        created_at: nowISO()
    },
    {
        id: uuid(),
        batch_id: importBatch.id,
        row_ref: "13",
        action: "created",
        item_id: itemsDraft[6]?.id ?? null,
        notes: "ok",
        created_at: nowISO()
    },
];*/

// —————————————————————————————————————————————
// Meili search doc shapes (authoring/search panes)
// —————————————————————————————————————————————
// export interface MsItemDraftDoc { id:UUID; item_type:ItemType; status:ItemStatus; stem_ar:string; latex?:string|null; concept_codes:string[]; tag_codes?:string[]; updated_at:ISO; }
export interface MsConceptDoc { id:UUID; code:string; name_ar:string; grade:number; strand:Strand; }

export const msConceptDocs: MsConceptDoc[] =
    concepts.map(c => ({ id:c.id, code:c.code, name_ar:c.name_ar, grade:c.grade, strand:c.strand }));

export const msItemDraftDocs: {
    updated_at: string | undefined;
    item_type: "mcq" | "multi_select" | "numeric" | "short_text" | "proof";
    stem_ar: string;
    concept_codes: string[];
    tag_codes: string[];
    id: string;
    latex: string | null;
    status: "draft" | "in_review" | "changes_requested" | "archived"
}[] = itemsDraft.map(d => {
    const codes = itemConcepts.filter(ic=>ic.item_id===d.id).map(ic => {
        const c = concepts.find(cc=>cc.id===ic.concept_id);
        return c?.code || "";
    }).filter(Boolean);
    const tagsForItem = itemTags.filter(t=>t.item_id===d.id).map(t => {
        const tag = tags.find(tt=>tt.id===t.tag_id);
        return tag?.code || "";
    }).filter(Boolean);
    return {
        id: d.id,
        item_type: d.item_type,
        status: d.status,
        stem_ar: d.stem_ar,
        latex: d.latex ?? null,
        concept_codes: codes,
        tag_codes: tagsForItem,
        updated_at: d.updated_by ? d.updated_at : d.created_at
    };
});

// —————————————————————————————————————————————
// Export a single bundle for convenience
// —————————————————————————————————————————————
export const db = {
    users,
    concepts,
    tags,
    mediaAssets,
    itemsDraft,
    itemOptions,
    itemHints,
    itemSolutions,
    itemConcepts,
    itemMedia,
    itemTags,
    itemVersions,
    itemReviews,
    itemsProd,
    prodOptions,
    prodHints,
    prodSolutions,
    msConceptDocs,
    msItemDraftDocs
};

// Example usage in UI:
// import { db } from "./mockData";
// const drafts = db.itemsDraft.slice(0, 10);
// const one = drafts[0];
// const options = db.itemOptions.filter(o => o.owner_id===one.id && o.owner_type==="draft");