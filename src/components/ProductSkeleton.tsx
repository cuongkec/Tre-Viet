import React from "react";
import { motion } from "motion/react";

export default function ProductSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay: (index % 4) * 0.1,
        ease: [0.215, 0.61, 0.355, 1] 
      }}
      className="flex flex-col gap-4"
    >
      <div className="aspect-[3/4] bg-editorial-muted/20 animate-pulse rounded-lg" />
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2 w-2/3">
          <div className="h-5 bg-editorial-muted/20 animate-pulse rounded w-full" />
          <div className="h-3 bg-editorial-muted/20 animate-pulse rounded w-1/2" />
        </div>
        <div className="h-5 bg-editorial-muted/20 animate-pulse rounded w-1/4" />
      </div>
    </motion.div>
  );
}
