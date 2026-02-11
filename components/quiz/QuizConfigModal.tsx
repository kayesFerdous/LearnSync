import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Check, X } from "lucide-react";
import { useQuizGenerator } from "../../hooks/use-quiz-generator";
import { cn } from "../../lib/utils";
import { QuizDifficulty } from "../../types/quiz";

interface QuizConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId?: string;
    conversationId?: string;
}

const difficultyColors: Record<QuizDifficulty, string> = {
    Easy: "bg-emerald-500",
    Medium: "bg-blue-500",
    Hard: "bg-rose-500",
};

const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
    isOpen,
    onClose,
    folderId,
    conversationId,
}) => {
    const {
        files,
        isLoadingFiles,
        config: { amount, setAmount, difficulty, setDifficulty },
        selection: { selectedFileIds, toggleFile, toggleAll, isAllSelected },
        generate,
        isGenerating,
        quizResult,
    } = useQuizGenerator({ folderId, conversationId });

    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [answers, setAnswers] = React.useState<Record<number, string>>({});
    const [showResults, setShowResults] = React.useState(false);
    const [direction, setDirection] = React.useState(0);

    const handleGenerate = () => {
        generate();
    };

    // Reset state when quizResult changes or modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setCurrentQuestionIndex(0);
            setAnswers({});
            setShowResults(false);
            setDirection(0);
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (quizResult) {
            setCurrentQuestionIndex(0);
            setAnswers({});
            setShowResults(false);
        }
    }, [quizResult]);

    const handleAnswer = (option: string) => {
        setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: option }));
    };

    const nextQuestion = () => {
        if (quizResult && currentQuestionIndex < quizResult.questions.length - 1) {
            setDirection(1);
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            setShowResults(true);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setDirection(-1);
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    if (!isOpen) return null;

    const currentQuestion = quizResult?.questions[currentQuestionIndex];
    const isLastQuestion = quizResult && currentQuestionIndex === quizResult.questions.length - 1;

    // Quiz Taking View
    if (quizResult && !showResults) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="pointer-events-auto w-full max-w-2xl min-h-[500px] overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-black/90 dark:border-white/10 flex flex-col">
                                {/* Header */}
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-black/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <Sparkles size={16} />
                                        </div>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                                            Question {currentQuestionIndex + 1} of {quizResult.questions.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full relative overflow-hidden">
                                    <motion.div
                                        className="absolute top-0 left-0 h-full bg-indigo-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentQuestionIndex + 1) / quizResult.questions.length) * 100}%` }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    />
                                </div>

                                {/* Question Content */}
                                <div className="flex-1 p-8 relative overflow-hidden">
                                    <AnimatePresence mode="wait" custom={direction}>
                                        <motion.div
                                            key={currentQuestionIndex}
                                            custom={direction}
                                            variants={{
                                                enter: (direction: number) => ({
                                                    x: direction > 0 ? 300 : -300,
                                                    opacity: 0,
                                                    scale: 0.95,
                                                }),
                                                center: {
                                                    x: 0,
                                                    opacity: 1,
                                                    scale: 1,
                                                },
                                                exit: (direction: number) => ({
                                                    x: direction < 0 ? 300 : -300,
                                                    opacity: 0,
                                                    scale: 0.95,
                                                }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            className="w-full h-full flex flex-col"
                                        >
                                            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-8 leading-relaxed">
                                                {currentQuestion?.question}
                                            </h3>

                                            <div className="flex flex-col gap-3">
                                                {(currentQuestion?.options || []).map((option) => {
                                                    const isSelected = answers[currentQuestionIndex] === option.id;
                                                    return (
                                                        <motion.button
                                                            key={option.id}
                                                            onClick={() => handleAnswer(option.id)}
                                                            whileHover={{ scale: 1.01, x: 4 }}
                                                            whileTap={{ scale: 0.99 }}
                                                            className={cn(
                                                                "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group",
                                                                isSelected
                                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md ring-1 ring-indigo-500/20"
                                                                    : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors",
                                                                    isSelected
                                                                        ? "bg-indigo-500 text-white"
                                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                                                )}>
                                                                    {option.id}
                                                                </div>
                                                                <span className={cn(
                                                                    "text-sm font-medium transition-colors",
                                                                    isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-300"
                                                                )}>
                                                                    {option.text}
                                                                </span>
                                                            </div>
                                                            {isSelected && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="text-indigo-500"
                                                                >
                                                                    <Check size={18} strokeWidth={3} />
                                                                </motion.div>
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Footer Navigation */}
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                    <button
                                        onClick={prevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={nextQuestion}
                                        disabled={!answers[currentQuestionIndex]}
                                        className={cn(
                                            "px-8 py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all",
                                            !answers[currentQuestionIndex]
                                                ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none"
                                                : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
                                        )}
                                    >
                                        {isLastQuestion ? "Finish Quiz" : "Next Question"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );
    }

    // Result View (Placeholder for now, can be expanded)
    if (showResults && quizResult) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl border border-white/20"
                        >
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                                <Sparkles size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Quiz Completed!</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">
                                You've answered all {quizResult.questions.length} questions.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        )
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-4xl h-[600px] overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-black/80 dark:border-white/10 flex">

                            {/* Left Column: Configuration */}
                            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400 mb-8">
                                        Quiz Command
                                    </h2>

                                    {/* Difficulty Selector */}
                                    <div className="mb-8">
                                        <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                                            Difficulty
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            {(["Easy", "Medium", "Hard"] as QuizDifficulty[]).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setDifficulty(level)}
                                                    className={cn(
                                                        "relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border",
                                                        difficulty === level
                                                            ? "border-transparent bg-white shadow-lg dark:bg-slate-800"
                                                            : "border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                                                    )}
                                                >
                                                    <span className={cn("font-medium relative z-10", difficulty === level ? "text-slate-900 dark:text-white" : "")}>
                                                        {level}
                                                    </span>
                                                    {difficulty === level && (
                                                        <motion.div
                                                            layoutId="active-difficulty"
                                                            className={cn("absolute inset-0 rounded-xl opacity-10", difficultyColors[level])}
                                                        />
                                                    )}
                                                    {difficulty === level && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className={cn("w-2 h-2 rounded-full", difficultyColors[level])}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question Count Slider */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Questions
                                            </label>
                                            <span className="text-2xl font-bold text-slate-800 dark:text-white">
                                                {amount}
                                            </span>
                                        </div>

                                        <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                                            <div
                                                className="absolute h-full bg-slate-800 dark:bg-white rounded-full"
                                                style={{ width: `${(amount / 20) * 100}%` }}
                                            />
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                step="1"
                                                value={amount}
                                                onChange={(e) => setAmount(Number(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-800 dark:border-white rounded-full shadow-md pointer-events-none transition-all"
                                                style={{ left: `calc(${(amount / 20) * 100}% - 8px)` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Info / Credits */}
                                <div className="text-xs text-slate-400 dark:text-slate-600">
                                    Press <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Esc</span> to close
                                </div>
                            </div>

                            {/* Right Column: Source Material */}
                            <div className="w-2/3 p-6 flex flex-col relative bg-white/40 dark:bg-black/40">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Source Material</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Select content to include in the quiz</p>
                                    </div>

                                    <button
                                        onClick={toggleAll}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                    >
                                        {isAllSelected ? "Deselect All" : "Select All"}
                                    </button>
                                </div>

                                {/* File List */}
                                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                    {isLoadingFiles ? (
                                        <div className="flex items-center justify-center h-full text-slate-400 animate-pulse">
                                            Loading sources...
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {files.map((file, index) => {
                                                const isSelected = selectedFileIds.has(file.id);
                                                return (
                                                    <motion.div
                                                        key={file.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => toggleFile(file.id)}
                                                        className={cn(
                                                            "group relative p-3 rounded-xl border cursor-pointer transition-all duration-200",
                                                            isSelected
                                                                ? "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 shadow-sm"
                                                                : "bg-white/50 border-slate-100 hover:border-slate-300 dark:bg-slate-800/50 dark:border-slate-800 dark:hover:border-slate-700"
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn(
                                                                "p-2 rounded-lg transition-colors",
                                                                isSelected ? "bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                            )}>
                                                                <FileText size={18} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn(
                                                                    "text-sm font-medium truncate transition-colors",
                                                                    isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-300"
                                                                )}>
                                                                    {file.filename}
                                                                </p>
                                                                <p className="text-xs text-slate-400 truncate">{file.file_type}</p>
                                                            </div>
                                                            <div className={cn(
                                                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                                isSelected
                                                                    ? "bg-indigo-500 border-indigo-500 text-white scale-100"
                                                                    : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100 scale-90"
                                                            )}>
                                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Action */}
                                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={selectedFileIds.size === 0 || isGenerating}
                                        onClick={handleGenerate}
                                        className={cn(
                                            "relative px-8 py-3 rounded-full font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all",
                                            selectedFileIds.size === 0
                                                ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none"
                                                : "bg-indigo-600 hover:bg-indigo-500"
                                        )}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Sparkles className="animate-spin" size={18} />
                                                <span>Synthesizing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                <span>Generate Quiz</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuizConfigModal;
