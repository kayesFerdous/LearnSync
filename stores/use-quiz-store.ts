import { create } from 'zustand';
import { QuizData, QuizGenerationRequest } from '../types/quiz';

type QuizStatus = 'idle' | 'generating' | 'active' | 'summary';
type QuestionViewState = 'question' | 'feedback';

interface QuizState {
    status: QuizStatus;
    viewState: QuestionViewState; // Explicit state for the card view
    quizData: QuizData | null;
    currentQuestionIndex: number;
    answers: Record<string, number | string>; // map questionId to answerId
    score: number;

    // Actions
    loadQuiz: (quizId: string) => Promise<void>;
    generateQuiz: (request: QuizGenerationRequest) => Promise<void>;
    startQuiz: (quizData: QuizData) => void;
    submitAnswer: (questionId: string, answerId: number | string) => void;
    nextQuestion: () => void;
    prevQuestion: () => void; // Optional/Debug
    exitQuiz: () => void;
    resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    status: 'idle',
    viewState: 'question',
    quizData: null,
    currentQuestionIndex: 0,
    answers: {},
    score: 0,

    loadQuiz: async (quizId: string) => {
        set({ status: 'generating' });
        try {
            const response = await fetch(`http://localhost:8000/mcq/${quizId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error("Failed to load quiz");

            const data: QuizData = await response.json();

            if (!data || !data.questions || data.questions.length === 0) {
                throw new Error("Received empty quiz data");
            }

            // Ensure IDs and structure
            data.questions.forEach((q, i) => {
                if (!q.id) q.id = `q-loaded-${Date.now()}-${i}`;
                if (!q.question_text && (q as any).question) {
                    q.question_text = (q as any).question;
                }
            });

            set({
                quizData: data,
                status: 'active',
                viewState: 'question',
                currentQuestionIndex: 0,
                answers: {},
                score: 0
            });

        } catch (error) {
            console.error("Failed to load quiz:", error);
            set({ status: 'idle' });
        }
    },

    generateQuiz: async (request: QuizGenerationRequest) => {
        set({ status: 'generating' });
        try {
            const response = await fetch("http://localhost:8000/mcq/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate quiz: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data: QuizData = await response.json();

            if (!data || !data.questions || data.questions.length === 0) {
                throw new Error("Received empty quiz data");
            }

            // Ensure IDs and structure
            data.questions.forEach((q, i) => {
                if (!q.id) q.id = `q-${Date.now()}-${i}`;
                if (!q.question_text && (q as any).question) {
                    q.question_text = (q as any).question;
                }
            });

            set({
                quizData: data,
                status: 'active',
                viewState: 'question',
                currentQuestionIndex: 0,
                answers: {},
                score: 0
            });
        } catch (error) {
            console.error("Quiz generation error:", error);
            set({ status: 'idle' });
        }
    },

    startQuiz: (quizData: QuizData) => {
        set({
            quizData,
            status: 'active',
            viewState: 'question',
            currentQuestionIndex: 0,
            answers: {},
            score: 0
        });
    },

    submitAnswer: (questionId: string, answerId: number | string) => {
        const { quizData, answers } = get();
        if (!quizData) return;

        // Save answer
        set((state) => ({
            answers: { ...state.answers, [questionId]: answerId },
            viewState: 'feedback' // Explicitly transition to feedback view
        }));
    },

    nextQuestion: () => {
        const { currentQuestionIndex, quizData, answers } = get();
        if (!quizData) return;

        const total = quizData.questions.length;

        if (currentQuestionIndex < total - 1) {
            set({
                currentQuestionIndex: currentQuestionIndex + 1,
                viewState: 'question' // Reset view to question for the new card
            });
        } else {
            // Calculate Score
            let correctCount = 0;
            quizData.questions.forEach(q => {
                const userAnswer = answers[q.id];
                if (q.answers.some(a => String(a) === String(userAnswer))) {
                    correctCount++;
                }
            });

            set({
                status: 'summary',
                score: Math.round((correctCount / total) * 100)
            });
        }
    },

    prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
            set({
                currentQuestionIndex: currentQuestionIndex - 1,
                viewState: 'question' // Optional: could handle history if needed
            });
        }
    },

    exitQuiz: () => {
        set({ status: 'idle', quizData: null, currentQuestionIndex: 0, answers: {} });
    },

    resetQuiz: () => {
        set({
            status: 'active',
            viewState: 'question',
            currentQuestionIndex: 0,
            answers: {},
            score: 0
        });
    }
}));
