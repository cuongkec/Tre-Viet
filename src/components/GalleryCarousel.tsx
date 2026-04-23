import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  "https://images.unsplash.com/photo-1596073413908-445253ce39bb?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1582531383827-0240974ed22f?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1585128719715-46776b56a0d1?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=1500&q=80"
];

export default function GalleryCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => (prevIndex + newDirection + images.length) % images.length);
  };

  return (
    <section ref={sectionRef} className="py-20 bg-editorial-bg overflow-hidden border-b border-editorial-line/10">
      <div className="px-[60px] mb-12 flex justify-between items-end">
        <div>
          <span className="text-editorial-accent text-[12px] uppercase tracking-[4px] font-semibold mb-4 block">Archive</span>
          <h2 className="text-3xl font-serif">Kho Lưu Trữ <span className="italic-serif">Vẻ Đẹp.</span></h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => paginate(-1)}
            className="w-12 h-12 border border-editorial-line flex items-center justify-center hover:bg-editorial-text hover:text-editorial-bg transition-all"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => paginate(1)}
            className="w-12 h-12 border border-editorial-line flex items-center justify-center hover:bg-editorial-text hover:text-editorial-bg transition-all"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="relative h-[60vh] w-full flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute w-full h-full px-[60px]"
          >
            <div className="w-full h-full relative group cursor-grab active:cursor-grabbing overflow-hidden">
               <motion.img
                style={{ y }}
                src={images[currentIndex]}
                alt={`Gallery image ${currentIndex + 1}`}
                className="absolute inset-0 w-full h-[120%] object-cover grayscale contrast-125 brightness-90 group-hover:grayscale-0 transition-[filter,transform] duration-[2s] scale-105 group-hover:scale-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-10 left-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                 <span className="text-[10px] uppercase tracking-[4px]">Bền Vững & Nhân Văn</span>
                 <p className="text-2xl font-serif mt-2">Ghi dấu thời gian trên từng thớ tre.</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-[60px] mt-12 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
            className={`h-1 transition-all duration-500 ${i === currentIndex ? 'w-12 bg-editorial-accent' : 'w-4 bg-editorial-line'}`}
          />
        ))}
      </div>
    </section>
  );
}
