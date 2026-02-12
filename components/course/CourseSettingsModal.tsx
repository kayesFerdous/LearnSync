"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Sparkles, FolderPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateFolder } from "@/app/(main)/chat/_lib/api";

interface CourseSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string;
    initialName: string;
    initialIcon?: string;
    initialColor?: string;
    onUpdate: (data: { name: string; icon?: string; color?: string }) => void;
}

const COLORS = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Slate", value: "#64748b" },
];

const PRESET_EMOJIS = ["📚", "🎓", "✒️", "🔬", "💻", "🎨", "⚡", "📐", "🧬", "🏺", "🎵", "🚀", "💡", "🧠", "💼", "🌍", "🎬"];

export function CourseSettingsModal({
    isOpen,
    onClose,
    folderId,
    initialName,
    initialIcon,
    initialColor,
    onUpdate,
}: CourseSettingsModalProps) {
    const [name, setName] = useState(initialName);
    const [icon, setIcon] = useState(initialIcon || "📚");
    const [color, setColor] = useState(initialColor || "#3b82f6");
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setIcon(initialIcon || "📚");
            setColor(initialColor || "#3b82f6");
        }
    }, [isOpen, initialName, initialIcon, initialColor]);

    const handleSave = async () => {
        if (!name.trim()) return;

        try {
            setIsSaving(true);
            await updateFolder(folderId, { name, icon, color });
            onUpdate({ name, icon, color });
            onClose();
        } catch (error) {
            console.error("Failed to update folder:", error);
            // You might want to show a toast here
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-3xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <FolderPen size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Course Settings</h2>
                                    <p className="text-xs text-slate-500 font-medium">Update folder details</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Course Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Machine Learning 101"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 transition-all text-sm font-medium"
                                />
                            </div>

                            {/* Icon Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Icon (Emoji)</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-2xl">
                                        {icon}
                                    </div>
                                    <input
                                        type="text"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        placeholder="📚"
                                        maxLength={2}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 transition-all text-sm font-medium"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {PRESET_EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => setIcon(emoji)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg border flex items-center justify-center text-lg hover:bg-slate-50 hover:scale-110 transition-all",
                                                icon === emoji ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20" : "border-slate-200"
                                            )}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Theme Color</label>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => setColor(c.value)}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                                                color === c.value ? "border-slate-900 scale-110 shadow-sm" : "border-transparent hover:scale-110"
                                            )}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        >
                                            {color === c.value && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !name.trim()}
                                className="px-6 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
