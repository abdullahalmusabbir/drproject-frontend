"use client";

import {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
    ReactNode,
} from "react";
import { PredictionResult } from "@/types";
import { fetchPredictions } from "@/lib/api";

export interface IndexedPredictionResult extends PredictionResult {
    index: number;
}

interface DataContextType {
    predictions: IndexedPredictionResult[];
    addPrediction: (result: PredictionResult) => void;
    clearPredictions: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [predictions, setPredictions] = useState<IndexedPredictionResult[]>([]);
    const [loaded, setLoaded] = useState(false);
    const counterRef = useRef<number>(0);

    useEffect(() => {
        const loadPredictions = async () => {
            try {
                const results = await fetchPredictions();
                const indexed: IndexedPredictionResult[] = results.map((r, i) => ({
                    ...r,
                    index: results.length - i,  // নন décroing order অনুযায়ী ইনডেক্স
                }));
                setPredictions(indexed);
                counterRef.current = results.length;
            } catch (err) {
                console.error("Failed to load predictions:", err);
            } finally {
                setLoaded(true);
            }
        };

        if (!loaded) {
            loadPredictions();
        }
    }, [loaded]);

    const addPrediction = (result: PredictionResult) => {
        // একই id আগে থেকেই 있다면 ডুপ্লিকেট नहीं add করবে
        setPredictions((prev) => {
            if (prev.some((p) => p.id === result.id)) {
                return prev;
            }
            counterRef.current += 1;
            const indexed: IndexedPredictionResult = {
                ...result,
                index: counterRef.current,
            };
            return [indexed, ...prev];
        });
    };

    const clearPredictions = () => {
        setPredictions([]);
        counterRef.current = 0;
    };

    return (
        <DataContext.Provider value={{ predictions, addPrediction, clearPredictions }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData(): DataContextType {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}