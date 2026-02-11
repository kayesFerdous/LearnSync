import React from 'react';
import { motion } from 'framer-motion';
import { useQuizStore } from '../../stores/use-quiz-store';
import { RotateCw, X, Award, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuizSummaryProps {
    onClose: () => void;
}

const QuizSummary: React.FC<QuizSummaryProps> = ({ onClose }) => {
    const { score, quizData, answers, resetQuiz, exitQuiz } = useQuizStore();

    if (!quizData) return null;

    const percentage = Math.round(score);
    const correctCount = Math.round((score / 100) * quizData.questions.length);

    const handleRetry = () => {
        resetQuiz();
    };

    const handleClose = () => {
        exitQuiz();
        onClose();
    };

    // Calculate circle circumference for progress bar
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row h-[600px]"
        >
            {/* Left Panel: Score */}
            <div className="w-full md:w-1/3 bg-slate-50/50 dark:bg-black/20 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                <div className="relative w-48 h-48 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-slate-200 dark:text-slate-800"
                        />
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="96"
                            cy="96"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            className={cn(
                                "text-indigo-500",
                                score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500"
                            )}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-slate-800 dark:text-white">{percentage}%</span>
                        <span className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Score</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    {score >= 80 ? "Excellent!" : score >= 50 ? "Good Job!" : "Keep Practicing"}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    You got {correctCount} out of {quizData.questions.length} questions correct.
                </p>

                <div className="flex flex-col w-full gap-3">
                    <button
                        onClick={handleRetry}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        <RotateCw size={18} /> Retry Quiz
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium transition-colors"
                    >
                        Back to Course
                    </button>
                </div>
            </div>

            {/* Right Panel: Review */}
            <div className="w-full md:w-2/3 p-8 flex flex-col bg-slate-50/30 dark:bg-black/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Award className="text-indigo-500" /> Review Answers
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 space-y-4">
                    {quizData?.questions.map((question, index) => {
                        const userAnswer = answers[question.id];
                        const isCorrect = question.answers.includes(userAnswer);

                        return (
                            <div key={question.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className={cn(
                                    "absolute top-0 left-0 w-1 h-full",
                                    isCorrect ? "bg-emerald-500" : "bg-rose-500"
                                )} />

                                <div className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800 dark:text-slate-200 mb-3">{question.question_text}</p>

                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            {/* Your Answer */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">Your Answer:</span>
                                                <div className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                                                    isCorrect
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                                        : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
                                                )}>
                                                    {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                    <span>
                                                        {question.options.find(opt => opt.id === userAnswer)?.text || "Skipped"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Correct Answer (if wrong) */}
                                            {!isCorrect && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">Correct:</span>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                        <span>
                                                            {question.options.find(opt => question.answers.includes(opt.id))?.text}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default QuizSummary;
