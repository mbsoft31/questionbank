#!/usr/bin/env tsx
import { sqlite } from '@/lib/sqlite';
import {
    users, concepts, tags, mediaAssets,
    itemsDraft, itemOptions, itemHints, itemSolutions,
    itemConcepts, itemMedia, itemTags, itemVersions, itemReviews,
    itemsProd, prodOptions, prodHints, prodSolutions,
} from "@/lib/mockData";

function j(x: unknown) { return x == null ? null : JSON.stringify(x); }

sqlite.exec("PRAGMA foreign_keys = OFF;"); // relax during seed

// ---------- DDL (idempotent) ----------
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, locale TEXT,
  created_at TEXT, updated_at TEXT
);

CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY, code TEXT UNIQUE, name_ar TEXT, grade INTEGER,
  strand TEXT, parent_id TEXT NULL, order_index INTEGER, meta TEXT,
  created_at TEXT, updated_at TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY, code TEXT UNIQUE, name_ar TEXT, kind TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY, s3_url TEXT, kind TEXT, sha256 TEXT,
  width INTEGER NULL, height INTEGER NULL, meta TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS items_draft (
  id TEXT PRIMARY KEY, status TEXT, item_type TEXT,
  stem_ar TEXT, latex TEXT NULL, difficulty_est REAL NULL, content_hash TEXT NULL,
  created_by TEXT, updated_by TEXT, meta TEXT, created_at TEXT, updated_at TEXT
);

CREATE TABLE IF NOT EXISTS item_options (
  id TEXT PRIMARY KEY, owner_id TEXT, owner_type TEXT CHECK(owner_type IN ('draft','prod')),
  order_index INTEGER, text_ar TEXT, latex TEXT NULL, is_correct INTEGER,
  explanation_ar TEXT NULL, meta TEXT
);

CREATE TABLE IF NOT EXISTS item_hints (
  id TEXT PRIMARY KEY, owner_id TEXT, owner_type TEXT CHECK(owner_type IN ('draft','prod')),
  order_index INTEGER, hint_ar TEXT, trigger_rule TEXT NULL, meta TEXT
);

CREATE TABLE IF NOT EXISTS item_solutions (
  id TEXT PRIMARY KEY, owner_id TEXT, owner_type TEXT CHECK(owner_type IN ('draft','prod')),
  steps TEXT, final_answer TEXT NULL, final_latex TEXT NULL, meta TEXT
);

CREATE TABLE IF NOT EXISTS item_concepts (
  item_id TEXT, concept_id TEXT, weight REAL, PRIMARY KEY(item_id, concept_id)
);

CREATE TABLE IF NOT EXISTS item_media (
  id TEXT PRIMARY KEY, owner_id TEXT, owner_type TEXT CHECK(owner_type IN ('draft','prod')),
  media_id TEXT, role TEXT NULL, order_index INTEGER
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id TEXT, tag_id TEXT, PRIMARY KEY(item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS item_versions (
  id TEXT PRIMARY KEY, item_id TEXT, ver INTEGER, diff_notes TEXT NULL,
  snapshot TEXT, created_by TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS item_reviews (
  id TEXT PRIMARY KEY, item_id TEXT, reviewer_id TEXT,
  decision TEXT, notes TEXT NULL, created_at TEXT
);

CREATE TABLE IF NOT EXISTS items_prod (
  id TEXT PRIMARY KEY, source_draft_id TEXT, item_type TEXT,
  stem_ar TEXT, latex TEXT NULL, difficulty_params TEXT NULL,
  published_ver INTEGER, concept_main_id TEXT NULL, meta TEXT, published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_items_draft_status      ON items_draft(status);
CREATE INDEX IF NOT EXISTS idx_items_draft_item_type   ON items_draft(item_type);
CREATE INDEX IF NOT EXISTS idx_items_draft_updated_at  ON items_draft(updated_at);
-- Concept mapping
CREATE INDEX IF NOT EXISTS idx_item_concepts_concept   ON item_concepts(concept_id, item_id);
-- Child rows (owner lookup)
CREATE INDEX IF NOT EXISTS idx_options_owner           ON item_options(owner_type, owner_id, order_index);
CREATE INDEX IF NOT EXISTS idx_hints_owner             ON item_hints(owner_type, owner_id, order_index);
CREATE INDEX IF NOT EXISTS idx_solutions_owner         ON item_solutions(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_media_owner             ON item_media(owner_type, owner_id, order_index);
CREATE INDEX IF NOT EXISTS idx_item_tags_item          ON item_tags(item_id, tag_id);
-- Prod
CREATE INDEX IF NOT EXISTS idx_items_prod_type         ON items_prod(item_type);
CREATE INDEX IF NOT EXISTS idx_items_prod_concept      ON items_prod(concept_main_id);
CREATE INDEX IF NOT EXISTS idx_items_prod_published_at ON items_prod(published_at);

`);

const tables = [
    "users","concepts","tags","media_assets",
    "items_draft","item_options","item_hints","item_solutions",
    "item_concepts","item_media","item_tags","item_versions","item_reviews",
    "items_prod"
];

sqlite.transaction(() => {
    // wipe
    for (const t of tables) sqlite.prepare(`DELETE FROM ${t}`).run();

    // users
    let stmt = sqlite.prepare(`INSERT INTO users VALUES (@id,@name,@email,@role,@locale,@created_at,@updated_at)`);
    users.forEach(u => stmt.run(u));

    // concepts
    stmt = sqlite.prepare(`INSERT INTO concepts VALUES (@id,@code,@name_ar,@grade,@strand,@parent_id,@order_index,@meta,@created_at,@updated_at)`);
    concepts.forEach(c => stmt.run({ ...c, meta: j(c.meta) }));

    // tags
    stmt = sqlite.prepare(`INSERT INTO tags VALUES (@id,@code,@name_ar,@kind,@created_at)`);
    tags.forEach(t => stmt.run(t));

    // media_assets
    stmt = sqlite.prepare(`INSERT INTO media_assets VALUES (@id,@s3_url,@kind,@sha256,@width,@height,@meta,@created_at)`);
    mediaAssets.forEach(m => stmt.run({ ...m, meta: j(m.meta) }));

    // items_draft
    stmt = sqlite.prepare(`INSERT INTO items_draft VALUES (@id,@status,@item_type,@stem_ar,@latex,@difficulty_est,@content_hash,@created_by,@updated_by,@meta,@created_at,@updated_at)`);
    itemsDraft.forEach(d => stmt.run({ ...d, meta: j(d.meta) }));

    // item_options (draft + prod live in same table)
    stmt = sqlite.prepare(`INSERT INTO item_options VALUES (@id,@owner_id,@owner_type,@order_index,@text_ar,@latex,@is_correct,@explanation_ar,@meta)`);
    itemOptions.forEach(o => stmt.run({ ...o, is_correct: o.is_correct ? 1 : 0, meta: j(o.meta) }));
    prodOptions.forEach(o => stmt.run({ ...o, is_correct: o.is_correct ? 1 : 0, meta: j(o.meta) }));

    // item_hints
    stmt = sqlite.prepare(`INSERT INTO item_hints VALUES (@id,@owner_id,@owner_type,@order_index,@hint_ar,@trigger_rule,@meta)`);
    itemHints.forEach(h => stmt.run({ ...h, meta: j(h.meta) }));
    prodHints.forEach(h => stmt.run({ ...h, meta: j(h.meta) }));

    // item_solutions
    stmt = sqlite.prepare(`INSERT INTO item_solutions VALUES (@id,@owner_id,@owner_type,@steps,@final_answer,@final_latex,@meta)`);
    itemSolutions.forEach(s => stmt.run({ ...s, steps: j(s.steps), meta: j(s.meta) }));
    prodSolutions.forEach(s => stmt.run({ ...s, steps: j(s.steps), meta: j(s.meta) }));

    // item_concepts
    stmt = sqlite.prepare(`INSERT INTO item_concepts VALUES (@item_id,@concept_id,@weight)`);
    itemConcepts.forEach(ic => stmt.run(ic));

    // item_media
    stmt = sqlite.prepare(`INSERT INTO item_media VALUES (@id,@owner_id,@owner_type,@media_id,@role,@order_index)`);
    itemMedia.forEach(im => stmt.run(im));

    // item_tags
    stmt = sqlite.prepare(`INSERT INTO item_tags VALUES (@item_id,@tag_id)`);
    itemTags.forEach(it => stmt.run(it));

    // item_versions
    stmt = sqlite.prepare(`INSERT INTO item_versions VALUES (@id,@item_id,@ver,@diff_notes,@snapshot,@created_by,@created_at)`);
    itemVersions.forEach(v => stmt.run({ ...v, snapshot: j(v.snapshot) }));

    // item_reviews
    stmt = sqlite.prepare(`INSERT INTO item_reviews VALUES (@id,@item_id,@reviewer_id,@decision,@notes,@created_at)`);
    itemReviews.forEach(r => stmt.run(r));

    // items_prod
    stmt = sqlite.prepare(`INSERT INTO items_prod VALUES (@id,@source_draft_id,@item_type,@stem_ar,@latex,@difficulty_params,@published_ver,@concept_main_id,@meta,@published_at)`);
    itemsProd.forEach(p => stmt.run({ ...p, difficulty_params: j(p.difficulty_params), meta: j(p.meta) }));

})();

sqlite.exec(`
-- FTS5 over stem_ar + latex, using external content table
CREATE VIRTUAL TABLE IF NOT EXISTS items_draft_fts
USING fts5(
  stem_ar, 
  latex, 
  content='items_draft', 
  content_rowid='id',
  tokenize = 'unicode61'
);

-- keep FTS in sync
CREATE TRIGGER IF NOT EXISTS items_draft_ai AFTER INSERT ON items_draft BEGIN
  INSERT INTO items_draft_fts(rowid, stem_ar, latex)
  VALUES (new.id, new.stem_ar, IFNULL(new.latex,''));
END;

CREATE TRIGGER IF NOT EXISTS items_draft_ad AFTER DELETE ON items_draft BEGIN
  INSERT INTO items_draft_fts(items_draft_fts, rowid, stem_ar, latex)
  VALUES ('delete', old.id, old.stem_ar, IFNULL(old.latex,''));
END;

CREATE TRIGGER IF NOT EXISTS items_draft_au AFTER UPDATE ON items_draft BEGIN
  INSERT INTO items_draft_fts(items_draft_fts, rowid, stem_ar, latex)
  VALUES ('delete', old.id, old.stem_ar, IFNULL(old.latex,''));
  INSERT INTO items_draft_fts(rowid, stem_ar, latex)
  VALUES (new.id, new.stem_ar, IFNULL(new.latex,''));
END;

-- initial full rebuild from content table
INSERT INTO items_draft_fts(items_draft_fts) VALUES('rebuild');
`);

sqlite.exec("PRAGMA foreign_keys = ON;");
console.log("✅ SQLite seed complete.");
