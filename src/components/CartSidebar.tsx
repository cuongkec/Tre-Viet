import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Plus, Minus, ShoppingBag, ArrowRight, Trash2, 
  AlertTriangle, CreditCard, Landmark, Check
} from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'qr'>('bank');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleClearCart = () => {
    clearCart();
    setShowConfirmClear(false);
  };

  const closeSidebar = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setCheckoutStep('cart');
      setShowConfirmClear(false);
    }, 500);
  };

  const handlePlaceOrder = () => {
    setCheckoutStep('success');
    setTimeout(() => {
      clearCart();
    }, 100);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-[450px] bg-editorial-bg z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-8 py-10 flex justify-between items-center border-b border-editorial-line/10 relative">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} strokeWidth={1.5} />
                <h2 className="text-xl font-serif">
                  {checkoutStep === 'cart' ? 'Giỏ Hàng' : checkoutStep === 'payment' ? 'Thanh Toán' : 'Hoàn Tất'}
                </h2>
              </div>
              
              <div className="flex items-center gap-4">
                {cart.length > 0 && checkoutStep === 'cart' && !showConfirmClear && (
                  <button 
                    onClick={() => setShowConfirmClear(true)}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-editorial-accent transition-all group"
                  >
                    <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                    <span>Xóa tất cả</span>
                  </button>
                )}
                <button 
                  onClick={closeSidebar}
                  className="w-10 h-10 border border-editorial-line/10 flex items-center justify-center hover:bg-editorial-text hover:text-editorial-bg transition-all"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Confirmation Overlay */}
              <AnimatePresence>
                {showConfirmClear && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 bg-[#fdfdfd] z-20 flex items-center justify-between px-8"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={18} className="text-editorial-accent" />
                      <p className="text-xs font-medium uppercase tracking-wider">Xóa toàn bộ giỏ hàng?</p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowConfirmClear(false)}
                        className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={handleClearCart}
                        className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent hover:underline"
                      >
                        Xác nhận xóa
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto relative scrollbar-hide">
              <AnimatePresence mode="wait">
                {checkoutStep === 'cart' && (
                  <motion.div 
                    key="cart"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="px-8 py-6 space-y-8 h-full"
                  >
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <ShoppingBag size={48} strokeWidth={0.5} className="mb-6" />
                        <p className="font-serif italic">Giỏ hàng của bạn đang trống.</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex gap-6 group">
                          <div className="w-24 aspect-[3/4] bg-editorial-muted/10 overflow-hidden shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-serif text-lg leading-tight">{item.name}</h3>
                                <button onClick={() => removeFromCart(item.id)} className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-editorial-accent transition-all">Xóa</button>
                              </div>
                              <p className="text-[10px] uppercase tracking-[2px] opacity-40 mb-4">{item.category}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center border border-editorial-line/10 rounded-[2px]">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-editorial-line/5 transition-all"><Minus size={12} /></button>
                                <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-editorial-line/5 transition-all"><Plus size={12} /></button>
                              </div>
                              <span className="text-sm font-light">{item.price}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {checkoutStep === 'payment' && (
                  <motion.div 
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="px-8 py-10 space-y-8"
                  >
                    <div className="space-y-6">
                      <h3 className="text-[10px] uppercase tracking-[4px] font-bold opacity-40">Chọn phương thức thanh toán</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <button 
                          onClick={() => setPaymentMethod('bank')}
                          className={`p-6 border flex items-center gap-4 transition-all ${paymentMethod === 'bank' ? 'border-editorial-accent bg-white shadow-sm' : 'border-editorial-line/10 opacity-60'}`}
                        >
                          <Landmark size={20} className={paymentMethod === 'bank' ? 'text-editorial-accent' : ''} />
                          <div className="text-left">
                            <p className="text-xs font-bold uppercase tracking-wider">Chuyển khoản ngân hàng</p>
                            <p className="text-[10px] opacity-40 mt-1">Techcombank, Vietcombank...</p>
                          </div>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('qr')}
                          className={`p-6 border flex items-center gap-4 transition-all ${paymentMethod === 'qr' ? 'border-editorial-accent bg-white shadow-sm' : 'border-editorial-line/10 opacity-60'}`}
                        >
                          <CreditCard size={20} className={paymentMethod === 'qr' ? 'text-editorial-accent' : ''} />
                          <div className="text-left">
                            <p className="text-xs font-bold uppercase tracking-wider">Quét mã QR Code</p>
                            <p className="text-[10px] opacity-40 mt-1">Momo, ZaloPay, VNPay...</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="p-8 bg-editorial-muted/5 border border-editorial-line/5 space-y-6">
                      {paymentMethod === 'bank' ? (
                        <div className="space-y-4">
                          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Thông tin tài khoản</p>
                          <div className="space-y-2">
                             <div className="flex justify-between text-xs">
                               <span className="opacity-40">Ngân hàng:</span>
                               <span className="font-bold">TECHCOMBANK</span>
                             </div>
                             <div className="flex justify-between text-xs">
                               <span className="opacity-40">Chủ tài khoản:</span>
                               <span className="font-bold uppercase">CÔNG TY TRE VIỆT</span>
                             </div>
                             <div className="flex justify-between text-xs">
                               <span className="opacity-40">Số tài khoản:</span>
                               <span className="font-bold tracking-wider">1903 4567 8901 234</span>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                           <div className="w-48 h-48 bg-white p-4 border border-editorial-line/10 group relative">
                              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tre-viet-checkout" alt="Payment QR" className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700" />
                              <div className="absolute inset-0 border-[2px] border-editorial-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                           <p className="text-[10px] uppercase tracking-widest opacity-40 text-center">Quét mã để thanh toán ngay</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] italic opacity-40 text-center uppercase tracking-widest">
                         Vui lòng nhập mã đơn hàng trong nội dung chuyển khoản.
                       </p>
                    </div>
                  </motion.div>
                )}

                {checkoutStep === 'success' && (
                   <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center px-10"
                   >
                     <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100">
                        <Check size={32} className="text-green-500" />
                     </div>
                     <h3 className="text-2xl font-serif mb-4">Đơn hàng thành công</h3>
                     <p className="text-xs opacity-60 leading-relaxed mb-12">
                       Cảm ơn bạn đã tin tưởng Tre Việt. Chúng tôi sẽ sớm liên hệ để xác nhận đơn hàng của bạn.
                     </p>
                     <button 
                       onClick={closeSidebar}
                       className="px-12 py-4 border border-editorial-text text-[10px] uppercase tracking-[3px] font-bold hover:bg-editorial-text hover:text-white transition-all"
                     >
                       Tiếp tục tham quan
                     </button>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {cart.length > 0 && checkoutStep !== 'success' && (
              <div className="p-8 border-t border-editorial-line/10 bg-editorial-bg">
                <div className="flex justify-between items-end mb-8">
                  <span className="text-[10px] uppercase tracking-[4px] opacity-40">Tổng cộng</span>
                  <span className="text-2xl font-serif">{formatPrice(totalPrice)}</span>
                </div>
                
                {checkoutStep === 'cart' ? (
                  <button 
                    onClick={() => setCheckoutStep('payment')}
                    className="w-full py-5 bg-editorial-text text-white text-[12px] uppercase tracking-[4px] font-bold hover:bg-editorial-accent transition-all duration-500 flex items-center justify-center gap-4 group"
                  >
                    Tiến Hành Thanh Toán <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setCheckoutStep('cart')}
                      className="px-6 py-5 border border-editorial-line/10 hover:bg-white text-[10px] uppercase tracking-widest font-bold transition-all"
                    >
                      Quay lại
                    </button>
                    <button 
                      onClick={handlePlaceOrder}
                      className="flex-1 py-5 bg-editorial-accent text-white text-[12px] uppercase tracking-[4px] font-bold hover:bg-editorial-text transition-all duration-500 flex items-center justify-center gap-4 group"
                    >
                      Xác nhận đã thanh toán
                    </button>
                  </div>
                )}
                
                {checkoutStep === 'cart' && (
                  <button 
                    onClick={closeSidebar}
                    className="w-full py-4 text-[10px] uppercase tracking-[2px] opacity-40 hover:opacity-100 transition-all text-center mt-4"
                  >
                    Tiếp tục mua sắm
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

