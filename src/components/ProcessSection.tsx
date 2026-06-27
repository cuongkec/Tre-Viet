import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Tuyển Chọn Nguyên Liệu",
    desc: "Chỉ những thân tre từ 3-5 năm tuổi, đủ độ già và dẻo dai mới được lựa chọn kỹ lưỡng từ các vùng nguyên liệu sạch."
  },
  {
    number: "02",
    title: "Xử Lý Truyền Thống",
    desc: "Tre được ngâm và hun khói rơm theo kỹ thuật gia truyền để tăng độ bền, chống mối mọt tự nhiên mà không dùng hóa chất."
  },
  {
    number: "03",
    title: "Tạo Hình & Đan Lát",
    desc: "Dưới bàn tay khéo léo của các nghệ nhân, những thanh tre vô tri được tạo hình và đan bện tỉ mỉ thành sản phẩm."
  },
  {
    number: "04",
    title: "Hoàn Thiện Tinh Xảo",
    desc: "Mỗi sản phẩm đều được kiểm tra nghiêm ngặt, mài nhẵn và phủ lớp sơn bảo vệ thực vật trước khi đến tay khách hàng."
  }
];

export default function ProcessSection() {
  return (
    <section id="process" className="py-32 px-6 md:px-[60px] bg-editorial-bg border-t border-editorial-line/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-4 sticky top-40">
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-editorial-accent text-[12px] uppercase tracking-[2px] font-semibold mb-6 block animate-pulse">Our Craft</span>
              <h2 className="text-4xl md:text-5xl font-serif leading-[1.1] mb-8">
                Sự Kiên Nhẫn <br />
                <span className="italic-serif text-editorial-accent">Trong Từng Bước Chân.</span>
              </h2>
              <p className="text-[#666] leading-[1.6] font-light text-[16px] max-w-sm font-['Courier_New']">
                Để tạo ra một sản phẩm nội thất tre cao cấp, chúng tôi không cho phép mình vội vã. Đó là sự kết hợp giữa thời gian, thiên nhiên và lòng kiên nhẫn.
              </p>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.15, duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                  className="editorial-card group"
                >
                  <span className="text-5xl font-serif text-editorial-accent/20 block mb-6 group-hover:text-editorial-accent transition-colors duration-500">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-serif mb-4 group-hover:italic transition-all">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#8a8a8a] leading-relaxed font-light font-['Courier_New']">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Process Ambient Video */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-40 w-full h-[600px] md:h-[700px] relative overflow-hidden group rounded-[4px] border border-editorial-line/10"
      >
        <video 
          src="https://res.cloudinary.com/dqashtrhn/video/upload/v1779901508/video_u1bfgu.mp4"
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover scale-105 transition-transform duration-[3s] group-hover:scale-100"
        >
          Trình duyệt của bạn không hỗ trợ thẻ video.
        </video>
        <div className="absolute inset-0 bg-black/25 transition-colors duration-700 pointer-events-none" />
      </motion.div>
    </section>
  );
}
