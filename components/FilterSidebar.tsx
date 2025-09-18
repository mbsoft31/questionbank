
import React from 'react';
import { concepts } from '@/lib/mockData';

type FilterSidebarProps = {
    filters: {
        status: string[];
        grades: number[];
        strands: string[];
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        status: string[];
        grades: number[];
        strands: string[];
    }>>;
};

const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'in_review', label: 'قيد المراجعة' },
    { value: 'changes_requested', label: 'مطلوب تغييرات' },
];

const gradeOptions = [...new Set(concepts.map(c => c.grade))].sort((a, b) => a - b);
const strandOptions = [...new Set(concepts.map(c => c.strand))];

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, setFilters }) => {

    const handleCheckboxChange = <T extends string | number,>(
        category: 'status' | 'grades' | 'strands',
        value: T
    ) => {
        setFilters(prev => {
            const currentValues = prev[category] as T[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [category]: newValues };
        });
    };

    const FilterGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="py-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    );

    const Checkbox: React.FC<{ label: string; value: string | number; checked: boolean; onChange: () => void }> = ({ label, value, checked, onChange }) => (
        <label htmlFor={`${label}-${value}`} className="flex items-center space-x-3 cursor-pointer group">
            <input
                id={`${label}-${value}`}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition duration-150 ease-in-out"
            />
            <span className="text-slate-700 group-hover:text-indigo-600">{label}</span>
        </label>
    );

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 sticky top-24">
            <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-4 mb-2">الفلاتر</h2>

            <FilterGroup title="الحالة">
                {statusOptions.map(opt => (
                    <Checkbox key={opt.value} label={opt.label} value={opt.value} checked={filters.status.includes(opt.value)} onChange={() => handleCheckboxChange('status', opt.value)} />
                ))}
            </FilterGroup>

            <FilterGroup title="المرحلة الدراسية">
                {gradeOptions.map(grade => (
                    <Checkbox key={grade} label={`الصف ${grade}`} value={grade} checked={filters.grades.includes(grade)} onChange={() => handleCheckboxChange('grades', grade)} />
                ))}
            </FilterGroup>

            <FilterGroup title="المحور">
                {strandOptions.map(strand => (
                    <Checkbox key={strand} label={strand} value={strand} checked={filters.strands.includes(strand)} onChange={() => handleCheckboxChange('strands', strand)} />
                ))}
            </FilterGroup>
        </div>
    );
};

export default FilterSidebar;
