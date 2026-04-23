import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Search, ShoppingBag, X, Sprout } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Bộ Sưu Tập", path: "/collections" },
    { name: "Về Chúng Tôi", path: "/#about" },
    { name: "Quy Trình", path: "/#process" },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full z-50 px-6 md:px-[60px] transition-all duration-500 flex justify-between items-center ${
          isScrolled 
            ? "py-4 bg-white/90 backdrop-blur-md shadow-sm text-editorial-text" 
            : "py-10 bg-transparent text-editorial-text"
        }`}
      >
        <Link to="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="text-editorial-accent"
          >
            <Sprout size={28} strokeWidth={2} />
          </motion.div>
          <span className="text-[22px] md:text-[24px] font-serif font-bold tracking-[4px] uppercase text-editorial-accent group-hover:tracking-[6px] transition-all duration-500">
            Tre Việt.
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-[40px] items-center">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.path} 
              className="relative py-2 text-[11px] uppercase tracking-[2px] font-medium group"
            >
              <span className="group-hover:text-editorial-accent transition-colors duration-300">{link.name}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-editorial-accent transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
          
          <a href="/#contact" className="ml-4 px-6 py-2 bg-editorial-text text-white rounded-full text-[10px] uppercase tracking-[2px] font-bold hover:bg-editorial-accent transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-black/5 hover:shadow-editorial-accent/20">
            Liên Hệ
          </a>
          
          <div className="flex items-center gap-6 ml-8">
            <button className="hover:text-editorial-accent transition-colors duration-300">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="hover:text-editorial-accent transition-colors duration-300 relative group"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-editorial-accent text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-in zoom-in duration-300">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Buttons */}
        <div className="flex md:hidden items-center gap-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-editorial-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="hover:opacity-70 transition-opacity"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[49] bg-white pt-32 px-10 flex flex-col gap-8 md:hidden"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                href={link.path}
                className="text-2xl font-serif border-b border-editorial-line/10 pb-4 flex justify-between items-center group"
              >
                <span>{link.name}</span>
                <span className="text-editorial-accent opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </motion.a>
            ))}
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              href="/#contact"
              className="mt-4 bg-editorial-text text-white py-5 flex items-center justify-center rounded-xl text-xs uppercase tracking-[4px] font-bold"
            >
              Liên Hệ Ngay
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
