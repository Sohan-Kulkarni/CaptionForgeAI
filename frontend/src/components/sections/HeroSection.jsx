import { motion } from "framer-motion";
import { ArrowDown, Bot, Image, Sparkles, WandSparkles } from "lucide-react";

import AnimatedText from "@/components/AnimatedText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fadeUp, staggerContainer } from "@/animations/variants";

export default function HeroSection() {
  const scrollToUpload = () => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8"
      >
        <div>
          <motion.div variants={fadeUp}>
            <Badge variant="teal" className="mb-5">
              BLIP-powered vision captions
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="max-w-4xl text-4xl font-black leading-[1.02] text-foreground sm:text-6xl lg:text-7xl"
          >
            Transform Images into Intelligent Descriptions
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Upload a visual and generate four <AnimatedText /> captions tuned for accessibility,
            content workflows, product catalogs, and creative exploration.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="premium" type="button" onClick={scrollToUpload}>
              <WandSparkles className="h-5 w-5" />
              Generate captions
            </Button>
            <Button size="lg" variant="outline" type="button" onClick={scrollToUpload}>
              <ArrowDown className="h-5 w-5" />
              Upload image
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
            {[
              ["4x", "caption variants"],
              ["8 MB", "upload limit"],
              ["2 modes", "creative/detailed"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border bg-background/[0.58] p-3 backdrop-blur">
                <p className="font-bold text-foreground">{value}</p>
                <p className="mt-1 text-muted-foreground">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="relative">
          <HeroProductPreview />
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroProductPreview() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="glass-panel overflow-hidden rounded-lg p-3"
    >
      <div className="overflow-hidden rounded-lg border border-white/20 bg-background/[0.60]">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bot className="h-4 w-4 text-primary" />
            Vision studio
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" />
        </div>

        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[280px] overflow-hidden bg-muted">
            <img
              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85"
              alt="Mountain landscape sample for AI captioning"
              className="h-full min-h-[280px] w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/[0.45] via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/[0.45] px-3 py-2 text-xs font-medium text-white backdrop-blur">
              <Image className="h-4 w-4" />
              landscape.jpg
            </div>
          </div>

          <div className="space-y-3 p-4">
            {[
              "A calm mountain lake reflects a warm sky at sunset.",
              "An open landscape with water, hills, and dramatic evening light.",
              "A scenic outdoor view captures nature in soft golden tones.",
            ].map((caption, index) => (
              <motion.div
                key={caption}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + index * 0.16 }}
                className="rounded-lg border bg-background/[0.78] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Caption {index + 1}</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-sm leading-6 text-foreground">{caption}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
