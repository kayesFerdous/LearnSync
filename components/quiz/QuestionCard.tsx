import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, FileText, Sparkles } from 'lucide-react';
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
        if (!isFlipped) return 'border-white/10';
        if (isCorrect(selectedOptionId)) return 'border-emerald-500/50 shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)]';
        return 'border-rose-500/50 shadow-[0_0_50px_-10px_rgba(244,63,94,0.3)]';
    };

    return (
        <div className="relative w-full max-w-2xl aspect-[4/3] perspective-1000">
            <motion.div
                className="w-full h-full relative"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* ─── FRONT FACE ─── */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden flex flex-col",
                        "bg-black/40 backdrop-blur-2xl border rounded-3xl overflow-hidden",
                        "transition-colors duration-500",
                        getBorderColor()
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Decorative Gradient Blob */}
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none" />

                    <div className="flex-1 flex flex-col p-8 md:p-12 z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-white/20 text-4xl font-serif font-medium leading-none">
                                {String(questionIndex).padStart(2, '0')}
                            </span>
                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/50 tracking-wider uppercase">
                                {question.question_type}
                            </div>
                        </div>

                        {/* Question Text - PURE WHITE */}
                        <h2 className="text-2xl md:text-3xl font-medium text-white leading-normal font-serif mb-8 drop-shadow-lg">
                            {question.question_text}
                        </h2>

                        {/* Options */}
                        <div className="flex-1 flex flex-col gap-3 justify-end">
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
                                                ? "bg-white text-black border-white scale-[1.01] shadow-lg"
                                                : "bg-black/20 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border transition-colors",
                                                isSelected
                                                    ? "border-black/20 bg-black/5"
                                                    : "border-white/20 text-white/40 group-hover:border-white/40 group-hover:text-white/60"
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
                        "bg-black/60 backdrop-blur-2xl border rounded-3xl overflow-hidden shadow-2xl",
                        isCorrect(selectedOptionId) ? "border-emerald-500/30" : "border-rose-500/30"
                    )}
                    style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    <div className="h-full flex flex-col p-8 md:p-12 relative z-10">
                        {/* Status Header */}
                        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-white/10">
                            <div className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center border-2",
                                isCorrect(selectedOptionId)
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "bg-rose-500/20 border-rose-500 text-rose-400"
                            )}>
                                {isCorrect(selectedOptionId) ? <Check size={28} /> : <X size={28} />}
                            </div>
                            <div>
                                <h3 className={cn(
                                    "text-2xl font-bold tracking-tight",
                                    isCorrect(selectedOptionId) ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {isCorrect(selectedOptionId) ? "Correct Answer" : "Incorrect"}
                                </h3>
                                <p className="text-white/40 text-sm mt-1 font-medium">
                                    {isCorrect(selectedOptionId) ? "Well done!" : "Review the explanation below."}
                                </p>
                            </div>
                        </div>

                        {/* Scrollable Context */}
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-none hover:scrollbar-thin scrollbar-thumb-white/20">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
                                        Explanation
                                    </h4>
                                    <p className="text-lg text-white/90 leading-relaxed font-light">
                                        {question.explanation || "No explanation provided for this question."}
                                    </p>
                                </div>

                                {question.reference_text && (
                                    <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">
                                            <FileText size={14} />
                                            Source Context
                                        </h4>
                                        <p className="text-sm italic text-white/50 leading-relaxed">
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
                                className="w-full group py-4 rounded-xl bg-white text-black font-bold text-base hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
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
