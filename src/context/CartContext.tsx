import React, { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "./ToastContext";

export interface Product {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  image: string;
  category: string;
  material?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string, name?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToast } = useToast();

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    addToast(`Đã thêm "${product.name}" vào giỏ hàng`, 'success');
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, name?: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    if (name) {
      addToast(`Đã xóa "${name}" khỏi giỏ hàng`, 'success');
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const item = cart.find(i => i.id === productId);
      removeFromCart(productId, item?.name);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: isNaN(quantity) ? 1 : quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    addToast('Đã làm trống giỏ hàng', 'success');
  };

  const totalItems = cart.reduce((sum, item) => sum + (isNaN(item.quantity) ? 0 : item.quantity), 0);

  const totalPrice = cart.reduce((sum, item) => {
    const price = isNaN(item.priceNum) ? 0 : item.priceNum;
    const qty = isNaN(item.quantity) ? 0 : item.quantity;
    return sum + (price * qty);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
