import { useState, useEffect, useCallback } from "react";
import { useQuizStore } from "../stores/use-quiz-store";
import { QuizDifficulty, QuizGenerationRequest } from "../types/quiz";
import { useFolderFiles } from "./use-folder-files";

interface UseQuizGeneratorProps {
    folderId?: string;
    conversationId?: string;
}

export const useQuizGenerator = ({ folderId, conversationId }: UseQuizGeneratorProps) => {
    // Local state for configuration
    const [amount, setAmount] = useState(5);
    const [difficulty, setDifficulty] = useState<QuizDifficulty>("Medium");
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

    // Use shared file fetching hook
    const {
        data: files = [],
        isLoading: isLoadingFiles,
        isError: isErrorFiles
    } = useFolderFiles(folderId);

    // Global Store
    const { generateQuiz, status, quizData } = useQuizStore();

    // Initialize selection when files are loaded
    useEffect(() => {
        if (files && files.length > 0 && selectedFileIds.size === 0) {
            setSelectedFileIds(new Set(files.map(f => f.id)));
        }
    }, [files]); // Depend on files to update selection when loaded

    // File Selection Logic
    const toggleFile = useCallback((fileId: string) => {
        setSelectedFileIds((prev) => {
            const newSelected = new Set(prev);
            if (newSelected.has(fileId)) {
                newSelected.delete(fileId);
            } else {
                newSelected.add(fileId);
            }
            return newSelected;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedFileIds.size === files.length) {
            setSelectedFileIds(new Set());
        } else {
            setSelectedFileIds(new Set(files.map(f => f.id)));
        }
    }, [files, selectedFileIds]);

    const isAllSelected = files.length > 0 && selectedFileIds.size === files.length;

    // Generate Action
    const generate = async () => {
        const payload: QuizGenerationRequest = {
            amount,
            hardness: difficulty,
            file_ids: Array.from(selectedFileIds),
            folder_id: folderId,
            conversation_id: conversationId,
        };

        await generateQuiz(payload);
    };

    return {
        files: files || [],
        isLoadingFiles,
        isErrorFiles,
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
        },
        generate,
        isGenerating: status === 'generating',
        quizResult: quizData,
    };
};
