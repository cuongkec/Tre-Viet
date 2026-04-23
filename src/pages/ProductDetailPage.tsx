import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, ShoppingBag, Plus, Minus, 
  ChevronRight, Award, ShieldCheck, Truck 
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { initialProducts } from "../constants";

interface Product {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  image: string;
  images?: string[];
  category: string;
  material: string;
  description?: string;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ 
            id: docSnap.id, 
            ...data,
            images: data.images || [data.image]
          } as Product);
        } else {
          // Fallback to initialProducts if not in Firestore
          const fallbackProduct = initialProducts.find(p => p.id === productId);
          if (fallbackProduct) {
            setProduct({
              ...fallbackProduct,
              images: (fallbackProduct as any).images || [fallbackProduct.image]
            } as Product);
          } else {
            console.error("Product not found in Firestore or fallback");
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [productId]);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images || [product.image];
  }, [product]);

  const handleAddToCart = () => {
    if (product) {
      const safeQty = isNaN(quantity) || quantity < 1 ? 1 : quantity;
      for (let i = 0; i < safeQty; i++) {
        addToCart(product);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-editorial-bg">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="font-serif italic text-xl"
        >
          Đang tải tuyệt tác...
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-editorial-bg px-8 text-center">
        <h1 className="text-4xl font-serif mb-6">Sản phẩm không tồn tại</h1>
        <button 
          onClick={() => navigate("/collections")}
          className="flex items-center gap-2 text-editorial-accent uppercase tracking-widest text-xs font-bold hover:underline"
        >
          <ArrowLeft size={16} /> Quay lại bộ sưu tập
        </button>
      </div>
    );
  }

  return (
    <div className="bg-editorial-bg min-h-screen font-sans">
      <Navbar />
      
      <main className="pt-40 pb-32 px-[30px] md:px-[60px] max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-4 text-[10px] uppercase tracking-[2px] opacity-40 mb-16 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button onClick={() => navigate("/")} className="hover:opacity-100 transition-opacity">Trang chủ</button>
          <ChevronRight size={10} />
          <button onClick={() => navigate("/collections")} className="hover:opacity-100 transition-opacity">Bộ sưu tập</button>
          <ChevronRight size={10} />
          <span className="opacity-100 font-bold text-editorial-text">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Image Gallery & Carousel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col-reverse md:flex-row gap-6 h-full"
          >
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto max-h-[100px] md:max-h-[600px] scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 md:w-24 aspect-[4/5] bg-editorial-muted/10 shrink-0 border transition-all duration-300 ${activeImage === idx ? 'border-editorial-accent p-1' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image with Zoom */}
            <div className="flex-1 relative">
              <div 
                className="aspect-[4/5] overflow-hidden bg-editorial-muted/10 relative cursor-crosshair overflow-hidden"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={images[activeImage]} 
                  alt={product.name} 
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                  style={isZoomed ? {
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                  } : {}}
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay Badge */}
                <div className="absolute top-6 left-6 pointer-events-none">
                  <span className="bg-editorial-text text-white px-4 py-2 text-[10px] uppercase tracking-[2px] font-bold">
                    {product.material}
                  </span>
                </div>
                
                {/* Interaction Hint */}
                <div className="absolute bottom-6 right-6 opacity-40 text-[10px] uppercase tracking-widest font-bold pointer-events-none bg-white/20 backdrop-blur-sm px-3 py-1">
                   Di chuột để phóng to
                </div>
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="border-b border-editorial-line/10 pb-10 mb-10">
              <span className="text-editorial-accent text-[12px] uppercase tracking-[4px] font-semibold mb-6 block">
                {product.category}
              </span>
              <h1 className="text-5xl md:text-6xl font-serif mb-6 leading-tight">
                {product.name}
              </h1>
              <p className="text-2xl font-serif text-editorial-text/80">{product.price}</p>
            </div>

            <div className="space-y-10">
              <div>
                <h4 className="text-[10px] uppercase tracking-[3px] font-bold mb-4 opacity-40">Mô tả sản phẩm</h4>
                <p className="text-[#666] leading-relaxed font-light whitespace-pre-line">
                  {product.description || `Mẫu ${product.name} là sự kết hợp hoàn mỹ giữa chất liệu tre tuyển chọn và kỹ thuật ${product.material === "Handcrafted" ? "đan lát thủ công tinh xảo" : "xử lý kỹ thuật hiện đại"}. Mỗi đường nét đều phảng phất hơi thở của thiên nhiên, mang lại vẻ đẹp đương đại nhưng vẫn vô cùng gần gũi cho không gian sống của bạn.`}
                </p>
              </div>

              {product.highlights && product.highlights.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-[3px] font-bold mb-4 opacity-40 italic">Đặc điểm nổi bật</h4>
                  <ul className="space-y-3">
                    {product.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="mt-1.5 w-1 h-1 bg-editorial-accent rounded-full shrink-0" />
                        <span className="text-[#666] text-sm font-light leading-relaxed group-hover:text-editorial-text transition-colors">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-end gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-[3px] font-bold opacity-40">Số lượng</h4>
                  <div className="flex items-center border border-editorial-line/10 w-32">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-editorial-muted/10 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="flex-1 text-center font-medium text-sm">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-editorial-muted/10 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-editorial-text text-white py-5 px-10 flex items-center justify-center gap-4 uppercase text-[12px] tracking-[4px] font-bold hover:bg-editorial-accent transition-all duration-500 group"
                >
                  <ShoppingBag size={18} /> 
                  Thêm vào giỏ hàng
                </button>
              </div>

              {/* USP List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-editorial-line/10">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Award size={24} strokeWidth={1} className="text-editorial-accent" />
                  <span className="text-[9px] uppercase tracking-[1px] font-bold opacity-60">Chất lượng cao cấp</span>
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                  <ShieldCheck size={24} strokeWidth={1} className="text-editorial-accent" />
                  <span className="text-[9px] uppercase tracking-[1px] font-bold opacity-60">Bảo hành 24 tháng</span>
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                  <Truck size={24} strokeWidth={1} className="text-editorial-accent" />
                  <span className="text-[9px] uppercase tracking-[1px] font-bold opacity-60">Giao hàng toàn quốc</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Recommended Section (Simplified for now) */}
      <section className="bg-editorial-muted/5 py-32 px-[60px]">
        <div className="max-w-7xl mx-auto">
          <header className="mb-16 flex justify-between items-end">
             <div>
              <span className="text-editorial-accent text-[12px] uppercase tracking-[4px] font-semibold mb-4 block">You might like</span>
              <h2 className="text-4xl font-serif">Sản phẩm liên quan</h2>
            </div>
            <button 
              onClick={() => navigate("/collections")}
              className="text-[10px] uppercase tracking-[2px] opacity-40 hover:opacity-100 hover:text-editorial-accent transition-all mb-2"
            >
              Xem tất cả
            </button>
          </header>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <p className="col-span-full text-center py-10 font-serif italic opacity-40">Khám phá thêm các thiết kế tuyệt vời khác của Tre Việt.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
