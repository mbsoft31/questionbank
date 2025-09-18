import React from 'react';
import ItemCard from '@/components/ItemCard';
import type { FullItem } from "@/types/ui";

type ItemListProps = {
    items: FullItem[];
    onSelectItem: (id: string) => void;
};

const ItemList: React.FC<ItemListProps> = ({ items, onSelectItem }) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-slate-900">لا توجد عناصر مطابقة</h3>
                <p className="mt-1 text-sm text-slate-500">جرّب تعديل الفلاتر للبحث عن عناصر أخرى.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map(item => (
                <ItemCard key={item.id} item={item} onSelect={() => onSelectItem(item.id)} />
            ))}
        </div>
    );
};

export default ItemList;