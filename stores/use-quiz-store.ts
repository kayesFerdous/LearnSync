import { create } from 'zustand';
import { QuizData, QuizGenerationRequest } from '../types/quiz';

interface QuizState {
    status: 'idle' | 'generating' | 'active' | 'summary';
    quizData: QuizData | null;
    currentQuestionIndex: number;
    answers: Record<string, number | string>; // map questionId to answerId
    score: number;

    // Actions
    loadQuiz: (quizId: string) => Promise<void>;
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

    loadQuiz: async (quizId: string) => {
        set({ status: 'generating' }); // Re-use generating state for loading
        try {
            // Dynamically import fetchQuiz to avoid circular deps if any, or just use fetch directly
            // Better to use fetch directly or import from api.ts
            // Since this is a store, we can use fetch directly for simplicity or import.
            // Let's use fetch directly to match the generateQuiz pattern and avoid imports if possible, 
            // but importing is cleaner.

            // Assume fetchQuiz is available or use fetch
            const response = await fetch(`http://localhost:8000/mcq/${quizId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error("Failed to load quiz");

            const data: QuizData = await response.json();

            // Validate and Patch (same as generate)
            if (!data || !data.questions || data.questions.length === 0) {
                throw new Error("Received empty quiz data");
            }

            data.questions.forEach((q, i) => {
                if (!q.id) {
                    q.id = `q-loaded-${Date.now()}-${i}`;
                }
                if (!q.question_text && (q as any).question) {
                    q.question_text = (q as any).question;
                }
            });

            set({
                quizData: data,
                status: 'active',
                currentQuestionIndex: 0,
                answers: {},
                score: 0
            });

        } catch (error) {
            console.error("Failed to load quiz:", error);
            set({ status: 'idle' });
        }
    },

    fetchQuizzes: async (folderId: string) => {
        // This action seems to be for fetching the list, which is handled in the component for now.
        // But if needed here, we can implement it.
        // For now, keeping it as a placeholder or implementing if the component uses it.
        // The component uses the api.ts function directly, so this might be redundant or for storing list state.
    },

    generateQuiz: async (request: QuizGenerationRequest) => {
        set({ status: 'generating' });
        try {
            console.log("Generating quiz with request:", request);

            const response = await fetch("http://localhost:8000/mcq/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Important for cookies/session
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate quiz: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data: QuizData = await response.json();
            console.log("Quiz Generation Response Data:", data);

            // Validate data structure immediately
            if (!data || !data.questions || data.questions.length === 0) {
                console.error("Quiz data is empty or missing questions:", data);
                throw new Error("Received empty quiz data");
            }

            // Deep check for question text
            data.questions.forEach((q, i) => {
                if (!q.id) {
                    console.warn(`Question ${i} is missing 'id'. Patching with index-based ID.`);
                    q.id = `q-${Date.now()}-${i}`;
                }

                if (!q.question_text) {
                    // console.warn(`Question ${i} (${q.id}) is missing 'question_text'. Full object:`, q);
                    // Fallback if the backend sends 'question' instead of 'question_text'
                    if ((q as any).question) {
                        q.question_text = (q as any).question;
                    }
                }
            });

            set({
                quizData: data,
                status: 'active',
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
            currentQuestionIndex: 0,
            answers: {},
            score: 0
        });
    },

    submitAnswer: (questionId: string, answerId: number | string) => {
        const { quizData, answers } = get();
        if (!quizData) return;

        // Optional: Prevent changing answer if strict mode
        // if (answers[questionId] !== undefined) return;

        set((state) => ({
            answers: { ...state.answers, [questionId]: answerId }
        }));
    },

    nextQuestion: () => {
        const { currentQuestionIndex, quizData, answers } = get();
        if (!quizData) return;

        const total = quizData.questions.length;

        if (currentQuestionIndex < total - 1) {
            // Move to next
            set({ currentQuestionIndex: currentQuestionIndex + 1 });
        } else {
            // Finish
            let correctCount = 0;
            quizData.questions.forEach(q => {
                const userAnswer = answers[q.id];
                // Ensure comparison is safe (string vs number)
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
            set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
    },

    exitQuiz: () => {
        set({ status: 'idle', quizData: null, currentQuestionIndex: 0, answers: {} });
    },

    resetQuiz: () => {
        set({
            status: 'active',
            currentQuestionIndex: 0,
            answers: {},
            score: 0
        });
    }
}));
