import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Check, X, Sliders } from "lucide-react";
import { useQuizGenerator } from "../../hooks/use-quiz-generator";
import { cn } from "../../lib/utils";
import { QuizDifficulty } from "../../types/quiz";
import QuizOverlay from "./QuizOverlay";

interface QuizConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId?: string;
    conversationId?: string;
}

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

    // Show the actual quiz overlay when results are ready
    if (quizResult || isGenerating) {
        return <QuizOverlay isOpen={true} onClose={onClose} />;
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/30 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Sparkles size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground leading-tight">New Quiz</h2>
                                    <p className="text-xs text-muted-foreground font-medium">Configure your session</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-8">

                                {/* 1. Configuration Section */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Sliders size={14} /> Settings
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Difficulty */}
                                        <div className="bg-secondary/30 p-4 rounded-2xl border border-border/50">
                                            <label className="text-sm font-semibold text-foreground mb-3 block">Difficulty</label>
                                            <div className="flex bg-background p-1 rounded-xl border border-border">
                                                {(["Easy", "Medium", "Hard"] as QuizDifficulty[]).map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setDifficulty(level)}
                                                        className={cn(
                                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                                            difficulty === level
                                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                                        )}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="bg-secondary/30 p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-semibold text-foreground">Questions</label>
                                                <span className="text-xl font-bold text-primary tabular-nums">{amount}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={amount}
                                                onChange={(e) => setAmount(Number(e.target.value))}
                                                className="w-full h-1.5 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Source Material Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} /> Source Material
                                        </h3>
                                        <button
                                            onClick={toggleAll}
                                            className="text-xs font-medium text-primary hover:underline transition-all"
                                        >
                                            {isAllSelected ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>

                                    <div className="border border-border rounded-2xl overflow-hidden bg-background/50 min-h-[150px] max-h-[250px] overflow-y-auto scrollbar-thin">
                                        {isLoadingFiles ? (
                                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground animate-pulse text-sm">
                                                <Sparkles size={20} className="mb-2 opacity-50" />
                                                Loading your library...
                                            </div>
                                        ) : files.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                                                No compatible documents found.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border">
                                                {files.map((file) => {
                                                    const isSelected = selectedFileIds.has(file.id);
                                                    return (
                                                        <div
                                                            key={file.id}
                                                            onClick={() => toggleFile(file.id)}
                                                            className={cn(
                                                                "group flex items-center gap-3 p-3 cursor-pointer transition-colors active:scale-[0.99]",
                                                                isSelected ? "bg-primary/5" : "hover:bg-secondary/40"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
                                                                isSelected
                                                                    ? "bg-primary border-primary text-primary-foreground"
                                                                    : "border-muted-foreground/30 group-hover:border-primary/50"
                                                            )}>
                                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn(
                                                                    "text-sm font-medium truncate transition-colors",
                                                                    isSelected ? "text-primary" : "text-foreground"
                                                                )}>
                                                                    {file.filename}
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-secondary rounded-md">
                                                                {file.file_type}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-secondary/10 flex justify-end">
                            <button
                                onClick={() => generate()}
                                disabled={selectedFileIds.size === 0 || isGenerating}
                                className={cn(
                                    "px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2",
                                    selectedFileIds.size === 0 || isGenerating
                                        ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                                )}
                            >
                                <Sparkles size={16} className={isGenerating ? "animate-spin" : ""} />
                                {isGenerating ? "Generating..." : "Start Quiz"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default QuizConfigModal;
