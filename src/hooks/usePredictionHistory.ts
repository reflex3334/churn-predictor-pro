import { useState, useEffect } from "react";
import { HistoryItem } from "@/components/PredictionHistory";

const STORAGE_KEY = "churn_prediction_history";

export const usePredictionHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse prediction history:", e);
      }
    }
  }, []);

  const addToHistory = (item: Omit<HistoryItem, "id">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    
    return newItem;
  };

  const deleteFromHistory = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    history,
    addToHistory,
    deleteFromHistory,
    clearHistory,
  };
};
