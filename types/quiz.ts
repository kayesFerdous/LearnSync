export type QuizDifficulty = "Easy" | "Medium" | "Hard";

export interface QuizGenerationRequest {
    amount: number;
    hardness: QuizDifficulty;
    file_ids: string[];
    folder_id?: string;
    conversation_id?: string;
}

export interface QuizQuestion {
    question: string;
    options: { id: string; text: string }[];
    answer: string; // The correct option text or index, depending on backend. Assuming text for now.
    explanation?: string;
}

export interface QuizGenerationResponse {
    questions: QuizQuestion[];
}

export interface FileItem {
    id: string;
    name: string;
    type: string;
    // Add other properties as needed based on actual API response
}
