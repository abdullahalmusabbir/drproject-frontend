export interface PredictionResult {
    id: string;
    predicted_class: number;
    predicted_label: string;
    probability_referable: number;
    entropy: number;
    is_high_uncertainty: boolean;
    created_at: string;
}

export interface ApiErrorResponse {
    error?: string;
    detail?: string;
    [key: string]: unknown;
}