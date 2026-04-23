import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";

interface Product {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  image: string;
  category: string;
  material: string;
  description?: string;
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetail: (productId: string) => void;
}

export default function QuickViewModal({ product, isOpen, onClose, onViewDetail }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen, product]);

  const handleAddToCart = () => {
    if (product) {
      const safeQty = isNaN(quantity) || quantity < 1 ? 1 : quantity;
      for (let i = 0; i < safeQty; i++) {
        addToCart(product);
      }
      onClose();
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-20 py-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-editorial-text/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-editorial-bg shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-full"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 hover:bg-editorial-muted/10 rounded-full transition-colors group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Left: Product Image */}
            <div className="md:w-1/2 aspect-[4/5] md:aspect-auto overflow-hidden bg-editorial-muted/10">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover grayscale-[20%] brightness-95"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Right: Product Details */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
              <div className="mb-8 pb-8 border-b border-editorial-line/10">
                <span className="text-editorial-accent text-[10px] uppercase tracking-[4px] font-bold mb-4 block">
                  {product.category}
                </span>
                <h2 className="text-3xl md:text-4xl font-serif mb-4 leading-tight">
                  {product.name}
                </h2>
                <p className="text-xl font-serif text-editorial-text/80">{product.price}</p>
              </div>

              <div className="space-y-8 flex-1">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[3px] font-bold mb-3 opacity-40 italic">Đặc điểm nổi bật</h4>
                  <ul className="text-xs space-y-2 font-light text-[#666]">
                    <li className="flex items-center gap-2">
                       <span className="w-1 h-1 bg-editorial-accent rounded-full" />
                       Chế tác {product.material === "Handcrafted" ? "thủ công bởi nghệ nhân" : "theo quy trình kỹ thuật hiện đại"}
                    </li>
                    <li className="flex items-center gap-2">
                       <span className="w-1 h-1 bg-editorial-accent rounded-full" />
                       Chất liệu tre già 100% tự nhiên bền vững
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-[#666] leading-relaxed font-light line-clamp-4">
                  {product.description || `Mẫu ${product.name} là biểu tượng cho sự giao thoa giữa truyền thống và tinh thần đương đại. Sản phẩm mang lại sự ấm cúng và sang trọng cho không gian.`}
                </p>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6 pt-4">
                  <div className="space-y-2 w-full sm:w-auto">
                    <h4 className="text-[9px] uppercase tracking-[2px] font-bold opacity-40">Số lượng</h4>
                    <div className="flex items-center border border-editorial-line/10 w-full sm:w-28">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 flex items-center justify-center hover:bg-editorial-muted/10 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="flex-1 text-center font-medium text-xs">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-editorial-muted/10 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 w-full bg-editorial-text text-white py-4 px-8 flex items-center justify-center gap-3 uppercase text-[10px] tracking-[3px] font-bold hover:bg-editorial-accent transition-all duration-300"
                  >
                    <ShoppingBag size={16} />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-editorial-line/10 flex items-center justify-between">
                <button
                  onClick={() => onViewDetail(product.id)}
                  className="group flex items-center gap-2 text-[10px] uppercase tracking-[2px] font-bold text-editorial-accent hover:underline"
                >
                  Xem chi tiết đầy đủ 
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-2 opacity-30">
                  <span className="text-[9px] uppercase tracking-[1px] font-bold">In stock</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
