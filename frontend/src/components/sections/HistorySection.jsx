import { motion } from "framer-motion";
import { Clock3, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HistorySection({ history, onRestore }) {
  if (history.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Badge variant="outline" className="mb-3">
            Local history
          </Badge>
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Recent generations</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="glass-panel rounded-lg p-4"
            >
              <div className="flex gap-4">
                <img
                  src={item.previewUrl}
                  alt={item.imageName}
                  className="h-20 w-20 rounded-lg border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-foreground">{item.imageName}</p>
                    <Badge variant="teal" className="capitalize">
                      {item.mode}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.captions[0]?.text}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => onRestore(item)}>
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

