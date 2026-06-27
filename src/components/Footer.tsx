import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, ArrowUp, Sprout } from "lucide-react";
import { motion } from "motion/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState("");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepageSettings"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logoImage) {
        setLogoUrl(docSnap.data().logoImage);
        setImageError(false);
      } else {
        setLogoUrl("");
      }
      setLogoLoaded(true);
    }, (error) => {
      console.error("Lỗi tải logo từ Firebase ở Footer:", error);
      setLogoLoaded(true);
    });
    return () => unsub();
  }, []);

  return (
    <footer className="bg-editorial-bg text-editorial-text border-t border-editorial-line/20 pt-24 pb-12 px-8 md:px-16 font-sans antialiased text-[13px] md:text-[14px]">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-24">
          
          {/* Left Column: Logo & Main Text */}
          <div className="lg:col-span-3">
            <Link to="/" className="inline-block mb-10 group flex items-center gap-2">
              {!logoLoaded ? (
                <div className="h-24 w-40 animate-pulse bg-editorial-text/10 rounded-md" />
              ) : logoUrl && !imageError ? (
                <img 
                  src={logoUrl} 
                  alt="KC Cook" 
                  className="h-[5.5rem] md:h-24 w-auto object-contain group-hover:scale-105 transition-transform duration-500" 
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
                    <Sprout size={32} strokeWidth={2} />
                  </motion.div>
                  <span className="text-[28px] font-serif font-bold tracking-[4px] uppercase text-editorial-accent group-hover:tracking-[6px] transition-all duration-500">
                    KC Cook.
                  </span>
                </>
              )}
            </Link>
            <p className="text-editorial-text/80 leading-relaxed mb-6 font-light pe-4">
              Với hơn 10 năm kinh nghiệm, KC Cook cộng tác cùng khách hàng kiến tạo nên những không gian sống bằng nghệ thuật thủ công tinh xảo, chất liệu bền vững và sự sáng tạo không giới hạn.
            </p>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Right Columns: Regions / Categories */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Column 1 */}
              <div>
                <h4 className="text-[10px] uppercase tracking-[1px] text-editorial-text/50 mb-6 font-bold">Nội Thất Khách</h4>
                <ul className="space-y-4 font-serif text-[17px]">
                  {["Sofa Mây Tre", "Tủ Trang Trí", "Ghế Bành"].map((item) => (
                    <li key={item}>
                      <Link to="/collections" className="group flex items-center">
                        <motion.span whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="inline-block text-editorial-text/80 group-hover:text-editorial-accent">
                          {item}
                        </motion.span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2 */}
              <div>
                <h4 className="text-[10px] uppercase tracking-[1px] text-editorial-text/50 mb-6 font-bold">Nội Thất Ăn</h4>
                <ul className="space-y-4 font-serif text-[17px]">
                  {["Thớt tre", "Đũa tre"].map((item) => (
                    <li key={item}>
                      <Link to="/collections" className="group flex items-center">
                        <motion.span whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="inline-block text-editorial-text/80 group-hover:text-editorial-accent">
                          {item}
                        </motion.span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3 */}
              <div>
                <h4 className="text-[10px] uppercase tracking-[1px] text-editorial-text/50 mb-6 font-bold">Đèn Trang Trí</h4>
                <ul className="space-y-4 font-serif text-[17px]">
                  {["Đèn Trần", "Đèn Bàn"].map((item) => (
                    <li key={item}>
                      <Link to="/collections" className="group flex items-center">
                        <motion.span whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="inline-block text-editorial-text/80 group-hover:text-editorial-accent">
                          {item}
                        </motion.span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4 */}
              <div>
                <h4 className="text-[10px] uppercase tracking-[1px] text-editorial-text/50 mb-6 font-bold">Follow Us</h4>
                <ul className="space-y-4 font-serif text-[17px]">
                  <li>
                    <a href="#" className="group flex items-center">
                      <motion.div whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="flex items-center gap-2 text-editorial-text/80 group-hover:text-editorial-accent">
                        <Instagram size={14} /> <span>Instagram</span>
                      </motion.div>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.facebook.com/trevua" className="group flex items-center">
                      <motion.div whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="flex items-center gap-2 text-editorial-text/80 group-hover:text-editorial-accent">
                        <Facebook size={14} /> <span>Facebook</span>
                      </motion.div>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="group flex items-center">
                      <motion.div whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="flex items-center gap-2 text-editorial-text/80 group-hover:text-editorial-accent">
                        <Youtube size={14} /> <span>Youtube</span>
                      </motion.div>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 relative border-t border-editorial-line/20 pt-8 mt-12">
          <div className="text-[10px] uppercase tracking-[1px] text-editorial-text/50 flex flex-wrap gap-x-2 gap-y-4 max-w-4xl">
            <span>COPYRIGHT © {(new Date()).getFullYear()} CUONGEMINI. ALL RIGHTS RESERVED</span>
            <span className="hidden md:inline">|</span>
            <a href="https://cuongemini.com" className="hover:text-editorial-accent transition-colors">PRIVACY POLICY</a>
            <span className="hidden md:inline">|</span>
            <span>THIS SITE IS PROTECTED BY RECAPTCHA AND THE GOOGLE PRIVACY POLICY AND TERMS OF SERVICE APPLY.</span>
            <span className="hidden md:inline">|</span>
            <Link to="/admin" className="hover:text-editorial-accent font-bold transition-colors">ADMIN ACCESS</Link>
          </div>

          <button 
            onClick={scrollToTop}
            className="w-[50px] h-[50px] rounded-full border border-editorial-line/40 flex items-center justify-center hover:bg-editorial-text hover:text-white transition-all duration-300 absolute -bottom-4 right-0"
            aria-label="Back to top"
          >
            <ArrowUp size={20} className="font-light" />
          </button>
        </div>
      </div>
    </footer>
  );
}
