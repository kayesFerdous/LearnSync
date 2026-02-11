import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useFolderFiles } from "./use-folder-files";
import {
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizDifficulty,
    FileItem
} from "../types/quiz";

interface UseQuizGeneratorProps {
    folderId?: string;
    conversationId?: string;
}

export const useQuizGenerator = ({ folderId, conversationId }: UseQuizGeneratorProps) => {
    const [amount, setAmount] = useState<number>(5);
    const [difficulty, setDifficulty] = useState<QuizDifficulty>("Medium");
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

    // Fetch files
    const { data: files = [], isLoading: isLoadingFiles, isError: isFilesError } = useFolderFiles(folderId);

    // If conversationId is present but not folderId, we might need a different strategy or just use the same hook if it supports it.
    // For now, let's assume folderId is the primary context for files as per requirements.
    // If conversationId is needed for context, we can add it to the hook later.

    // Initialize selection when files are loaded
    useMemo(() => {
        if (files.length > 0 && selectedFileIds.size === 0) {
            // We might want to use useEffect for this side effect, but sticking to memo for derived state initialization is sometimes cleaner 
            // if we want it to be instant. However, React might warn.
            // Let's use a derived state approach or simple effect.
            // For now, let's just default all logic in the selection handler or initialization.
            // Actually, the requirement says "All files are selected by default".
            // Let's do this in a useEffect or use a state initializer that depends on data - which uses useEffect.
        }
    }, [files.length]);

    // Better approach: Synchronize selection state with fetched files
    // We'll use a `useEffect` to set initial selection
    const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

    if (!hasInitializedSelection && files.length > 0) {
        setSelectedFileIds(new Set(files.map(f => f.id)));
        setHasInitializedSelection(true);
    }

    const toggleFile = useCallback((fileId: string) => {
        setSelectedFileIds((prev) => {
            const next = new Set(prev);
            if (next.has(fileId)) {
                next.delete(fileId);
            } else {
                next.add(fileId);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedFileIds.size === files.length) {
            setSelectedFileIds(new Set());
        } else {
            setSelectedFileIds(new Set(files.map((f) => f.id)));
        }
    }, [files, selectedFileIds]);

    const generateQuizMutation = useMutation({
        mutationFn: async () => {
            const payload: QuizGenerationRequest = {
                amount,
                hardness: difficulty,
                file_ids: Array.from(selectedFileIds),
                folder_id: folderId,
                conversation_id: conversationId,
            };

            const response = await axios.post<QuizGenerationResponse>("http://localhost:8000/mcq/generate", payload);
            console.log(response.data);
            return response.data;
        },
    });

    const isAllSelected = files.length > 0 && selectedFileIds.size === files.length;
    const isIndeterminate = selectedFileIds.size > 0 && selectedFileIds.size < files.length;

    return {
        files,
        isLoadingFiles,
        isFilesError,

        config: {
            amount,
            setAmount,
            difficulty,
            setDifficulty,
        },

        selection: {
            selectedFileIds,
            toggleFile,
            toggleAll,
            isAllSelected,
            isIndeterminate,
        },

        generate: generateQuizMutation.mutate,
        isGenerating: generateQuizMutation.isPending,
        generationError: generateQuizMutation.error,
        quizResult: generateQuizMutation.data,
    };
};
