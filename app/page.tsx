"use client";
import React, { useState, useMemo, useEffect } from 'react';
import type { Concept, Tag } from '@/types';
import { concepts, itemsDraft, users, tags, itemConcepts as itemConceptsMap, itemTags as itemTagsMap } from '@/lib/mockData';
import FilterSidebar from '@/components/FilterSidebar';
import ItemList from '@/components/ItemList';
import ItemDetail from '@/components/ItemDetail';
import { FullItem } from '@/types/ui';

const App: React.FC = () => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status: string[];
    grades: number[];
    strands: string[];
  }>({ status: [], grades: [], strands: [] });

  const conceptMap = useMemo(() => new Map(concepts.map(c => [c.id, c])), []);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), []);
  const tagMap = useMemo(() => new Map(tags.map(t => [t.id, t])), []);

  const fullItems = useMemo((): FullItem[] => {
    return itemsDraft.map(draft => {
      const itemConcepts = itemConceptsMap
          .filter(ic => ic.item_id === draft.id)
          .map(ic => {
            const concept = conceptMap.get(ic.concept_id);
            return concept ? { ...concept, weight: ic.weight } : null;
          })
          .filter((c): c is Concept & { weight: number } => c !== null);

      const itemTags = itemTagsMap
          .filter(it => it.item_id === draft.id)
          .map(it => tagMap.get(it.tag_id))
          .filter((t): t is Tag => t !== undefined);

      const author = userMap.get(draft.created_by);

      return {
        ...draft,
        concepts: itemConcepts,
        tags: itemTags,
        author,
      };
    });
  }, [conceptMap, userMap, tagMap]);

  const filteredItems = useMemo(() => {
    return fullItems.filter(item => {
      const statusMatch = filters.status.length === 0 || filters.status.includes(item.status);
      const gradeMatch = filters.grades.length === 0 || item.concepts.some(c => filters.grades.includes(c.grade));
      const strandMatch = filters.strands.length === 0 || item.concepts.some(c => filters.strands.includes(c.strand));
      return statusMatch && gradeMatch && strandMatch;
    });
  }, [fullItems, filters]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return fullItems.find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, fullItems]);

  useEffect(() => {
    // When filters change, if the currently selected item is no longer in the filtered list, deselect it.
    if (selectedItemId && !filteredItems.some(item => item.id === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [filteredItems, selectedItemId]);


  const handleSelecteItem = (id: string) => {
    setSelectedItemId(id);
  };

  const handleClearSelection = () => {
    setSelectedItemId(null);
  }

  return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <h1 className="text-xl font-bold text-slate-900">مستودع الأسئلة</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </aside>
            <div className="lg:col-span-3">
              {selectedItem ? (
                  <ItemDetail item={selectedItem} onBack={handleClearSelection} />
              ) : (
                  <ItemList items={filteredItems} onSelectItem={handleSelecteItem} />
              )}
            </div>
          </div>
        </main>
      </div>
  );
};

export default App;
