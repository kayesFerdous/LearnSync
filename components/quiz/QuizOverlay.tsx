import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useQuizStore } from '../../stores/use-quiz-store';
import QuestionCard from './QuestionCard';
import QuizSummary from './QuizSummary';
import { cn } from '../../lib/utils';

interface QuizOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuizOverlay: React.FC<QuizOverlayProps> = ({ isOpen, onClose }) => {
    const { status, quizData, currentQuestionIndex, exitQuiz } = useQuizStore();

    // Reset/Exit when closing
    useEffect(() => {
        if (!isOpen) {
            exitQuiz();
        }
    }, [isOpen, exitQuiz]);

    if (!isOpen || status === 'idle') return null;

    const currentQuestion = quizData?.questions?.[currentQuestionIndex];
    const totalQuestions = quizData?.questions?.length || 0;
    const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Theme-Adaptive Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/95 backdrop-blur-xl transition-all duration-300"
                        onClick={onClose}
                    />

                    {/* Main Container */}
                    <div className="relative w-full h-full flex flex-col pointer-events-none max-w-5xl mx-auto">

                        {/* Header */}
                        {status === 'active' && (
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="w-full px-6 py-6 flex items-center justify-between pointer-events-auto z-10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border shadow-sm">
                                        <Sparkles size={18} className="text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground tracking-tight">Focus Quiz</span>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            Question {currentQuestionIndex + 1} of {totalQuestions}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1/3">
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5, ease: "circOut" }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* Content Stage */}
                        <div className="flex-1 flex items-center justify-center p-4 md:p-8 pointer-events-auto overflow-hidden">
                            <AnimatePresence mode="wait">
                                {status === 'active' && currentQuestion && (
                                    <motion.div
                                        key={currentQuestion.id} // Ensure fresh mount for each question
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="w-full max-w-3xl"
                                    >
                                        <QuestionCard
                                            question={currentQuestion}
                                            questionIndex={currentQuestionIndex + 1}
                                            totalQuestions={totalQuestions}
                                        />
                                    </motion.div>
                                )}

                                {status === 'generating' && (
                                    <motion.div
                                        key="generating"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center gap-6"
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                            <div className="relative bg-card w-20 h-20 rounded-2xl border border-border shadow-lg flex items-center justify-center">
                                                <Loader2 size={32} className="text-primary animate-spin" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-medium text-foreground">
                                            Crafting your quiz...
                                        </p>
                                    </motion.div>
                                )}

                                {status === 'summary' && (
                                    <motion.div
                                        key="summary"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full flex justify-center"
                                    >
                                        <QuizSummary onClose={onClose} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default QuizOverlay;
