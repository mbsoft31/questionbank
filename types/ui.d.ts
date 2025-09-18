import type { Concept, ItemDraft, Tag, User } from '@/types';

export type FullItem = ItemDraft & {
    concepts: (Concept & { weight: number })[];
    tags: Tag[];
    author?: User;
};
