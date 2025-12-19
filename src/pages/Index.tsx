import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import HeroSection from "@/components/HeroSection";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus, { ProcessingState } from "@/components/ProcessingStatus";
import ResultsDownload from "@/components/ResultsDownload";
import PredictionHistory, { HistoryItem } from "@/components/PredictionHistory";
import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import { parseCSV, downloadCSV } from "@/lib/csvUtils";

interface PredictionResult {
  totalRecords: number;
  churnCount: number;
  retainCount: number;
  churnRate: number;
  data: Array<Record<string, unknown>>;
}

const Index = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [currentFilename, setCurrentFilename] = useState("");
  const [results, setResults] = useState<PredictionResult | null>(null);
  const [recordsProcessed, setRecordsProcessed] = useState(0);
  
  const { history, addToHistory, deleteFromHistory } = usePredictionHistory();

  const simulateProgress = useCallback(() => {
    return new Promise<void>((resolve) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 90) {
          clearInterval(interval);
          setProgress(90);
          resolve();
        } else {
          setProgress(Math.min(currentProgress, 90));
        }
      }, 300);
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    setCurrentFilename(file.name);
    setProcessingState("uploading");
    setProgress(0);
    setResults(null);

    try {
      // Read the CSV file
      const text = await file.text();
      const parsedData = parseCSV(text);
      setRecordsProcessed(parsedData.length);

      setProcessingState("processing");
      
      // Start progress simulation
      const progressPromise = simulateProgress();

      // TODO: Replace this with your actual API call
      // Example API integration:
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('YOUR_API_ENDPOINT', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const predictions = await response.json();

      // Simulating API response - REPLACE WITH ACTUAL API CALL
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulated prediction results - REPLACE WITH ACTUAL API RESPONSE
      const mockPredictions = parsedData.map((row) => ({
        ...row,
        churn_prediction: Math.random() > 0.7 ? 1 : 0,
        churn_probability: (Math.random() * 100).toFixed(2),
      }));

      await progressPromise;
      setProgress(100);

      const churnCount = mockPredictions.filter((r) => r.churn_prediction === 1).length;
      const retainCount = mockPredictions.length - churnCount;
      
      const predictionResult: PredictionResult = {
        totalRecords: mockPredictions.length,
        churnCount,
        retainCount,
        churnRate: (churnCount / mockPredictions.length) * 100,
        data: mockPredictions,
      };

      setResults(predictionResult);
      setProcessingState("completed");

      // Add to history
      addToHistory({
        filename: file.name,
        date: new Date().toISOString(),
        recordsProcessed: mockPredictions.length,
        churnRate: predictionResult.churnRate,
        data: mockPredictions,
      });

      toast.success("Analysis complete!", {
        description: `Processed ${mockPredictions.length.toLocaleString()} customer records`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      setProcessingState("error");
      toast.error("Failed to process file", {
        description: "Please check your file format and try again",
      });
    }
  };

  const handleDownload = () => {
    if (results?.data) {
      const outputFilename = currentFilename.replace('.csv', '_predictions.csv');
      downloadCSV(results.data, outputFilename);
      toast.success("Report downloaded successfully");
    }
  };

  const handleHistoryDownload = (item: HistoryItem) => {
    const outputFilename = item.filename.replace('.csv', '_predictions.csv');
    downloadCSV(item.data, outputFilename);
    toast.success("Report downloaded successfully");
  };

  const handleHistoryDelete = (id: string) => {
    deleteFromHistory(id);
    toast.success("Prediction removed from history");
  };

  const handleNewPrediction = () => {
    setProcessingState("idle");
    setProgress(0);
    setResults(null);
    setCurrentFilename("");
    setRecordsProcessed(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">ChurnPredict</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API Reference
            </a>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection />

        {/* Upload Section */}
        <section id="upload" className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-3">
                Start Your Analysis
              </h2>
              <p className="text-muted-foreground">
                Upload your customer data CSV file to get churn predictions
              </p>
            </div>

            {processingState === "idle" && (
              <FileUpload 
                onFileSelect={handleFileSelect} 
                isProcessing={false} 
              />
            )}

            {(processingState === "uploading" || processingState === "processing") && (
              <ProcessingStatus
                state={processingState}
                progress={progress}
                recordsProcessed={recordsProcessed}
              />
            )}

            {processingState === "completed" && results && (
              <ResultsDownload
                results={results}
                filename={currentFilename}
                onDownload={handleDownload}
                onNewPrediction={handleNewPrediction}
              />
            )}

            {processingState === "error" && (
              <div className="text-center">
                <ProcessingStatus
                  state="error"
                  progress={0}
                  message="Failed to process your file. Please check the format and try again."
                />
                <button
                  onClick={handleNewPrediction}
                  className="mt-4 text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </section>

        {/* History Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <PredictionHistory
              history={history}
              onDownload={handleHistoryDownload}
              onDelete={handleHistoryDelete}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <span className="font-display font-semibold text-foreground">ChurnPredict</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ChurnPredict. AI-powered customer retention analytics.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
