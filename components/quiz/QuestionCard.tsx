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

    // Check if this question has already been answered in the store
    const storeAnswer = answers[question.id];
    const hasAnswered = storeAnswer !== undefined;

    // Sync local state with store state if returning to question
    useEffect(() => {
        if (hasAnswered) {
            setSelectedOptionId(storeAnswer);
            // If already answered, show the back immediately or after a very short delay
            setIsFlipped(true);
        } else {
            // New question (remapped via key in parent), reset state
            setSelectedOptionId(null);
            setIsFlipped(false);
        }
    }, [question.id, hasAnswered, storeAnswer]);

    const handleOptionSelect = (optionId: string | number) => {
        if (hasAnswered) return;

        setSelectedOptionId(optionId);
        submitAnswer(question.id, optionId);

        // Delay flip to show selection feedback
        setTimeout(() => setIsFlipped(true), 800);
    };

    const isCorrect = (optionId: string | number | null) => {
        if (optionId === null) return false;
        return question.answers.includes(optionId);
    };

    return (
        <div className="relative w-full aspect-[3/4] md:aspect-[4/5] perspective-1000">
            <motion.div
                className="w-full h-full relative"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* FRONT FACE: The Editorial Question */}
                <div
                    className="absolute inset-0 backface-hidden flex flex-col"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="w-full h-full bg-white/10 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] rounded-3xl p-8 md:p-12 flex flex-col relative overflow-hidden">

                        {/* Geometric Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        {/* Header: Index & Type */}
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-5xl font-serif font-bold text-white/10 leading-none">
                                    {String(questionIndex).padStart(2, '0')}
                                </span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium tracking-widest text-white/60 uppercase">
                                {question.question_type}
                            </span>
                        </div>

                        {/* Question Text - SERIF & High Contrast */}
                        <div className="flex-1 flex items-center relative z-10">
                            <h2 className="text-2xl md:text-3xl font-serif text-zinc-100 leading-snug drop-shadow-sm">
                                {question.question_text}
                            </h2>
                        </div>

                        {/* Options Stack */}
                        <div className="flex flex-col gap-3 mt-8 relative z-10">
                            {question.options.map((option) => {
                                const isSelected = selectedOptionId === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => handleOptionSelect(option.id)}
                                        disabled={hasAnswered}
                                        className={cn(
                                            "group relative w-full text-left p-4 rounded-xl border transition-all duration-300",
                                            isSelected
                                                ? "bg-white text-black border-white shadow-xl scale-[1.02]"
                                                : "bg-black/20 border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium transition-colors",
                                                isSelected
                                                    ? "border-black text-black"
                                                    : "border-white/20 text-white/40 group-hover:border-white/40"
                                            )}>
                                                {option.id}
                                            </span>
                                            <span className="text-sm md:text-base font-medium tracking-wide">
                                                {option.text}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* BACK FACE: The Insight */}
                <div
                    className="absolute inset-0 flex flex-col"
                    style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    <div className="w-full h-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl p-8 md:p-12 flex flex-col relative overflow-hidden">

                        {/* Result Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border",
                                isCorrect(selectedOptionId)
                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                    : "bg-rose-500/20 border-rose-500/50 text-rose-400"
                            )}>
                                {isCorrect(selectedOptionId)
                                    ? <Check size={20} className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                    : <X size={20} className="drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />
                                }
                            </div>
                            <div>
                                <h3 className={cn(
                                    "text-xl font-sans font-bold tracking-tight",
                                    isCorrect(selectedOptionId) ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {isCorrect(selectedOptionId) ? "Correct" : "Incorrect"}
                                </h3>
                                <div className="text-white/40 text-xs uppercase tracking-wider font-medium mt-0.5">
                                    Result Analysis
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                            {/* Explanation */}
                            <div className="prose prose-invert prose-p:text-zinc-300 prose-headings:text-white max-w-none">
                                <p className="text-lg leading-relaxed font-light">
                                    {question.explanation}
                                </p>
                            </div>

                            {/* Source Context */}
                            {question.reference_text && (
                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                                        <FileText size={12} />
                                        Source Material
                                    </h4>
                                    <blockquote className="text-sm italic text-white/50 border-l-2 border-white/10 pl-4 py-1 leading-relaxed">
                                        "{question.reference_text}"
                                    </blockquote>
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="pt-8 mt-4 border-t border-white/5">
                            <button
                                onClick={nextQuestion}
                                className="w-full group py-4 rounded-xl bg-white text-black font-bold text-base hover:bg-zinc-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2"
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
