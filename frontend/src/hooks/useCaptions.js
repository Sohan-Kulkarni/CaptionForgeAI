import { useCallback, useRef, useState } from "react";

import { generateCaptions, getApiErrorMessage } from "@/services/api";

function normalizeResponse(data) {
  if (Array.isArray(data?.items) && data.items.length > 0) {
    return data.items.slice(0, 4).map((item, index) => ({
      id: `${Date.now()}-${index}`,
      text: item.text,
      confidence: item.confidence ?? 0.86,
      strategy: item.strategy ?? "ai-caption",
    }));
  }

  return (data?.captions || []).slice(0, 4).map((text, index) => ({
    id: `${Date.now()}-${index}`,
    text,
    confidence: 0.86,
    strategy: "ai-caption",
  }));
}

export function useCaptions() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [captions, setCaptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState("creative");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const progressTimerRef = useRef(null);

  const setImage = useCallback((file) => {
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setCaptions([]);
    setError("");
    setProgress(0);
  }, []);

  const generate = useCallback(async () => {
    if (!selectedFile) {
      setError("Upload an image before generating captions.");
      return null;
    }

    setIsGenerating(true);
    setError("");
    setProgress(8);

    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }

    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => Math.min(current + Math.random() * 12, 92));
    }, 420);

    try {
      const data = await generateCaptions({ file: selectedFile, mode });
      const nextCaptions = normalizeResponse(data);

      if (nextCaptions.length < 4) {
        throw new Error("The model returned fewer than 4 captions.");
      }

      setCaptions(nextCaptions);
      setProgress(100);
      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          imageName: selectedFile.name,
          file: selectedFile,
          previewUrl,
          captions: nextCaptions,
          mode,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 6));

      return nextCaptions;
    } catch (generationError) {
      const message =
        generationError instanceof Error && generationError.message === "The model returned fewer than 4 captions."
          ? generationError.message
          : getApiErrorMessage(generationError);
      setError(message);
      return null;
    } finally {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      window.setTimeout(() => setIsGenerating(false), 300);
    }
  }, [mode, previewUrl, selectedFile]);

  const restoreHistoryItem = useCallback((item) => {
    setSelectedFile(item.file);
    setPreviewUrl(item.previewUrl);
    setCaptions(item.captions);
    setMode(item.mode);
    setError("");
    setProgress(100);
  }, []);

  return {
    selectedFile,
    previewUrl,
    captions,
    history,
    mode,
    setMode,
    isGenerating,
    progress,
    error,
    setImage,
    generate,
    restoreHistoryItem,
  };
}
