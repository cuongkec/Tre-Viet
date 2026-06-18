import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

const defaultCollections = [
  {
    title: "Bàn Ghế Phòng Khách",
    id: "livingRoom",
    category: "Living Room",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1000&q=80",
    link: "/collections"
  },
  {
    title: "Đèn Trang Trí Thủ Công",
    id: "lighting",
    category: "Lighting",
    image: "https://images.unsplash.com/photo-1513519247388-19345ed5d467?auto=format&fit=crop&w=1000&q=80",
    link: "/collections"
  },
  {
    title: "Phụ Kiện Nhà Bếp",
    id: "kitchen",
    category: "Kitchen & Dining",
    image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80",
    link: "/collections"
  }
];

export default function Collections() {
  const [collections, setCollections] = useState(defaultCollections);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepageSettings"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.collections) {
          setCollections(prev => prev.map(c => ({
            ...c,
            image: data.collections[c.id] || c.image
          })));
        }
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);
  return (
    <section id="collections" className="py-32 px-6 md:px-[60px] bg-editorial-bg">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8"
      >
        <div className="max-w-2xl">
          <span className="text-editorial-accent text-[12px] uppercase tracking-[2px] font-semibold mb-4 block animate-pulse">BỘ SƯU TẬP</span>
          <h2 className="text-4xl md:text-5xl font-serif leading-tight">
            Khi vật liệu truyền thống <br />
            <span className="italic-serif text-editorial-accent">giao thoa cùng hơi thở mới.</span>
          </h2>
        </div>
        <Link to="/collections" className="border-b border-editorial-text pb-2 hover:text-editorial-accent hover:border-editorial-accent transition-all text-[12px] uppercase tracking-[2px] font-semibold hover:translate-x-1 transition-transform">
          Xem tất cả sản phẩm
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {isLoading 
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-4">
                <div className="aspect-[4/5] bg-editorial-muted/20 animate-pulse rounded-sm" />
                <div className="h-5 bg-editorial-muted/20 animate-pulse rounded w-2/3" />
                <div className="h-3 bg-editorial-muted/20 animate-pulse rounded w-1/2" />
              </div>
            ))
          : collections.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 45 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="group cursor-pointer editorial-card"
          >
            <div className="overflow-hidden mb-6 aspect-[4/5] bg-editorial-muted/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[18px] font-serif group-hover:italic transition-all mb-1">{item.title}</h3>
              <p className="text-[11px] text-[#8a8a8a] uppercase tracking-[1px]">{item.category} • {index % 2 === 0 ? 'Tự nhiên' : 'Thủ công'}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
