import React, { useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Eye } from "lucide-react";

interface ProductCardProps {
  product: any;
  index: number;
  navigate: (path: string) => void;
  addToCart: (product: any) => void;
  onQuickView?: () => void;
  onImageClick?: () => void;
}

export default function ProductCard({ 
  product, 
  index, 
  navigate, 
  addToCart, 
  onQuickView, 
  onImageClick 
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [coords, setCoords] = useState({ x: 0, y: 0, pctX: 0, pctY: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const isNew = useMemo(() => {
    if (!product.createdAt && !product.created_at) return false;
    const dateVal = product.createdAt || product.created_at;
    const createdAtTime = dateVal?.seconds 
      ? dateVal.seconds * 1000 
      : new Date(dateVal).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return createdAtTime > sevenDaysAgo;
  }, [product.createdAt, product.created_at]);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);

    setCoords({
      x: mouseX,
      y: mouseY,
      pctX: mouseX / width,
      pctY: mouseY / height
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const activeImage = isHovered && product.images && product.images.length > 1 ? product.images[1] : product.image;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ 
        duration: 1.2, 
        delay: (index % 4) * 0.15,
        ease: [0.25, 1, 0.5, 1] 
      }}
      className="group"
    >
      <motion.div 
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`${isPortrait ? "aspect-[3/4]" : "aspect-[4/3]"} overflow-hidden bg-editorial-muted/10 mb-6 relative group/btn transition-[shadow,border-radius,aspect-ratio] duration-500 hover:shadow-2xl cursor-pointer`}
        onClick={() => navigate(`/product/${product.id}`)}
        style={{ perspective: 1200 }}
        animate={{
          borderRadius: isHovered ? "16px" : "0px",
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0px 30px 5px rgba(139, 92, 26, 0.2)" 
            : "0 0px 0px 0px rgba(139, 92, 26, 0)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Subtle hover border */}
        <div 
          className="absolute inset-0 border border-editorial-accent/40 pointer-events-none transition-all duration-500 opacity-0 group-hover/btn:opacity-100 z-30"
          style={{ borderRadius: isHovered ? "16px" : "0px" }}
        />

        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start pointer-events-none">
          {isNew && (
             <div className="bg-editorial-accent text-white px-2 py-1 rounded-[2px] text-[9px] uppercase font-bold tracking-[2px] shadow-sm whitespace-nowrap">
                NEW
             </div>
          )}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-[4px] shadow-sm border border-editorial-line/10 whitespace-nowrap"
          >
            <span className="text-[10px] uppercase font-bold tracking-[2px] text-editorial-text">
              {product.material === "Natural" ? "Tre Tự Nhiên" : product.material === "Handcrafted" ? "Thủ Công" : product.material === "Processed" ? "Tre Kỹ Thuật" : product.material}
            </span>
          </motion.div>
        </div>

        {/* Small transparent label showing materials */}
        <div className="absolute bottom-20 left-4 z-20 pointer-events-none transition-all duration-300 opacity-0 group-hover/btn:opacity-100 bg-white/80 backdrop-blur-md border border-editorial-line/15 text-editorial-text text-[9px] uppercase font-semibold tracking-[2px] px-2.5 py-1 rounded-[2px] shadow-sm">
          {product.material === "Natural" ? "Tre Tự Nhiên" : product.material === "Handcrafted" ? "Thủ Công" : product.material === "Processed" ? "Tre Kỹ Thuật" : product.material || "Tre Tự Nhiên"}
        </div>

        <div className="relative w-full h-full">
          <motion.img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onClick={(e) => { 
              if (onImageClick) {
                e.stopPropagation(); 
                onImageClick(); 
              }
            }}
            className={`product-card-image w-full h-full object-cover transition-all duration-700 grayscale-[20%] brightness-95 group-hover:grayscale-0 group-hover:brightness-100 ${
              isHovered && product.images && product.images.length > 1 ? "opacity-0" : "opacity-100"
            }`}
            referrerPolicy="no-referrer"
            style={{ rotateX, rotateY }}
            animate={isHovered ? {
              scale: 1.05,
              translateZ: 40,
            } : isNew ? {
              scale: [1, 1.015, 1],
              opacity: [0.93, 1, 0.93],
            } : {
              scale: 1,
              translateZ: 0
            }}
            transition={isHovered ? {
              type: "spring",
              stiffness: 250,
              damping: 25
            } : isNew ? {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            } : {
              duration: 0.3
            }}
          />
          {product.images && product.images.length > 1 && (
            <motion.img
              src={product.images[1]}
              alt={product.name}
              loading="lazy"
              onClick={(e) => {
                if (onImageClick) {
                  e.stopPropagation();
                  onImageClick();
                }
              }}
              className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              referrerPolicy="no-referrer"
              style={{ rotateX, rotateY }}
              animate={isHovered ? {
                scale: 1.05,
                translateZ: 40,
              } : { 
                scale: 1,
                translateZ: 0
              }}
              transition={{ type: "spring", stiffness: 250, damping: 25 }}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none flex flex-col justify-end p-6 z-10 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          >
            <h3 className="text-white font-serif text-[24px] mb-1">{product.name}</h3>
            <p className="text-white/90 font-light text-[15px]">{product.price}</p>
          </motion.div>
        </div>
        
        {/* Aspect Ratio Toggle Control */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsPortrait(!isPortrait);
          }}
          className="absolute top-4 right-16 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-white hover:text-editorial-accent z-35 flex items-center justify-center text-editorial-text"
          title={isPortrait ? "Chuyển sang khung ngang (Landscape)" : "Chuyển sang khung dọc (Portrait)"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
            {isPortrait ? (
              <rect x="3" y="6" width="18" height="12" rx="2" />
            ) : (
              <rect x="6" y="3" width="12" height="18" rx="2" />
            )}
          </svg>
        </button>

        {/* Quick View Trigger (only if provided) */}
        {onQuickView && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-white hover:text-editorial-accent z-20"
            title="Xem nhanh"
          >
            <Eye size={18} />
          </button>
        )}

        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="absolute bottom-0 left-0 w-full bg-editorial-text text-white py-5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out text-[10px] uppercase tracking-[3px] font-bold z-10 hover:bg-editorial-accent"
        >
          Thêm vào giỏ hàng
        </button>
      </motion.div>
      <div 
        onClick={() => navigate(`/product/${product.id}`)}
        className="flex justify-between items-start cursor-pointer"
      >
        <div>
          <h3 className="font-serif text-[18px] group-hover:text-editorial-accent transition-colors mb-1">
            {product.name}
          </h3>
          <p className="text-[10px] uppercase tracking-[2px] opacity-40">{product.category}</p>
        </div>
        <span className="text-[14px] font-light">{product.price}</span>
      </div>
    </motion.div>
  );
}
