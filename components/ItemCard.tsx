import React from 'react';
import type { FullItem } from '@/types/ui';
import { Badge } from '@/components/ui/badge';

type ItemCardProps = {
    item: FullItem;
    onSelect: () => void;
};

type StatusInfo = {
    color: string | 'blue' | 'green' | 'yellow' | 'red' | 'gray';
    text: string;
}

const statusMap = {
    "draft": { text: 'مسودة', color: 'blue' },
    "in_review": { text: 'قيد المراجعة', color: 'yellow' },
    "changes_requested": { text: 'مطلوب تغييرات', color: 'red' },
    "archived": { text: 'مؤرشف', color: 'gray' },
};

const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
    const mainConcept = item.concepts[0];
    const statusInfo: StatusInfo = statusMap[item.status];

    // Basic LaTeX to styled text conversion
    const renderStem = (stem: string) => {
        return stem.split(/(\\\(.*?\\\))/g).map((part, index) => {
            if (part.startsWith('\\(') && part.endsWith('\\)')) {
                return <span key={index} className="font-mono text-indigo-600 bg-indigo-50 p-1 rounded-md">{part.slice(2, -2)}</span>;
            }
            return part;
        });
    };

    return (
        <div
            onClick={onSelect}
            className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
        >
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <Badge color={statusInfo.color}>{statusInfo.text}</Badge>
                    <span className="text-xs text-slate-400 font-mono">{item.id}</span>
                </div>
                <p className="text-slate-800 leading-relaxed line-clamp-3">
                    {renderStem(item.stem_ar)}
                </p>
            </div>
            <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-4 rounded-b-xl">
                {mainConcept && (
                    <div className="text-sm text-slate-600">
                        <span className="font-semibold">{mainConcept.name_ar}</span>
                        <span className="text-slate-400 mx-2">|</span>
                        <span>الصف {mainConcept.grade}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemCard;
