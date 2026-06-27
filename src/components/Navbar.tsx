import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, X, Sprout, Globe } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim() && location.pathname === '/collections') {
      navigate(`/collections?q=${encodeURIComponent(val.trim())}`, { replace: true });
    } else if (!val.trim() && location.pathname === '/collections') {
      navigate(`/collections`, { replace: true });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
      // Don't close search open state immediately to allow typing
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setIsMobileMenuOpen(false); // Auto close mobile menu when browsing/scrolling
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch logo
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepageSettings"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logoImage) {
        setLogoUrl(docSnap.data().logoImage);
        setImageError(false); // reset error state when url changes
      } else {
        setLogoUrl("");
      }
      setLogoLoaded(true);
    }, (error) => {
      console.error("Lỗi khi tải logo từ Firebase:", error);
      setLogoLoaded(true); // fall back to default
    });
    return () => unsub();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: t('nav.collections'), path: "/collections" },
    { name: t('nav.about'), path: "/#about" },
    { name: t('nav.process'), path: "/#process" },
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
          {!logoLoaded ? (
            <div className="h-12 md:h-16 w-32 animate-pulse bg-editorial-muted/10 rounded-md" />
          ) : logoUrl && !imageError ? (
             <img 
               src={logoUrl} 
               alt="KC Cook" 
               className="h-12 md:h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-500" 
               referrerPolicy="no-referrer"
               onError={() => setImageError(true)}
             />
          ) : (
            <>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="text-editorial-accent"
              >
                <Sprout size={28} strokeWidth={2} />
              </motion.div>
              <span className="text-[22px] md:text-[24px] font-serif font-bold tracking-[4px] uppercase text-editorial-accent group-hover:tracking-[6px] transition-all duration-500">
                KC Cook.
              </span>
            </>
          )}
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
            {t('nav.contact')}
          </a>
          
          <div className="flex items-center gap-6 ml-8">
            <button 
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center gap-1 hover:text-editorial-accent transition-colors duration-300 text-[10px] uppercase tracking-widest font-bold"
              aria-label="Toggle Language"
            >
              <Globe size={16} strokeWidth={1.5} />
              <span>{language}</span>
            </button>
            <div className="relative flex items-center">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.form 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onSubmit={handleSearchSubmit}
                    className="absolute right-8 mr-2 overflow-hidden flex items-center bg-white/90 backdrop-blur-sm rounded-full border border-editorial-line/20 px-3 py-1 shadow-sm"
                  >
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder={t('search.placeholder')} 
                      className="w-full bg-transparent outline-none text-[11px] uppercase tracking-[1px] font-medium placeholder:font-light"
                    />
                    <button type="button" onClick={() => setIsSearchOpen(false)} className="ml-2 opacity-50 hover:opacity-100">
                      <X size={14} />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              <button 
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (!isSearchOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }
                }}
                className="hover:text-editorial-accent transition-colors duration-300 z-10 p-1"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
            </div>
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
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 hover:text-editorial-accent transition-colors duration-300 text-[10px] uppercase tracking-widest font-bold"
          >
            <span>{language}</span>
          </button>
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
