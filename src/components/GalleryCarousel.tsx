import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

const defaultImages = [
  "https://images.unsplash.com/photo-1596073413908-445253ce39bb?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1582531383827-0240974ed22f?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1585128719715-46776b56a0d1?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=1500&q=80"
];

export default function GalleryCarousel() {
  const [images, setImages] = useState(defaultImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepageSettings"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.archiveImages && data.archiveImages.length > 0) {
          setImages(data.archiveImages);
          setCurrentIndex(prev => prev < data.archiveImages.length ? prev : 0);
        }
      }
    });
    return () => unsub();
  }, []);
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
    <>
      <section ref={sectionRef} className="relative py-20 bg-editorial-bg overflow-hidden border-b border-editorial-line/10">
        <div className="px-6 md:px-[60px] mb-12 flex flex-col md:flex-row justify-between items-end gap-6 md:gap-0">
          <div>
            <span className="text-editorial-accent text-[12px] uppercase tracking-[4px] font-semibold mb-4 block">Archive</span>
            <h2 className="text-3xl font-serif">Kho Lưu Trữ <span className="italic-serif">Vẻ Đẹp.</span></h2>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => paginate(-1)}
              className="w-12 h-12 border border-editorial-line flex items-center justify-center hover:bg-editorial-text hover:text-editorial-bg transition-all focus:outline-none"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => paginate(1)}
              className="w-12 h-12 border border-editorial-line flex items-center justify-center hover:bg-editorial-text hover:text-editorial-bg transition-all focus:outline-none"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="relative h-[60vh] w-full flex items-center justify-center touch-pan-y">
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
              className="absolute w-full h-full px-6 md:px-[60px]"
            >
              <div 
                className="w-full h-full relative group cursor-grab active:cursor-grabbing overflow-hidden"
              >
                 <motion.img
                  style={{ y }}
                  src={images[currentIndex]}
                  alt={`Gallery image ${currentIndex + 1}`}
                  onLoad={() => setImageLoaded(true)}
                  onClick={() => setIsFullscreen(true)}
                  className={`absolute inset-0 w-full h-[120%] object-cover grayscale contrast-125 brightness-90 group-hover:grayscale-0 transition-[filter,transform] duration-[2s,0.5s] scale-105 group-hover:scale-100 ${imageLoaded ? 'blur-0' : 'blur-xl'}`}
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                <div className="absolute bottom-10 left-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                   <span className="text-[10px] uppercase tracking-[4px]">Bền Vững & Nhân Văn</span>
                   <p className="text-2xl font-serif mt-2">Ghi dấu thời gian trên từng thớ tre.</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 md:px-[60px] mt-12 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={`h-1 transition-all duration-500 focus:outline-none ${i === currentIndex ? 'w-12 bg-editorial-accent' : 'w-4 bg-editorial-line'}`}
            />
          ))}
        </div>
      </section>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          >
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 p-2"
            >
              <X size={32} strokeWidth={1.5} />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); paginate(-1); }}
              className="absolute left-6 text-white/50 hover:text-white transition-colors p-4 z-50 hidden md:block"
            >
              <ChevronLeft size={48} strokeWidth={1} />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); paginate(1); }}
              className="absolute right-6 text-white/50 hover:text-white transition-colors p-4 z-50 hidden md:block"
            >
              <ChevronRight size={48} strokeWidth={1} />
            </button>

            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full max-h-screen p-4 md:p-16 flex items-center justify-center"
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
            >
              <img 
                src={images[currentIndex]} 
                alt={`Gallery image ${currentIndex + 1} fullscreen`} 
                className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                draggable={false}
              />
            </motion.div>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 text-white/50 text-[10px] uppercase tracking-widest pointer-events-none">
              <span>{currentIndex + 1} / {images.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
