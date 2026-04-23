import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activePriceRange, setActivePriceRange] = useState("Tất cả");
  const [activeMaterial, setActiveMaterial] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

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
        // If DB is totally empty, show initial demo products
        setProducts(initialProducts);
      }
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

    return result;
  }, [products, activeCategory, activePriceRange, activeMaterial, searchQuery]);

  return (
    <div className="bg-editorial-bg min-h-screen">
      <Navbar />
      
      <main className="pt-40 pb-20 px-[60px]">
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
            
            <div className="relative w-full md:w-64">
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
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: (index % 4) * 0.1,
                  ease: [0.215, 0.61, 0.355, 1] 
                }}
                className="group cursor-pointer"
              >
                <div 
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="aspect-[3/4] overflow-hidden bg-editorial-muted/10 mb-6 relative group/btn transition-all duration-700 hover:shadow-2xl hover:-translate-y-2"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-[1.2s] ease-out group-hover:scale-125 grayscale-[40%] brightness-95 group-hover:grayscale-0 group-hover:brightness-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-editorial-text/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  {/* Quick View Trigger */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuickViewProduct(product);
                      setIsQuickViewOpen(true);
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
                    className="absolute bottom-0 left-0 w-full bg-editorial-text text-white py-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out text-[10px] uppercase tracking-[3px] font-bold z-10 hover:bg-editorial-accent"
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>
              <div 
                onClick={() => navigate(`/product/${product.id}`)}
                className="flex justify-between items-start"
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
    </div>
  );
}
