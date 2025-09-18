
import React from 'react';
import type { FullItem } from '@/types/ui';
import { db } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Image from "next/image";

type ItemDetailProps = {
    item: FullItem;
    onBack: () => void;
};

const statusMap = {
    "draft": { text: 'مسودة', color: 'blue' },
    "in_review": { text: 'قيد المراجعة', color: 'yellow' },
    "changes_requested": { text: 'مطلوب تغييرات', color: 'red' },
    "archived": { text: 'مؤرشف', color: 'gray' },
};
const CheckCircleIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const XCircleIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);


const ItemDetail: React.FC<ItemDetailProps> = ({ item, onBack }) => {
    const options = db.itemOptions.filter(o => o.owner_id === item.id);
    const solution = db.itemSolutions.find(s => s.owner_id === item.id);
    const reviews = db.itemReviews.filter(r => r.item_id === item.id);
    const media = db.itemMedia.filter(m => m.owner_id === item.id).map(m => db.mediaAssets.find(ma => ma.id === m.media_id)).filter(Boolean);
    const statusInfo = statusMap[item.status];

    /*const renderLatex = (text: string | null | undefined) => {
        if (!text) return null;
        return text.split(/(\\\(.*?\\\))/g).map((part, index) => {
            if (part.startsWith('\\(') && part.endsWith('\\)')) {
                return <code key={index} className="font-mono text-lg text-indigo-700 bg-indigo-100 p-1 rounded-md mx-1">{part.slice(2, -2)}</code>;
            }
            return part;
        });
    };*/

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    <span>العودة للقائمة</span>
                </button>
                <Badge color={statusInfo.color}>{statusInfo.text}</Badge>
            </div>

            <Card title="نص السؤال">
                <p className="text-xl text-slate-800 leading-loose">{item.stem_ar}</p>
                {media.length > 0 && (
                    <div className="mt-6">
                        {media.map(m => m && <Image key={m.id} src={m.s3_url} alt="Related media" className="rounded-lg max-w-sm border border-slate-200" />)}
                    </div>
                )}
            </Card>

            <Card title="الخيارات">
                <div className="space-y-4">
                    {options.sort((a,b) => a.order_index - b.order_index).map(opt => (
                        <div key={opt.id} className={`p-4 rounded-lg border flex items-start space-x-4 ${opt.is_correct ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            {opt.is_correct ? <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />}
                            <div>
                                <p className="font-medium text-slate-800">{opt.text_ar}</p>
                                {opt.explanation_ar && <p className="text-sm text-slate-500 mt-1">{opt.explanation_ar}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {solution && (
                <Card title="خطوات الحل">
                    <div className="prose prose-slate max-w-none">
                        <ol className="list-decimal list-inside space-y-3">
                            {solution.steps.map((step, idx) => (
                                <li key={idx}>
                                    {step.text_ar}
                                    {step.expr_latex && <div className="p-2 my-2 bg-slate-100 rounded-md text-center"><code className="text-slate-700">{`\\(${step.expr_latex}\\)`}</code></div>}
                                </li>
                            ))}
                        </ol>
                        {solution.final_latex && <div className="mt-4 pt-4 border-t border-slate-200 text-center font-bold text-indigo-600 text-lg">{`\\(${solution.final_latex}\\)`}</div>}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="البيانات الوصفية">
                    <dl className="space-y-4">
                        <div className="flex justify-between"><dt className="font-medium text-slate-600">المفاهيم</dt><dd className="text-left">{item.concepts.map(c => `${c.name_ar} (${c.weight*100}%)`).join(', ')}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-slate-600">الوسوم</dt><dd className="text-left">{item.tags.length > 0 ? item.tags.map(t => t.name_ar).join(', ') : 'لا يوجد'}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-slate-600">تقدير الصعوبة</dt><dd className="font-mono">{item.difficulty_est?.toFixed(2)}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-slate-600">المؤلف</dt><dd>{item.author?.name || 'غير معروف'}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-slate-600">تاريخ الإنشاء</dt><dd className="text-left">{item.created_at && new Date(item.created_at).toLocaleDateString('ar-EG')}</dd></div>
                    </dl>
                </Card>
                <Card title="سجل المراجعات">
                    {reviews.length > 0 ? (
                        <ul className="space-y-4">
                            {reviews.map(review => {
                                const reviewer = db.users.find(u => u.id === review.reviewer_id);
                                const isApproved = review.decision === 'approved';
                                return (
                                    <li key={review.id} className="flex space-x-4">
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isApproved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {isApproved ? '✓' : '✗'}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{reviewer?.name} <span className={`text-sm font-normal ${isApproved ? 'text-green-700' : 'text-red-700'}`}>{isApproved ? 'وافق على' : 'طلب تغييرات'}</span></p>
                                            <p className="text-sm text-slate-600 italic">&#34;{review.notes}&#34;</p>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(review.created_at).toLocaleString('ar-EG')}</p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <p className="text-slate-500 text-center py-4">لا توجد مراجعات بعد.</p>
                    )}
                </Card>
            </div>

        </div>
    );
};

export default ItemDetail;
