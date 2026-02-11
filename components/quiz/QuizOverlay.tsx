import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { useQuizStore } from '../../stores/use-quiz-store';
import QuestionCard from './QuestionCard';
import QuizSummary from './QuizSummary';

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

    const currentQuestion = quizData?.questions[currentQuestionIndex];
    const totalQuestions = quizData?.questions.length || 0;
    const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Zen Background: Deep slate/black with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-all duration-700"
                        onClick={onClose}
                    />

                    {/* Main Container */}
                    <div className="relative w-full h-full flex flex-col pointer-events-none">

                        {/* Minimal Header */}
                        {status === 'active' && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="w-full px-8 py-6 flex items-center justify-between pointer-events-auto z-10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                        <Sparkles size={14} className="text-white/60" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white/40 text-xs font-medium tracking-widest uppercase">
                                            Focus Mode
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Indicator */}
                                <div className="hidden md:flex items-center gap-3">
                                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-white/20"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5, ease: "circOut" }}
                                        />
                                    </div>
                                    <span className="text-white/40 text-xs font-mono">
                                        {currentQuestionIndex + 1} / {totalQuestions}
                                    </span>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </motion.div>
                        )}

                        {/* Card Stage */}
                        <div className="flex-1 flex items-center justify-center p-4 md:p-8 pointer-events-auto">
                            <AnimatePresence mode="wait">
                                {status === 'active' && currentQuestion && (
                                    <motion.div
                                        key={currentQuestion.id} // CRITICAL: Forces re-mount to reset flip/state
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 350,
                                            damping: 25,
                                            mass: 0.5
                                        }}
                                        className="w-full h-full flex items-center justify-center"
                                    >
                                        <QuestionCard
                                            question={currentQuestion}
                                            questionIndex={currentQuestionIndex + 1}
                                            totalQuestions={totalQuestions}
                                        />
                                    </motion.div>
                                )}

                                {status === 'summary' && (
                                    <motion.div
                                        key="summary"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
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
