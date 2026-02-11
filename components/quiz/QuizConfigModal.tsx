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
    } = useQuizGenerator({ folderId, conversationId });

    const handleGenerate = () => {
        generate();
    };

    if (!isOpen) return null;

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
