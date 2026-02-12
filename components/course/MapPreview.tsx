"use client";

import React, { useState } from "react";
import { Copy, Maximize2, Minimize2, Map as MapIcon, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MindmapView } from "@/app/(main)/course/[folderId]/_components/mindmap/MindmapView";
import type { FolderFile } from "@/app/(main)/chat/_lib/types";

interface MapPreviewProps {
    folderId: string;
    files?: FolderFile[];
}

export function MapPreview({ folderId, files }: MapPreviewProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // We use a layoutId to animate between the card and the full screen view
    // The content is rendered in both, but stylistically different

    return (
        <>
            {/* ── Placeholder Card (The "Folded Map") ── */}
            <motion.div
                layoutId="map-container"
                className={cn(
                    "relative w-full h-full bg-slate-100 rounded-3xl overflow-hidden cursor-pointer group border border-slate-200 shadow-sm hover:shadow-md transition-shadow",
                    isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
                onClick={() => setIsExpanded(true)}
            >
                {/* Map View (Locked) */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-60 grayscale-[0.3] group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-500">
                    <MindmapView
                        target={{ type: "folder", id: folderId }}
                        isInteractive={false}
                        files={files}
                    />
                </div>

                {/* Overlay / CTA */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[1px] group-hover:backdrop-blur-[0px] transition-all">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-xl font-medium shadow-lg border border-slate-200 flex items-center gap-2 group/btn"
                    >
                        <MapIcon className="w-4 h-4 text-slate-500 group-hover/btn:text-blue-500 transition-colors" />
                        Explore Full Map
                    </motion.button>
                    <p className="mt-3 text-xs font-semibold tracking-wider text-slate-500 uppercase opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Click to Expand
                    </p>
                </div>
            </motion.div>


            {/* ── Expanded Full Screen View ── */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        layoutId="map-container"
                        className="fixed inset-0 z-50 bg-white"
                        initial={{ borderRadius: 24 }}
                        animate={{ borderRadius: 0 }}
                        exit={{ borderRadius: 24, opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    >
                        {/* Header / Controls */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.1 }}
                            className="absolute top-4 left-4 right-4 z-50 flex justify-end items-start pointer-events-none"
                        >

                            {/* Actions (Minimize) */}
                            <div className="pointer-events-auto flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExpanded(false);
                                    }}
                                    className="bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 p-3 rounded-full shadow-lg border border-slate-200 transition-all active:scale-95"
                                >
                                    <Minimize2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Full Interactive Map */}
                        <div className="w-full h-full">
                            <MindmapView
                                target={{ type: "folder", id: folderId }}
                                isInteractive={true}
                                files={files}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
