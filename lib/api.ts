import { PredictionResult, ApiErrorResponse } from "@/types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function predictDR(imageFile: File): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/api/predict/`, {
        method: "POST",
        body: formData,
    });

    if (response.status === 429) {
        throw new Error("Too many requests. Please wait 10 seconds and try again.");
    }

    if (!response.ok) {
        const errorData: ApiErrorResponse = await response
            .json()
            .catch(() => ({} as ApiErrorResponse));
        throw new Error(
            errorData.error || errorData.detail || "Prediction request failed."
        );
    }

    return response.json() as Promise<PredictionResult>;
}

export async function fetchPredictions(): Promise<PredictionResult[]> {
    const response = await fetch(`${API_BASE_URL}/api/predictions/`);
    if (!response.ok) {
        throw new Error("Failed to load previous predictions.");
    }
    return response.json() as Promise<PredictionResult[]>;
}