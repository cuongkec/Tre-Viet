import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { Search, Filter, ArrowRight, X, ChevronDown, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Fuse from "fuse.js";
import { collection, query, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import QuickViewModal from "../components/QuickViewModal";
import ProductCard from "../components/ProductCard";
import ProductSkeleton from "../components/ProductSkeleton";

export default function CollectionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["Tất cả", "Seating", "Lighting", "Decor", "Furniture"]);
  const [materials, setMaterials] = useState<string[]>(["Tất cả", "Natural", "Handcrafted", "Processed"]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activePriceRange, setActivePriceRange] = useState("Tất cả");
  const [activeMaterial, setActiveMaterial] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) {
      setSearchQuery(q);
      // Optional: clean up URL after reading so it doesn't stay indefinitely if they clear the search,
      // but usually it's fine to keep it or let user clear via X.
    }
  }, [location.search]);

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Slider refs & dragging state
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Helper to merge and sort products cleanly
  const mergeAndSortProducts = (fetched: any[]) => {
    const merged = [...fetched];

    merged.sort((a, b) => {
      const dateA = a.createdAt?.seconds || a.created_at?.seconds || 
                    (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0) || 0;
      const dateB = b.createdAt?.seconds || b.created_at?.seconds || 
                    (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0) || 0;
      
      return dateB - dateA;       // Newest first (descending order of date)
    });

    return merged;
  };

  // Compute category product counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts["Tất cả"] = products.length;
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  // Center selected category beautifully with a smooth auto-scroll transition
  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setTimeout(() => {
      const slider = sliderRef.current;
      if (!slider) return;
      const button = slider.querySelector(`[data-category="${cat}"]`) as HTMLElement;
      if (button) {
        const sliderWidth = slider.clientWidth;
        const buttonWidth = button.clientWidth;
        const buttonLeft = button.offsetLeft;
        const scrollTarget = buttonLeft - (sliderWidth / 2) + (buttonWidth / 2);
        slider.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  // Load and subscribe to product settings
  useEffect(() => {
    let isMounted = true;
    
    // 1. Immediate Quick Load
    const quickLoad = async () => {
      try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        if (!isMounted) return;
        
        const fetched = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as any[];
        
        const merged = mergeAndSortProducts(fetched);
        setProducts(merged);
        setIsLoading(false);
      } catch (err) {
        console.error("Lỗi getDocs khi tải nhanh:", err);
      }
    };
    
    quickLoad();

    // 2. Real-time Subscription Listener
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      
      const fetched = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as any[];
      
      const merged = mergeAndSortProducts(fetched);
      setProducts(merged);
      setIsLoading(false);
    }, (error) => {
      console.error("Lỗi onSnapshot tải bộ sưu tập:", error);
      if (isMounted) {
        setProducts(prev => prev.length > 0 ? prev : []);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch collections and materials metadata from Firestore
  useEffect(() => {
    let isMounted = true;

    const fetchMetadata = async () => {
      try {
        const qCat = query(collection(db, "categories"));
        const catSnap = await getDocs(qCat);
        if (isMounted) {
          const dbCats = catSnap.docs.map(doc => doc.data().name);
          setCategories(Array.from(new Set(["Tất cả", "Seating", "Lighting", "Decor", "Furniture", ...dbCats])));
        }
      } catch (error) {
        console.error("Lỗi khi tải danh mục từ Firebase:", error);
      }

      try {
        const qMat = query(collection(db, "materials"));
        const matSnap = await getDocs(qMat);
        if (isMounted) {
          const dbMats = matSnap.docs.map(doc => doc.data().name);
          setMaterials(Array.from(new Set(["Tất cả", "Natural", "Handcrafted", "Processed", ...dbMats])));
        }
      } catch (error) {
        console.error("Lỗi khi tải chất liệu từ Firebase:", error);
      }
    };

    fetchMetadata();
    
    return () => {
      isMounted = false;
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
        const dateA = a.createdAt?.seconds || a.created_at?.seconds || 
                      (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0) || 0;
        const dateB = b.createdAt?.seconds || b.created_at?.seconds || 
                      (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0) || 0;
        
        if (dateA === 0 && dateB === 0) return 0;
        if (dateA === 0) return 1;
        if (dateB === 0) return -1;
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
        <div className="max-w-7xl mx-auto mb-16 space-y-8">
          {/* Elegant Category Slider Track */}
          <div className="border-b border-editorial-line/10 pb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[10px] uppercase tracking-[3px] font-bold text-editorial-text opacity-70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-editorial-accent rounded-full animate-pulse" />
                CÁC BỘ SƯU TẬP / COLLECTIONS
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (sliderRef.current) {
                      sliderRef.current.scrollBy({ left: -220, behavior: 'smooth' });
                    }
                  }}
                  className="w-8 h-8 rounded-full border border-editorial-line/20 flex items-center justify-center text-editorial-text hover:border-editorial-accent hover:text-editorial-accent hover:bg-gray-50 transition-all duration-300"
                  aria-label="Previous Category"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (sliderRef.current) {
                      sliderRef.current.scrollBy({ left: 220, behavior: 'smooth' });
                    }
                  }}
                  className="w-8 h-8 rounded-full border border-editorial-line/20 flex items-center justify-center text-editorial-text hover:border-editorial-accent hover:text-editorial-accent hover:bg-gray-50 transition-all duration-300"
                  aria-label="Next Category"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Slider track with custom elements */}
            <div 
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth scrollbar-hide cursor-grab active:cursor-grabbing select-none"
            >
              {categories.map((cat, idx) => {
                const count = categoryCounts[cat] || 0;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    data-category={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex-shrink-0 relative group transition-all duration-300 rounded-[3px] text-left p-4 md:p-5 border ${
                      isActive 
                        ? 'border-editorial-accent bg-editorial-accent/5 shadow-sm md:w-[180px] w-[140px]' 
                        : 'border-editorial-line/10 hover:border-editorial-accent/30 bg-white hover:bg-gray-50/50 md:w-[180px] w-[140px]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                      <span className="font-mono text-[9px] opacity-35 select-none">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold transition-all ${
                        isActive 
                          ? 'bg-editorial-accent text-white' 
                          : 'bg-editorial-text/5 text-editorial-text opacity-40 group-hover:opacity-75'
                      }`}>
                        {count}
                      </span>
                    </div>
                    <span className={`block font-serif text-xs md:text-sm font-medium tracking-tight pr-2 transition-all ${
                      isActive ? 'text-editorial-accent font-bold scale-[1.01]' : 'text-editorial-text group-hover:text-editorial-accent'
                    }`}>
                      {cat}
                    </span>
                    {/* Visual indicator bar */}
                    <span className={`absolute bottom-0 left-0 h-[2px] transition-all duration-300 ${
                      isActive ? 'w-full bg-editorial-accent' : 'w-0 group-hover:w-1/3 bg-editorial-accent/30'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Tool Actions (Sort & Advanced Filter Controls) */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 py-4 border-b border-editorial-line/10">
            <div className="flex gap-4 items-center text-[11px] uppercase tracking-[2px] font-bold opacity-70 w-full md:w-auto">
              <button 
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`flex items-center gap-2 hover:text-editorial-accent transition-colors ${isFilterMenuOpen ? 'text-editorial-accent opacity-100' : ''}`}
              >
                <Filter size={14} /> {isFilterMenuOpen ? 'Đóng bộ lọc nâng cao' : 'Bộ lọc nâng cao'}
              </button>
              {activeCategory !== "Tất cả" && (
                <>
                  <div className="w-px h-4 bg-editorial-line/20" />
                  <span className="text-[10px] normal-case tracking-normal opacity-50 font-normal">
                    Đang lọc: <strong className="font-bold text-editorial-accent uppercase tracking-wider text-[9px]">{activeCategory}</strong>
                  </span>
                </>
              )}
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
                {activeMaterial === "Natural" ? "Tre Tự Nhiên" : activeMaterial === "Handcrafted" ? "Thủ Công" : activeMaterial === "Processed" ? "Tre Kỹ Thuật" : activeMaterial} <X size={10} className="cursor-pointer" onClick={() => setActiveMaterial("Tất cả")} />
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
            Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} index={i} />
            ))
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
              scale: 1.02
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

            {/* Standard Image Area */}
            <div 
              className="relative w-[90vw] h-[70vh] md:w-[80vw] md:h-[75vh] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.4 }}
                src={lightboxImage} 
                alt="Product Full View" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


