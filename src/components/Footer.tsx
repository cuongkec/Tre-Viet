import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, ArrowUp, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1a1a1a] text-white pt-32 pb-16 px-6 md:px-[60px] font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-20 gap-y-16 mb-24">
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-10">
              <span className="text-3xl font-serif tracking-[6px] uppercase font-bold text-editorial-accent">Tre Việt.</span>
            </Link>
            <p className="text-[#888] text-[15px] leading-[1.8] mb-10 max-w-sm font-light">
              Khám phá tinh hoa kiến trúc từ chất liệu Tre. Chúng tôi kết nối giá trị cộng đồng thông qua những sản phẩm nội thất bền vững và đầy tính bản sắc.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#666] text-sm">
                <MapPin size={16} className="text-editorial-accent" />
                <span>Số 123, Đường Tre, Hà Nội, Việt Nam</span>
              </div>
              <div className="flex items-center gap-3 text-[#666] text-sm">
                <Phone size={16} className="text-editorial-accent" />
                <span>+84 (0) 90 123 4567</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h4 className="text-[11px] uppercase tracking-[4px] font-bold mb-10 text-editorial-accent opacity-80">Bộ sưu tập</h4>
            <ul className="space-y-6 text-[14px]">
              <li><Link to="/collections" className="text-[#888] hover:text-white transition-colors duration-300">Nội Thất Phòng Khách</Link></li>
              <li><Link to="/collections" className="text-[#888] hover:text-white transition-colors duration-300">Đèn Trang Trí</Link></li>
              <li><Link to="/collections" className="text-[#888] hover:text-white transition-colors duration-300">Phụ Kiện Thủ Công</Link></li>
              <li><Link to="/collections" className="text-[#888] hover:text-white transition-colors duration-300">Tre Kỹ Thuật (Processed)</Link></li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h4 className="text-[11px] uppercase tracking-[4px] font-bold mb-10 text-editorial-accent opacity-80">Thông tin</h4>
            <ul className="space-y-6 text-[14px]">
              <li><a href="/#about" className="text-[#888] hover:text-white transition-colors duration-300">Về Chúng Tôi</a></li>
              <li><a href="/#process" className="text-[#888] hover:text-white transition-colors duration-300">Quy Trình Crafting</a></li>
              <li><a href="#" className="text-[#888] hover:text-white transition-colors duration-300">Chuyện Của Tre</a></li>
              <li><a href="#" className="text-[#888] hover:text-white transition-colors duration-300">Tin Tức & Sự Kiện</a></li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h4 className="text-[11px] uppercase tracking-[4px] font-bold mb-10 text-editorial-accent opacity-80">Newsletter</h4>
            <p className="text-[14px] text-[#888] mb-8 font-light leading-relaxed">
              Nhận thông tin về các bộ sưu tập mới nhất và ưu đãi đặc quyền.
            </p>
            <form className="relative group">
              <input 
                type="email" 
                placeholder="Địa chỉ Email" 
                className="bg-transparent border-b border-[#333] py-4 outline-none text-[14px] w-full pr-12 focus:border-editorial-accent transition-all duration-500 placeholder:text-[#333] group-hover:border-[#444]"
              />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-editorial-accent transition-colors">
                <Mail size={20} />
              </button>
            </form>
            <div className="flex gap-6 mt-12">
              <a href="#" className="text-[#666] hover:text-white transition-all transform hover:-translate-y-1">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-[#666] hover:text-white transition-all transform hover:-translate-y-1">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-[#666] hover:text-white transition-all transform hover:-translate-y-1">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center border-t border-[#333]/30 pt-16 gap-12">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <span className="text-[11px] uppercase tracking-[3px] text-[#444]">
              © 2024 TRE VIỆT INTERIOR
            </span>
            <div className="flex gap-10 text-[11px] uppercase tracking-[2px] text-[#444]">
              <a href="#" className="hover:text-[#888] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#888] transition-colors">Terms of Service</a>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <Link to="/admin" className="text-[11px] uppercase tracking-[3px] text-[#444] hover:text-editorial-accent transition-colors font-bold">
              Admin Access
            </Link>
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-4 group"
            >
              <span className="text-[11px] uppercase tracking-[3px] text-[#444] group-hover:text-white transition-colors">Back to Top</span>
              <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center group-hover:border-editorial-accent group-hover:bg-editorial-accent transition-all duration-500">
                <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
