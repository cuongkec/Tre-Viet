import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { Search, Filter, ArrowRight, X, ChevronDown, Eye } from "lucide-react";
import Fuse from "fuse.js";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import QuickViewModal from "../components/QuickViewModal";
import { initialProducts } from "../constants";

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activePriceRange, setActivePriceRange] = useState("Tất cả");
  const [activeMaterial, setActiveMaterial] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedProducts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as any[];
        setProducts(fetchedProducts);
      } else {
        setProducts([]);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const qCat = query(collection(db, "categories"));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const dbCats = snapshot.docs.map(doc => doc.data().name);
      const uniqueCats = Array.from(new Set(["Tất cả", "Bàn Ghế", "Đèn Trang Trí", "Phụ Kiện", "Nội Thất", ...dbCats]));
      setCategories(uniqueCats);
    });

    const qMat = query(collection(db, "materials"));
    const unsubMat = onSnapshot(qMat, (snapshot) => {
      const dbMats = snapshot.docs.map(doc => doc.data().name);
      const uniqueMats = Array.from(new Set(["Tất cả", "Natural", "Handcrafted", "Processed", ...dbMats]));
      setMaterials(uniqueMats);
    });

    return () => {
      unsubCat();
      unsubMat();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    // First filter by metadata
    result = result.filter((product) => {
      const matchesCategory = activeCategory === "Tất cả" || product.category === activeCategory;
      const matchesMaterial = activeMaterial === "Tất cả" || product.material === activeMaterial;
      
      let matchesPrice = true;
      if (activePriceRange === "Dưới 1M") {
        matchesPrice = product.priceNum < 1000000;
      } else if (activePriceRange === "1M - 5M") {
        matchesPrice = product.priceNum >= 1000000 && product.priceNum <= 5000000;
      } else if (activePriceRange === "Trên 5M") {
        matchesPrice = product.priceNum > 5000000;
      }

      return matchesCategory && matchesMaterial && matchesPrice;
    });

    // Then apply fuzzy search if query exists
    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ["name", "category", "material"],
        threshold: 0.3, // Lower is stricter
        distance: 100
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      result = [...result].sort((a, b) => {
        const dateA = (a as any).createdAt?.seconds || (a as any).createdAt?.toMillis?.() || new Date((a as any).createdAt || 0).getTime() || 0;
        const dateB = (b as any).createdAt?.seconds || (b as any).createdAt?.toMillis?.() || new Date((b as any).createdAt || 0).getTime() || 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.priceNum - b.priceNum);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.priceNum - a.priceNum);
    }

    return result;
  }, [products, activeCategory, activePriceRange, activeMaterial, searchQuery, sortBy]);

  return (
    <div className="bg-editorial-bg min-h-screen">
      <Navbar />
      
      <main className="pt-40 pb-20 px-6 md:px-[60px]">
        {/* Header */}
        <header className="max-w-7xl mx-auto mb-20 text-center">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-editorial-accent text-[12px] uppercase tracking-[4px] font-semibold mb-6 block"
          >
            Sustainable Living
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl md:text-7xl font-serif leading-tight mb-8 overflow-hidden"
          >
            <motion.span 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: "circOut" }}
              className="block"
            >
              Bộ Sưu Tập
            </motion.span>
            <motion.span 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "circOut" }}
              className="block italic-serif text-editorial-accent"
            >
              Đương Đại.
            </motion.span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#666] max-w-2xl mx-auto font-light leading-relaxed"
          >
            Khám phá những thiết kế lấy cảm hứng từ thiên nhiên, kết hợp giữa nghệ thuật đan lát cổ điển và hơi thở đời sống hiện đại.
          </motion.p>
        </header>

        {/* Toolbar */}
        <div className="max-w-7xl mx-auto mb-16 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-y border-editorial-line/10 py-8">
            <div className="flex gap-8 items-center text-[11px] uppercase tracking-[2px] font-bold opacity-60">
              <button 
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`flex items-center gap-2 hover:text-editorial-accent transition-colors ${isFilterMenuOpen ? 'text-editorial-accent opacity-100' : ''}`}
              >
                <Filter size={14} /> {isFilterMenuOpen ? 'Đóng bộ lọc' : 'Lọc sản phẩm'}
              </button>
              <div className="hidden sm:block w-px h-4 bg-editorial-line/20" />
              <div className="hidden sm:flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`transition-colors hover:text-editorial-accent whitespace-nowrap ${activeCategory === cat ? 'text-editorial-accent opacity-100' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full md:w-auto">
              {/* Sort selector */}
              <div className="flex items-center gap-2 border-b border-editorial-line/20 py-2">
                <span className="text-[10px] uppercase tracking-[1.5px] font-bold opacity-40 whitespace-nowrap">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[11px] uppercase tracking-[1px] font-bold outline-none focus:text-editorial-accent cursor-pointer pr-5 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundPosition: 'right center',
                    backgroundSize: '10px',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <option value="newest" className="bg-white text-editorial-text font-normal normal-case tracking-normal font-sans">Mới nhất</option>
                  <option value="price-asc" className="bg-white text-editorial-text font-normal normal-case tracking-normal font-sans">Giá: Thấp đến Cao</option>
                  <option value="price-desc" className="bg-white text-editorial-text font-normal normal-case tracking-normal font-sans">Giá: Cao đến Thấp</option>
                </select>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Tìm sản phẩm..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-b border-editorial-line/20 py-2 text-sm focus:border-editorial-accent outline-none transition-colors"
                />
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-0 top-2 opacity-30 hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <Search size={16} className="absolute right-0 top-2 opacity-30" />
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isFilterMenuOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-editorial-muted/5 border-b border-editorial-line/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10 px-4">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[3px] font-bold mb-6 opacity-40">Khoảng giá</h4>
                    <div className="flex flex-wrap gap-3">
                      {["Tất cả", "Dưới 1M", "1M - 5M", "Trên 5M"].map((range) => (
                        <button
                          key={range}
                          onClick={() => setActivePriceRange(range)}
                          className={`px-6 py-2 border text-[11px] uppercase tracking-[1px] transition-all ${
                            activePriceRange === range 
                            ? 'bg-editorial-text text-white border-editorial-text' 
                            : 'border-editorial-line/20 hover:border-editorial-accent'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[3px] font-bold mb-6 opacity-40">Chất liệu / Chế tác</h4>
                    <div className="flex flex-wrap gap-3">
                      {materials.map((mat) => (
                        <button
                          key={mat}
                          onClick={() => setActiveMaterial(mat)}
                          className={`px-6 py-2 border text-[11px] uppercase tracking-[1px] transition-all ${
                            activeMaterial === mat 
                            ? 'bg-editorial-text text-white border-editorial-text' 
                            : 'border-editorial-line/20 hover:border-editorial-accent'
                          }`}
                        >
                          {mat === "Natural" ? "Tre Tự Nhiên" : mat === "Handcrafted" ? "Thủ Công" : mat === "Processed" ? "Tre Kỹ Thuật" : mat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status bar for active filters */}
        {(activeCategory !== "Tất cả" || activePriceRange !== "Tất cả" || activeMaterial !== "Tất cả" || searchQuery) && (
          <div className="max-w-7xl mx-auto mb-12 flex flex-wrap gap-4 items-center">
            <span className="text-[10px] uppercase tracking-[2px] font-bold opacity-30 italic">Đang lọc theo:</span>
            {activeCategory !== "Tất cả" && (
              <span className="bg-editorial-accent/10 px-3 py-1 text-[10px] font-medium border border-editorial-accent/20 flex items-center gap-2">
                {activeCategory} <X size={10} className="cursor-pointer" onClick={() => setActiveCategory("Tất cả")} />
              </span>
            )}
            {activePriceRange !== "Tất cả" && (
              <span className="bg-editorial-accent/10 px-3 py-1 text-[10px] font-medium border border-editorial-accent/20 flex items-center gap-2">
                {activePriceRange} <X size={10} className="cursor-pointer" onClick={() => setActivePriceRange("Tất cả")} />
              </span>
            )}
            {activeMaterial !== "Tất cả" && (
              <span className="bg-editorial-accent/10 px-3 py-1 text-[10px] font-medium border border-editorial-accent/20 flex items-center gap-2">
                {activeMaterial} <X size={10} className="cursor-pointer" onClick={() => setActiveMaterial("Tất cả")} />
              </span>
            )}
            {searchQuery && (
              <span className="bg-editorial-accent/10 px-3 py-1 text-[10px] font-medium border border-editorial-accent/20 flex items-center gap-2">
                Search: "{searchQuery}" <X size={10} className="cursor-pointer" onClick={() => setSearchQuery("")} />
              </span>
            )}
            <button 
              onClick={() => {
                setActiveCategory("Tất cả");
                setActivePriceRange("Tất cả");
                setActiveMaterial("Tất cả");
                setSearchQuery("");
              }}
              className="text-[10px] uppercase tracking-[2px] font-bold text-editorial-accent hover:underline ml-4"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <p className="font-serif italic text-xl opacity-40 text-editorial-text">Đang tải bộ sưu tập...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                navigate={navigate}
                addToCart={addToCart}
                onQuickView={() => {
                  setSelectedQuickViewProduct(product);
                  setIsQuickViewOpen(true);
                }}
                onImageClick={() => setLightboxImage(product.image)}
              />
          ))
        ) : (
          <div className="col-span-full py-20 text-center border border-dashed border-editorial-line/20">
            <p className="font-serif italic text-xl opacity-40 text-editorial-text">Không tìm thấy sản phẩm phù hợp với bộ lọc của bạn.</p>
            <button 
              onClick={() => {
                setActiveCategory("Tất cả");
                setActivePriceRange("Tất cả");
                setActiveMaterial("Tất cả");
                setSearchQuery("");
              }}
              className="mt-6 text-[10px] uppercase tracking-[3px] font-bold text-editorial-accent hover:underline"
            >
              Cài đặt lại toàn bộ lọc
            </button>
          </div>
        )}
        </div>

        {/* Pagination/Load More */}
        <div className="max-w-7xl mx-auto mt-32 text-center">
            <motion.button 
              whileHover={{ 
                scale: 1.02,
                borderColor: "var(--editorial-accent)",
                color: "var(--editorial-accent)"
              }}
              whileTap={{ scale: 0.98 }}
              className="px-12 py-5 border border-editorial-text text-[12px] uppercase tracking-[4px] font-bold transition-all flex items-center gap-4 mx-auto group relative overflow-hidden"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-white">Xem thêm sản phẩm</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-2 transition-all duration-500 group-hover:text-white" />
              <div className="absolute inset-x-0 bottom-0 h-0 bg-editorial-text -z-0 group-hover:h-full transition-all duration-500 ease-in-out" />
            </motion.button>
        </div>
      </main>

      <Footer />

      <QuickViewModal 
        product={selectedQuickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onViewDetail={(id) => navigate(`/product/${id}`)}
      />

      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md select-none"
            onClick={() => setLightboxImage(null)}
          >
            {/* Header Controls */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-50">
              <div className="text-white/95">
                <p className="text-[10px] uppercase tracking-[3px] font-bold text-editorial-accent mb-1">CHI TIẾT CHẾ TÁC THỦ CÔNG</p>
                <h3 className="text-lg font-serif">Kính Phóng Vân Tre Tự Nhiên</h3>
              </div>
              <button 
                className="text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 p-3 rounded-full pointer-events-auto shadow-xl"
                onClick={() => setLightboxImage(null)}
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* Premium Panning Area */}
            <div 
              className="relative w-[90vw] h-[70vh] md:w-[80vw] md:h-[75vh] overflow-hidden bg-zinc-950/40 border border-white/10 rounded-[6px] cursor-grab active:cursor-grabbing flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-[4px] text-[10px] text-white/90 font-mono flex items-center gap-2 z-10 pointer-events-none shadow-lg">
                <span className="w-2h-2 bg-emerald-500 rounded-full animate-pulse" style={{ width: '8px', height: '8px' }} />
                <span>PHÓNG ĐẠI CHUYÊN SÂU: 2.5X VÂN TRE BIỂU MẪU</span>
              </div>

              {/* High-Res Drag/Pan image */}
              <motion.div
                drag
                dragConstraints={{ left: -500, right: 500, top: -350, bottom: 350 }}
                dragElastic={0.08}
                dragMomentum={true}
                className="w-full h-full flex items-center justify-center pointer-events-auto"
              >
                <motion.img 
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  src={lightboxImage} 
                  alt="Craftsmanship High detail" 
                  className="w-[120%] h-[120%] object-contain select-none pointer-events-none pointer-zoom grayscale-[10%]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>

            {/* Extra guide label at bottom */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/[0.06] backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-white/70 text-[10px] uppercase tracking-[2px] font-medium flex items-center gap-3 shadow-2xl pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-bounce">
                <path d="M5 10l7-7 7 7"/>
                <path d="M12 3v18"/>
              </svg>
              <span>Giữ chuột và kéo để soi chi tiết sợi xơ gỗ, khớp nối tre cao cấp</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ product, index, navigate, addToCart, onQuickView, onImageClick }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [coords, setCoords] = useState({ x: 0, y: 0, pctX: 0, pctY: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const isNew = useMemo(() => {
    if (!product.createdAt) return false;
    const createdAtTime = product.createdAt?.seconds ? product.createdAt.seconds * 1000 : (product.createdAt?.toMillis?.() || new Date(product.createdAt).getTime());
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return createdAtTime > sevenDaysAgo;
  }, [product.createdAt]);

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.8, 
        delay: (index % 4) * 0.1,
        ease: [0.215, 0.61, 0.355, 1] 
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
        {/* Subtle, thin colored border that fades in on hover */}
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
            <span className="text-[10px] uppercase font-bold tracking-[2px] text-editorial-text">{product.material}</span>
          </motion.div>
        </div>

        {/* Small, semi-transparent label that overlays on the corner showing the product's primary material when hovered */}
        <div className="absolute bottom-20 left-4 z-20 pointer-events-none transition-all duration-300 opacity-0 group-hover/btn:opacity-100 bg-white/80 backdrop-blur-md border border-editorial-line/15 text-editorial-text text-[9px] uppercase font-semibold tracking-[2px] px-2.5 py-1 rounded-[2px] shadow-sm">
          {product.material || "Tre Tự Nhiên"}
        </div>

        <div className="relative w-full h-full">
          <motion.img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onClick={(e) => { e.stopPropagation(); onImageClick(); }}
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
              onClick={(e) => { e.stopPropagation(); onImageClick(); }}
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

          {/* Interactive Magnifying Glass */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none w-36 h-36 rounded-full border-2 border-white/90 shadow-2xl z-30 overflow-hidden hidden md:block"
              style={{
                left: coords.x - 72,
                top: coords.y - 72,
                backgroundImage: `url(${activeImage})`,
                backgroundPosition: `${coords.pctX * 100}% ${coords.pctY * 100}%`,
                backgroundSize: "250%",
                backgroundRepeat: "no-repeat",
                boxShadow: "0 0 15px rgba(0,0,0,0.35), inset 0 0 15px rgba(0,0,0,0.25)"
              }}
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

        {/* Quick View Trigger */}
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
