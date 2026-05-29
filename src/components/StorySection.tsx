import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function AboutSection() {
  const [storyImage, setStoryImage] = useState("https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=1974&auto=format&fit=crop");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepageSettings"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().storyImage) {
        setStoryImage(docSnap.data().storyImage);
      }
    });
    return () => unsub();
  }, []);

  return (
    <section id="about" className="py-32 px-6 md:px-[60px] bg-editorial-bg overflow-hidden border-t border-editorial-line/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        <div className="lg:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={storyImage}
              alt="Artisanal Process"
              className="w-full h-auto rounded-[2px] shadow-sm border border-editorial-muted/30"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <div className="absolute -bottom-10 -right-10 hidden xl:block">
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="relative w-48 h-48 border border-editorial-accent/20 rounded-full flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                 <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                  <path id="circlePath" fill="none" d="M 10, 50 a 40,40 0 1,1 80,0 40,40 0 1,1 -80,0" />
                  <text className="text-[10px] uppercase tracking-[0.2em] font-medium fill-editorial-accent">
                    <textPath xlinkHref="#circlePath">
                      Tinh hoa bếp Việt • Sản Xuất Bền Vững • Nghệ Thuật Đương Đại • 
                    </textPath>
                  </text>
                 </svg>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-1 hidden lg:block" />

        <div className="lg:col-span-6">
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-editorial-accent text-[12px] uppercase tracking-[2px] font-semibold mb-6 block">Kế thừa & Sáng tạo</span>
              <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-8">
                Từ lũy tre làng đến <br />
                <span className="italic-serif text-editorial-accent">những kiệt tác nội thất.</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 text-[#666] leading-[1.6] font-light text-[16px]"
            >
              <p>
                Tre không chỉ là một loài cây, nó là biểu tượng của sự bền bỉ, dẻo dai và thanh cao trong văn hóa Việt. 
                Tại KC Cook, chúng tôi tôn vinh giá trị văn hóa này bằng cách thổi hồn vào từng thanh tre, biến chúng thành những tác phẩm nghệ thuật có giá trị sử dụng cao.
              </p>
              <p>
                Quy trình xử lý nghiêm ngặt kết hợp giữa kỹ thuật hun khói truyền thống và công nghệ hiện đại giúp sản phẩm 
                đạt độ bền vượt trội, chống mối mọt nhưng vẫn giữ trọn màu sắc tự nhiên và mùi thơm dịu nhẹ của tre già.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 grid grid-cols-2 gap-8 border-t border-editorial-line pt-10"
            >
              <div>
                <span className="text-3xl font-serif block mb-2 text-editorial-text hover:text-editorial-accent transition-colors duration-500">100%</span>
                <p className="text-[10px] uppercase tracking-[2px] opacity-60">Nguyên liệu tự nhiên</p>
              </div>
              <div>
                <span className="text-3xl font-serif block mb-2 text-editorial-text hover:text-editorial-accent transition-colors duration-500">20+</span>
                <p className="text-[10px] uppercase tracking-[2px] opacity-60">Nghệ nhân tâm huyết</p>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
