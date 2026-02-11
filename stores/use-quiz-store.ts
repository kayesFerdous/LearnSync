import { create } from 'zustand';
import { QuizData, QuizGenerationRequest } from '../types/quiz';
import axios from 'axios';

interface QuizState {
    status: 'idle' | 'generating' | 'active' | 'summary';
    quizData: QuizData | null;
    currentQuestionIndex: number;
    answers: Record<string, number | string>; // map questionId to answerId
    score: number;

    // Actions
    fetchQuizzes: (folderId: string) => Promise<void>;
    generateQuiz: (request: QuizGenerationRequest) => Promise<void>;
    startQuiz: (quizData: QuizData) => void;
    submitAnswer: (questionId: string, answerId: number | string) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    exitQuiz: () => void;
    resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    status: 'idle',
    quizData: null,
    currentQuestionIndex: 0,
    answers: {},
    score: 0,

    fetchQuizzes: async (folderId: string) => {
        try {
            // Mock implementation or real endpoint if available
            // const response = await axios.get(`/mcq/folder/${folderId}`);
            // For now, we just simulate a fetch or leave it empty as per requirement to "Add action"
            console.log("Fetching quizzes for folder:", folderId);
        } catch (error) {
            console.error("Failed to fetch quizzes:", error);
        }
    },

    generateQuiz: async (request: QuizGenerationRequest) => {
        set({ status: 'generating' });
        try {
            const response = await axios.post<QuizData>(
                "http://localhost:8000/mcq/generate",
                request,
                { withCredentials: true }
            );
            set({
                quizData: response.data,
                status: 'active',
                currentQuestionIndex: 0,
                answers: {},
                score: 0
            });
        } catch (error) {
            console.error("Failed to generate quiz:", error);
            set({ status: 'idle' });
            // Ideally handle error state here
        }
    },

    startQuiz: (quizData: QuizData) => {
        set({
            quizData,
            status: 'active',
            currentQuestionIndex: 0,
            answers: {},
            score: 0
        });
    },

    submitAnswer: (questionId: string, answerId: number | string) => {
        const { quizData } = get();
        if (!quizData) return;

        // Prevent changing answer if already answered? 
        // For now, allow changing before moving next, or maybe just once.
        // The requirement says "Immediate Feedback", implying once answered, it reveals.
        // Let's assume we record the answer.

        set((state) => ({
            answers: { ...state.answers, [questionId]: answerId }
        }));

        // Calculate score on the fly or at end? 
        // Let's do it at the end or track it.
        // For immediate feedback, we just store it.
    },

    nextQuestion: () => {
        const { currentQuestionIndex, quizData } = get();
        if (!quizData) return;

        if (currentQuestionIndex < quizData.questions.length - 1) {
            set({ currentQuestionIndex: currentQuestionIndex + 1 });
        } else {
            // Calculate final score
            const { questions } = quizData;
            const { answers } = get();
            let correctCount = 0;

            questions.forEach(q => {
                const userAnswer = answers[q.id];
                if (q.answers.includes(userAnswer)) {
                    correctCount++;
                }
            });

            set({
                status: 'summary',
                score: (correctCount / questions.length) * 100
            });
        }
    },

    prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
            set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
    },

    exitQuiz: () => {
        set({ status: 'idle', quizData: null, currentQuestionIndex: 0, answers: {} });
    },

    resetQuiz: () => {
        set((state) => ({
            status: 'active',
            currentQuestionIndex: 0,
            answers: {},
            score: 0
        }));
    }
}));
