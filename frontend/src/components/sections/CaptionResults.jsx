import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, FileJson, Play, Sparkles } from "lucide-react";

import { fadeUp, staggerContainer } from "@/animations/variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";

export default function CaptionResults({ captions, isGenerating, mode }) {
  const { toast } = useToast();
  const hasCaptions = captions.length > 0;

  const copyCaption = async (caption) => {
    try {
      await navigator.clipboard.writeText(caption.text);
      toast({ title: "Copied", description: "Caption copied to clipboard.", variant: "success" });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access is unavailable in this browser.", variant: "error" });
    }
  };

  const speakCaption = (caption) => {
    if (!("speechSynthesis" in window)) {
      toast({ title: "Speech unavailable", description: "Your browser does not support speech synthesis.", variant: "error" });
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(caption.text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const download = (type) => {
    if (!hasCaptions) return;

    const content =
      type === "json"
        ? JSON.stringify({ mode, captions }, null, 2)
        : captions
            .map(
              (caption, index) =>
                `Caption ${index + 1}\n${caption.text}\nConfidence: ${Math.round(caption.confidence * 100)}%\nStrategy: ${caption.strategy}`,
            )
            .join("\n\n");

    const blob = new Blob([content], { type: type === "json" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = type === "json" ? "captions.json" : "captions.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download started", description: `Captions exported as ${type.toUpperCase()}.`, variant: "success" });
  };

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Results
            </Badge>
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Generated captions</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Every generation returns four caption variants with copy, speech, and export actions.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!hasCaptions} onClick={() => download("txt")}>
              <Download className="h-4 w-4" />
              TXT
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!hasCaptions} onClick={() => download("json")}>
              <FileJson className="h-4 w-4" />
              JSON
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass-panel rounded-lg p-5">
                  <Skeleton className="mb-4 h-5 w-24" />
                  <Skeleton className="mb-3 h-4 w-full" />
                  <Skeleton className="mb-3 h-4 w-11/12" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="mt-6 flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-10" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : hasCaptions ? (
            <motion.div
              key="captions"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {captions.map((caption, index) => (
                <CaptionCard
                  key={caption.id}
                  caption={caption}
                  index={index}
                  onCopy={copyCaption}
                  onSpeak={speakCaption}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-lg border border-dashed bg-background/[0.58] p-10 text-center text-muted-foreground"
            >
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
              <p className="font-medium text-foreground">Caption cards will appear here.</p>
              <p className="mt-2 text-sm">Upload an image and generate captions to fill this section.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function CaptionCard({ caption, index, onCopy, onSpeak }) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{
        y: -6,
        rotateX: 1.5,
        rotateY: -1.5,
        boxShadow: "0 24px 70px rgba(20, 184, 166, 0.18)",
      }}
      className="glass-panel flex min-h-[250px] flex-col rounded-lg p-5 transition"
    >
      <div className="mb-4 flex items-center justify-between">
        <Badge variant={index % 2 === 0 ? "teal" : "amber"}>Caption {index + 1}</Badge>
        <span className="text-xs font-bold text-muted-foreground">{Math.round(caption.confidence * 100)}%</span>
      </div>

      <p className="flex-1 text-base leading-7 text-foreground">{caption.text}</p>

      <div className="mt-5 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onCopy(caption)}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Read caption ${index + 1}`} onClick={() => onSpeak(caption)}>
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </motion.article>
  );
}
