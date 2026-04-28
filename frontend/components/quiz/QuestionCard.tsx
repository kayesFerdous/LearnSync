import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, BookOpen } from 'lucide-react';
import { QuizQuestion } from '../../types/quiz';
import { cn } from '../../lib/utils';
import { useQuizStore } from '../../stores/use-quiz-store';

interface QuestionCardProps {
    question: QuizQuestion;
    questionIndex: number;
    totalQuestions: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, questionIndex }) => {
    const { submitAnswer, viewState, nextQuestion } = useQuizStore();
    const [tempSelected, setTempSelected] = React.useState<string | number | null>(null);

    // If we're in 'question' view, reset local selection
    React.useEffect(() => {
        if (viewState === 'question') {
            setTempSelected(null);
        }
    }, [viewState, question.id]);

    const handleSelect = (id: string | number) => {
        if (viewState === 'feedback') return;
        setTempSelected(id);

        // Slight delay for visual feedback before submitting
        setTimeout(() => {
            submitAnswer(question.id, id);
        }, 300);
    };

    const isCorrect = (optionId: string | number | null) => {
        if (!optionId) return false;
        return question.answers.includes(optionId);
    };

    return (
        <div className="w-full relative bg-card border border-border rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[500px]">

            {/* LEFT SIDE: Question & Options */}
            <div className={cn(
                "w-full md:w-1/2 p-8 flex flex-col transition-all duration-500",
                viewState === 'feedback' ? "md:opacity-40 pointer-events-none blur-[1px]" : "opacity-100"
            )}>
                <span className="text-6xl font-black text-muted/40 absolute top-4 left-6 -z-10 select-none">
                    {String(questionIndex).padStart(2, '0')}
                </span>

                <div className="flex-1 mt-4">
                    <h2 className="text-2xl font-bold text-foreground leading-snug mb-8">
                        {question.question_text}
                    </h2>

                    <div className="space-y-3">
                        {question.options.map((option) => {
                            const isSelected = tempSelected === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option.id)}
                                    disabled={viewState === 'feedback'}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group",
                                        isSelected
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-transparent bg-secondary hover:bg-muted text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                                    )}>
                                        {option.id}
                                    </div>
                                    <span className="font-medium">{option.text}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Feedback Panel / Illustration */}
            <div className="w-full md:w-1/2 bg-secondary/30 relative overflow-hidden border-t md:border-t-0 md:border-l border-border">
                <AnimatePresence mode="wait">
                    {viewState === 'question' ? (
                        <motion.div
                            key="illustration"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-muted-foreground"
                        >
                            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                                <BookOpen size={40} className="text-muted-foreground/50" />
                            </div>
                            <p className="max-w-xs text-sm">
                                Select an answer to see the explanation and source context.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feedback"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="absolute inset-0 flex flex-col p-8"
                        >
                            {/* Result Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                    isCorrect(tempSelected)
                                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                                )}>
                                    {isCorrect(tempSelected) ? <Check size={24} /> : <X size={24} />}
                                </div>
                                <div>
                                    <h3 className={cn(
                                        "text-xl font-bold",
                                        isCorrect(tempSelected)
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400"
                                    )}>
                                        {isCorrect(tempSelected) ? "Correct!" : "Incorrect"}
                                    </h3>
                                </div>
                            </div>

                            {/* Scrollable Explanation */}
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                                <p className="text-foreground leading-relaxed mb-6">
                                    {question.explanation || "No explanation provided."}
                                </p>

                                {question.reference_text && (
                                    <div className="bg-background rounded-xl p-4 border border-border text-sm text-muted-foreground italic">
                                        "{question.reference_text}"
                                    </div>
                                )}
                            </div>

                            {/* Continue Button */}
                            <div className="pt-6 mt-auto">
                                <button
                                    onClick={nextQuestion}
                                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:translate-y-[-2px]"
                                >
                                    Continue <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
};

export default QuestionCard;
