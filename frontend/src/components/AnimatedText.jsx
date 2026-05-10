import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const words = ["precise", "creative", "search-ready", "human-friendly"];

export default function AnimatedText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-flex min-w-[9.5rem] justify-start sm:min-w-[12rem]">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="gradient-text"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

