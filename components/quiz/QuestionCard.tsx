import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, FileText } from 'lucide-react';
import { QuizQuestion } from '../../types/quiz';
import { cn } from '../../lib/utils';
import { useQuizStore } from '../../stores/use-quiz-store';

interface QuestionCardProps {
    question: QuizQuestion;
    questionIndex: number;
    totalQuestions: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, questionIndex, totalQuestions }) => {
    const { submitAnswer, answers, nextQuestion } = useQuizStore();
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string | number | null>(null);

    // Check store for existing answer
    const storeAnswer = answers[question.id];
    const hasAnswered = storeAnswer !== undefined;

    // Reset or Sync State on Mount
    useEffect(() => {
        if (hasAnswered) {
            setSelectedOptionId(storeAnswer);
            setIsFlipped(true); // Show back immediately if already answered
        } else {
            setSelectedOptionId(null);
            setIsFlipped(false);
        }
    }, [question.id, hasAnswered, storeAnswer]);

    const handleOptionSelect = (optionId: string | number) => {
        if (hasAnswered) return;

        setSelectedOptionId(optionId);
        submitAnswer(question.id, optionId);

        // Delay flip for visual feedback
        setTimeout(() => setIsFlipped(true), 600);
    };

    const isCorrect = (optionId: string | number | null) => {
        if (optionId === null) return false;
        return question.answers.includes(optionId);
    };

    // Card Glow Border Color
    const getBorderColor = () => {
        if (!isFlipped) return 'border-slate-200 dark:border-slate-800';
        if (isCorrect(selectedOptionId)) return 'border-emerald-500 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)] dark:shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)]';
        return 'border-rose-500 shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)] dark:shadow-[0_0_50px_-10px_rgba(244,63,94,0.3)]';
    };

    return (
        <div className="relative w-full max-w-2xl aspect-[4/3] perspective-1000">
            <motion.div
                className="w-full h-full relative"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* ─── FRONT FACE ─── */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden flex flex-col",
                        "bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300",
                        getBorderColor()
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Decorative Gradient Blob (Subtler) */}
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none" />

                    <div className="flex-1 flex flex-col p-8 md:p-12 z-10 overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <span className="text-slate-200 dark:text-slate-800 text-4xl font-serif font-medium leading-none">
                                {String(questionIndex).padStart(2, '0')}
                            </span>
                            <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                                {question.question_type}
                            </div>
                        </div>

                        {/* Question Text - Scrollable if too long */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 pr-2">
                            <h2 className="text-2xl md:text-3xl font-medium text-slate-900 dark:text-slate-100 leading-normal">
                                {question.question_text || "Question text missing..."}
                            </h2>
                        </div>

                        {/* Options */}
                        <div className="mt-6 flex flex-col gap-3 shrink-0">
                            {question.options.map((option) => {
                                const isSelected = selectedOptionId === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => handleOptionSelect(option.id)}
                                        disabled={hasAnswered}
                                        className={cn(
                                            "group relative w-full text-left p-4 rounded-xl border transition-all duration-200",
                                            isSelected
                                                ? "bg-indigo-600 border-indigo-600 text-white scale-[1.01] shadow-lg"
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border transition-colors",
                                                isSelected
                                                    ? "border-indigo-400 bg-indigo-500 text-white"
                                                    : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                                            )}>
                                                {option.id}
                                            </div>
                                            <span className="text-base font-medium">
                                                {option.text}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ─── BACK FACE ─── */}
                <div
                    className={cn(
                        "absolute inset-0 flex flex-col",
                        "bg-slate-50 dark:bg-slate-800 border rounded-3xl overflow-hidden shadow-xl",
                        isCorrect(selectedOptionId)
                            ? "border-emerald-500/50 dark:border-emerald-500/30"
                            : "border-rose-500/50 dark:border-rose-500/30"
                    )}
                    style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    <div className="h-full flex flex-col p-8 md:p-12 relative z-10">
                        {/* Status Header */}
                        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
                            <div className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center border-2",
                                isCorrect(selectedOptionId)
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-100 dark:bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400"
                            )}>
                                {isCorrect(selectedOptionId) ? <Check size={28} /> : <X size={28} />}
                            </div>
                            <div>
                                <h3 className={cn(
                                    "text-2xl font-bold tracking-tight",
                                    isCorrect(selectedOptionId) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                )}>
                                    {isCorrect(selectedOptionId) ? "Correct Answer" : "Incorrect"}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
                                    {isCorrect(selectedOptionId) ? "Well done!" : "Review the explanation below."}
                                </p>
                            </div>
                        </div>

                        {/* Scrollable Context */}
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                        Explanation
                                    </h4>
                                    <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-light">
                                        {question.explanation || "No explanation provided for this question."}
                                    </p>
                                </div>

                                {question.reference_text && (
                                    <div className="bg-slate-200/50 dark:bg-black/20 rounded-xl p-5 border border-slate-200 dark:border-white/5">
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3">
                                            <FileText size={14} />
                                            Source Context
                                        </h4>
                                        <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed">
                                            "{question.reference_text}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Button */}
                        <div className="pt-8 mt-auto">
                            <button
                                onClick={nextQuestion}
                                className="w-full group py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <span>Continue</span>
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QuestionCard;
