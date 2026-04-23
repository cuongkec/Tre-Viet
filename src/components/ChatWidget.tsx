import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, MessageSquare, Phone } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // Social Links (Placeholders)
  const socialLinks = [
    {
      name: "Zalo",
      icon: <MessageSquare size={20} />,
      url: "https://zalo.me/yourid",
      color: "bg-blue-500",
      description: "Chat qua Zalo"
    },
    {
      name: "Messenger",
      icon: <MessageCircle size={20} />,
      url: "https://m.me/yourid",
      color: "bg-blue-600",
      description: "Chat qua Facebook"
    },
    {
      name: "Hotline",
      icon: <Phone size={20} />,
      url: "tel:+842438282212",
      color: "bg-editorial-accent",
      description: "+84 (0) 24 3828 2212"
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 space-y-3 flex flex-col items-end"
          >
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white p-3 shadow-xl border border-editorial-line/10 hover:border-editorial-accent transition-all group"
              >
                <div className="text-right pl-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-text/40">{link.name}</p>
                  <p className="text-xs font-serif italic">{link.description}</p>
                </div>
                <div className={`${link.color} text-white p-2 rounded-full order-last`}>
                  {link.icon}
                </div>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors ${
            isOpen ? "bg-editorial-text text-white" : "bg-editorial-accent text-white"
          }`}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </motion.button>
      </div>
    </div>
  );
}
