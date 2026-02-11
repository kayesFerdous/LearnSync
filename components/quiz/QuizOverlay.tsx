import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
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
    // We can use this for the progress ring or bar
    const progress = quizData ? ((currentQuestionIndex + 1) / quizData.questions.length) * 100 : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Atmospheric Background (Radial Gradient) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black transition-all duration-700"
                        onClick={onClose}
                    />

                    {/* Main Container */}
                    <div className="relative w-full h-full flex flex-col pointer-events-none">
                        {/* Minimal Top Bar */}
                        {status === 'active' && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="w-full p-8 flex items-center justify-between pointer-events-auto z-10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white/80 border border-white/10 shadow-lg">
                                        <Sparkles size={18} />
                                    </div>
                                    <h1 className="text-white/40 font-serif italic text-lg tracking-wide">
                                        Zen Focus
                                    </h1>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 flex items-center justify-center p-4 md:p-8 pointer-events-auto">
                            <AnimatePresence mode="wait">
                                {status === 'active' && currentQuestion && (
                                    <motion.div
                                        // CRITICAL: Unique key per question to force re-mount and reset flip state
                                        key={currentQuestion.id}
                                        initial={{ x: 50, opacity: 0, scale: 0.95 }}
                                        animate={{ x: 0, opacity: 1, scale: 1 }}
                                        exit={{ x: -50, opacity: 0, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="w-full max-w-2xl h-full max-h-[800px] flex items-center justify-center"
                                    >
                                        <QuestionCard
                                            question={currentQuestion}
                                            questionIndex={currentQuestionIndex + 1}
                                            totalQuestions={quizData?.questions.length || 0}
                                        />
                                    </motion.div>
                                )}

                                {status === 'summary' && (
                                    <motion.div
                                        key="summary"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
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
