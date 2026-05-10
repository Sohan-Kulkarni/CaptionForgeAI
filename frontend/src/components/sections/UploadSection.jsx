import { AnimatePresence, motion } from "framer-motion";
import { FileImage, ImageUp, Loader2, RefreshCcw, ShieldCheck, Sparkles, WandSparkles, XCircle } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UploadSection({
  previewUrl,
  selectedFile,
  mode,
  setMode,
  isGenerating,
  progress,
  error,
  onSetImage,
  onGenerate,
}) {
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0];
        const message =
          firstError?.code === "file-too-large"
            ? `Images must be ${MAX_FILE_SIZE_MB} MB or smaller.`
            : "Upload a JPG, PNG, or WEBP image.";
        toast({ title: "Image rejected", description: message, variant: "error" });
        return;
      }

      if (acceptedFiles[0]) {
        onSetImage(acceptedFiles[0]);
        toast({
          title: "Image ready",
          description: "Preview loaded. Captions can be generated now.",
          variant: "success",
        });
      }
    },
    [onSetImage, toast],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleGenerate = async () => {
    const result = await onGenerate();
    if (result) {
      toast({
        title: "Captions generated",
        description: "Four new captions are ready to review.",
        variant: "success",
      });
    }
  };

  return (
    <section id="upload" className="scroll-mt-24 py-10 sm:py-14">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="glass-panel rounded-lg p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="amber" className="mb-3">
                Upload studio
              </Badge>
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">Create image captions</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Validate the image locally, send it to FastAPI, and receive four BLIP caption variants.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["creative", "detailed"].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "focus-ring rounded-md border px-4 py-2.5 text-sm font-semibold capitalize transition",
                    mode === option
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-border bg-background/[0.68] text-muted-foreground hover:border-primary/60 hover:text-foreground",
                  )}
                  onClick={() => setMode(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div
            {...getRootProps()}
            className={cn(
              "relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-background/[0.58] p-6 text-center transition",
              isDragActive ? "border-primary bg-primary/10 shadow-glow" : "border-border hover:border-primary/60",
            )}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={{ y: isDragActive ? -6 : [0, -8, 0] }}
              transition={{ duration: 2.8, repeat: isDragActive ? 0 : Infinity, ease: "easeInOut" }}
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/[0.12] text-primary"
            >
              <ImageUp className="h-8 w-8" />
            </motion.div>
            <h3 className="text-lg font-bold text-foreground">
              {isDragActive ? "Drop the image here" : "Drag an image into the studio"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              JPG, PNG, or WEBP. Maximum size: {MAX_FILE_SIZE_MB} MB.
            </p>
            <Button type="button" variant="outline" className="mt-5" onClick={open}>
              <FileImage className="h-4 w-4" />
              Browse files
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg border bg-background/[0.58] p-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Type validation
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-background/[0.58] p-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Size validation
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-background/[0.58] p-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Four outputs
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="glass-panel flex min-h-[520px] flex-col rounded-lg p-5 sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">Preview</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : "No image selected yet"}
              </p>
            </div>
            {selectedFile ? <Badge variant="teal">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Badge> : null}
          </div>

          <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-lg border bg-background/[0.62]">
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.img
                  key={previewUrl}
                  src={previewUrl}
                  alt="Uploaded preview"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45 }}
                  className="h-full max-h-[470px] w-full object-contain"
                />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center text-muted-foreground"
                >
                  <FileImage className="mx-auto mb-3 h-10 w-10" />
                  <p className="text-sm">Your uploaded image preview appears here.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isGenerating ? (
              <div className="absolute inset-x-4 bottom-4 rounded-lg border bg-background/[0.88] p-4 shadow-soft-xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Generating captions
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#14b8a6,#f59e0b,#fb7185)]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-200">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="premium"
              size="lg"
              className="flex-1"
              disabled={!selectedFile || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <WandSparkles className="h-5 w-5" />}
              Generate captions
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={!selectedFile || isGenerating}
              onClick={handleGenerate}
            >
              <RefreshCcw className="h-5 w-5" />
              Regenerate
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
