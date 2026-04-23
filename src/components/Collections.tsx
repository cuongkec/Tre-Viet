import { motion } from "motion/react";
import { Link } from "react-router-dom";

const collections = [
  {
    title: "Bàn Ghế Phòng Khách",
    category: "Living Room",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1000&q=80",
    link: "/collections"
  },
  {
    title: "Đèn Trang Trí Thủ Công",
    category: "Lighting",
    image: "https://images.unsplash.com/photo-1513519247388-19345ed5d467?auto=format&fit=crop&w=1000&q=80",
    link: "/collections"
  },
  {
    title: "Phụ Kiện Nhà Bếp",
    category: "Kitchen & Dining",
    image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80",
    link: "/collections"
  }
];

export default function Collections() {
  return (
    <section id="collections" className="py-32 px-[60px] bg-editorial-bg">
      <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
        <div className="max-w-2xl">
          <span className="text-editorial-accent text-[12px] uppercase tracking-[2px] font-semibold mb-4 block">Our Collections</span>
          <h2 className="text-4xl md:text-5xl font-serif leading-tight">
            Khi vật liệu truyền thống <br />
            <span className="italic-serif text-editorial-accent">giao thoa cùng hơi thở mới.</span>
          </h2>
        </div>
        <Link to="/collections" className="border-b border-editorial-text pb-2 hover:text-editorial-accent hover:border-editorial-accent transition-all text-[12px] uppercase tracking-[2px] font-semibold">
          Xem tất cả sản phẩm
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {collections.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
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
