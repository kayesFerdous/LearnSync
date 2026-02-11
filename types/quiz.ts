export type QuizDifficulty = "Easy" | "Medium" | "Hard";

export interface QuizGenerationRequest {
    amount: number;
    hardness: QuizDifficulty;
    file_ids: string[];
    folder_id?: string;
    conversation_id?: string;
}

export interface QuizOption {
    id: number | string;
    text: string;
}

export interface QuizQuestion {
    id: string;
    question_text: string;
    question_type: "MCQ"; // extendable
    options: QuizOption[];
    answers: (number | string)[]; // Array of correct option IDs
    explanation?: string;
    reference_text?: string;
    reference_id?: string;
}

export interface QuizData {
    id: string;
    title: string;
    source_type: "folder" | "conversation";
    source_id: string;
    created_at: string;
    questions: QuizQuestion[];
}

export interface QuizGenerationResponse extends QuizData { }

export interface FileItem {
    id: string;
    filename: string;
    file_type: string;
}
