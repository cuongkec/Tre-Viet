import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Edit2, Trash2, Save, X, 
  LogIn, LogOut, Package, Image as ImageIcon, 
  Tag, Briefcase, DollarSign, AlertCircle, CheckCircle,
  Upload, Loader, Settings, Grid, FileText
} from "lucide-react";
import { 
  collection, query, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, 
  serverTimestamp, getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth, storage, loginWithGoogle, logout } from "../lib/firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface Product {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  image: string;
  images?: string[];
  category: string;
  material: string;
  description?: string;
  highlights?: string[];
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newMatValue, setNewMatValue] = useState("Handcrafted");
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'metadata' | 'inquiries' | 'media'>('products');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [materials, setMaterials] = useState<{id: string, name: string, value: string}[]>([]);

  // Function to upload to Cloudinary (Alternative Storage)
  const uploadToCloudinary = async (file: File) => {
    const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    // Only attempt if Cloudinary is configured
    if (!cloudName || !uploadPreset) {
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Cloudinary upload failed");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (e) {
      console.error("Cloudinary error:", e);
      throw e;
    }
  };
  const [newCatName, setNewCatName] = useState("");
  const [newMatName, setNewMatName] = useState("");
  const [editingMetadata, setEditingMetadata] = useState<{id: string, name: string, type: 'category' | 'material'} | null>(null);
  const [editMetaValue, setEditMetaValue] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    priceNum: 0,
    image: "",
    images: [] as string[],
    category: "Bàn Ghế",
    material: "Handcrafted",
    description: "",
    highlights: "" // Using string for textarea, will split to array on save
  });

  const standardCategories = ["Bàn Ghế", "Đèn Trang Trí", "Phụ Kiện", "Nội Thất"];
  const standardMaterials = ["Natural", "Handcrafted", "Processed"];

  const mediaGallery = useMemo(() => {
    // Collect unique images from products
    const images = products.map(p => p.image).filter((img, index, self) => self.indexOf(img) === index);
    return images;
  }, [products]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        comparison = a.priceNum - b.priceNum;
      } else if (sortBy === 'date') {
        const dateA = (a as any).createdAt?.seconds || 0;
        const dateB = (b as any).createdAt?.seconds || 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [products, sortBy, sortOrder]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          setIsAdmin(adminDoc.exists());
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(prods);
    }, (error) => {
      console.error("Error listening to products:", error);
      setStatus({ type: 'error', msg: "Không thể tải danh sách sản phẩm. Vui lòng kiểm tra quyền truy cập." });
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    const unsubMats = onSnapshot(collection(db, "materials"), (snap) => {
      setMaterials(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name, value: doc.data().value })));
    });

    const unsubInquiries = onSnapshot(query(collection(db, "inquiries")), (snap) => {
      setInquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubCats();
      unsubMats();
      unsubInquiries();
    };
  }, [isAdmin]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addDoc(collection(db, "categories"), { name: newCatName.trim() });
      setNewCatName("");
      setStatus({ type: 'success', msg: "Đã thêm danh mục mới" });
    } catch (error) {
      setStatus({ type: 'error', msg: "Không thể thêm danh mục" });
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;
    try {
      await addDoc(collection(db, "materials"), { name: newMatName.trim(), value: newMatValue });
      setNewMatName("");
      setStatus({ type: 'success', msg: "Đã thêm chất liệu mới" });
    } catch (error) {
      setStatus({ type: 'error', msg: "Không thể thêm chất liệu" });
    }
  };

  const deleteMetadata = async (col: string, id: string) => {
    if (!confirm("Xác nhận xóa? Bạn không thể hoàn tác hành động này.")) return;
    setStatus({ type: 'success', msg: "Đang xóa..." });
    try {
      await deleteDoc(doc(db, col, id));
      setStatus({ type: 'success', msg: "Đã xóa thành công" });
      setTimeout(() => setStatus(null), 3000);
    } catch (error: any) {
      console.error(`Error deleting from ${col}:`, error);
      setStatus({ 
        type: 'error', 
        msg: `Lỗi khi xóa: ${error.message || 'Thiếu quyền truy cập hoặc lỗi kết nối'}` 
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    
    // Validate inputs
    if (!formData.name.trim()) {
      setStatus({ type: 'error', msg: "Vui lòng nhập tên sản phẩm" });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (formData.priceNum <= 0) {
      setStatus({ type: 'error', msg: "Vui lòng nhập giá sản phẩm hợp lệ" });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setUploading(true);
    setStatus(null);
    
    try {
      let imageUrl = formData.image;
      let gallery = [...(formData.images || [])];

      // Handle Multiple File Uploads
      if (selectedFiles.length > 0) {
        try {
          const uploadPromises = selectedFiles.map(async (file) => {
            // Priority: Cloudinary if configured
            const cloudinaryUrl = await uploadToCloudinary(file);
            if (cloudinaryUrl) return cloudinaryUrl;

            // Fallback: Firebase Storage
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeName}`;
            const fileRef = ref(storage, `products/${fileName}`);
            const metadata = { contentType: file.type };
            const uploadResult = await uploadBytes(fileRef, file, metadata);
            return await getDownloadURL(uploadResult.ref);
          });
          
          const uploadedUrls = await Promise.all(uploadPromises);
          
          if (!imageUrl && uploadedUrls.length > 0) {
            imageUrl = uploadedUrls[0];
          }
          
          gallery = [...gallery, ...uploadedUrls];
        } catch (uploadError: any) {
          console.error("Storage upload error:", uploadError);
          let errorMsg = "Lỗi khi tải ảnh lên hệ thống.";
          
          if (uploadError.message?.includes("Cloudinary configuration missing")) {
              errorMsg = "Lỗi: Cloudinary chưa được cấu hình. Vui lòng kiểm tra Firebase Storage quota hoặc cấu hình Cloudinary.";
          } else if (uploadError.code === 'storage/unauthorized') {
            errorMsg = "Lỗi: Không có quyền truy cập bộ nhớ Firebase. Vui lòng kiểm tra cấu hình Firebase Storage.";
          } else if (uploadError.code === 'storage/quota-exceeded' || uploadError.message?.includes("quota")) {
            errorMsg = "Lỗi: Đã hết hạn mức dung lượng miễn phí. Vui lòng sử dụng Cloudinary (khuyên dùng) hoặc nâng cấp gói Firebase.";
          }
          throw new Error(errorMsg);
        }
      }

      if (!imageUrl && !formData.image) {
        throw new Error("Vui lòng cung cấp ít nhất một hình ảnh (tải lên hoặc URL).");
      }

      const productData = {
        name: formData.name.trim(),
        priceNum: formData.priceNum,
        image: imageUrl || formData.image,
        images: gallery.length > 0 ? gallery : [imageUrl || formData.image],
        category: formData.category,
        material: formData.material,
        description: formData.description.trim(),
        highlights: formData.highlights.split('\n').map(h => h.trim()).filter(h => h !== ""),
        price: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.priceNum),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setStatus({ type: 'success', msg: "Cập nhật sản phẩm thành công" });
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp()
        });
        setStatus({ type: 'success', msg: "Thêm sản phẩm thành công" });
      }
      resetForm();
    } catch (error: any) {
      console.error("Save error details:", error);
      setStatus({ 
        type: 'error', 
        msg: error.message || "Đã xảy ra lỗi khi lưu sản phẩm. Vui lòng thử lại sau." 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setStatus({ type: 'success', msg: "Đã xóa sản phẩm" });
    } catch (error) {
      setStatus({ type: 'error', msg: "Không thể xóa sản phẩm" });
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      priceNum: product.priceNum,
      image: product.image,
      images: product.images || [product.image],
      category: product.category,
      material: product.material,
      description: product.description || "",
      highlights: (product.highlights || []).join('\n')
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setIsAdding(false);
    setUploading(false); // Ensure UI is unlocked
    setEditingId(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFormData({
      name: "",
      priceNum: 0,
      image: "",
      images: [] as string[],
      category: "Bàn Ghế",
      material: "Handcrafted",
      description: "",
      highlights: ""
    });
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePreview = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        image: prev.image === prev.images[index] ? (newImages[0] || "") : prev.image
      };
    });
  };

  const handleUpdateMetadata = async () => {
    if (!editingMetadata || !editMetaValue.trim()) return;
    try {
      const col = editingMetadata.type === 'category' ? 'categories' : 'materials';
      await updateDoc(doc(db, col, editingMetadata.id), { name: editMetaValue.trim() });
      setEditingMetadata(null);
      setEditMetaValue("");
      setStatus({ type: 'success', msg: "Đã cập nhật thành công" });
    } catch (error) {
      setStatus({ type: 'error', msg: "Lỗi khi cập nhật" });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif italic">Đang tải...</div>;

  return (
    <div className="bg-editorial-bg min-h-screen">
      <Navbar />
      
      <main className="pt-40 pb-20 px-[60px] max-w-7xl mx-auto">
        {!isAdmin ? (
          <div className="text-center py-20">
            <h1 className="text-4xl font-serif mb-8">Admin Dashboard</h1>
            <p className="text-[#666] mb-12 max-w-md mx-auto">
              Khu vực này chỉ dành cho quản trị viên. Vui lòng đăng nhập bằng tài khoản được cấp quyền.
            </p>
            {user ? (
              <div className="space-y-4">
                <p className="text-sm text-editorial-accent font-bold uppercase tracking-widest">
                   Tài khoản {user.email} không có quyền truy cập.
                </p>
                <button onClick={logout} className="px-8 py-3 border border-editorial-text hover:bg-editorial-text hover:text-white transition-all uppercase text-[10px] tracking-[2px] font-bold">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-4 mx-auto px-10 py-5 bg-editorial-text text-white hover:bg-editorial-accent transition-all duration-500 uppercase text-[12px] tracking-[4px] font-bold"
              >
                <LogIn size={18} /> Đăng nhập bằng Google
              </button>
            )}
            
            {/* Note about bootstrapping */}
            <div className="mt-20 p-6 border border-dashed border-editorial-line/20 max-w-2xl mx-auto text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-editorial-accent" /> Hướng dẫn cấp quyền admin
              </h3>
              <ol className="text-xs space-y-2 opacity-60 list-decimal pl-4">
                <li>Truy cập Firebase Console {">"} Firestore Database.</li>
                <li><strong>QUAN TRỌNG:</strong> Chọn Database ID là <code className="bg-editorial-muted/20 px-1">ai-studio-e79067d6-90a8-46cb-8e51-927239a1f300</code> thay vì <code>(default)</code>.</li>
                <li>Tạo collection có tên là <code>admins</code>.</li>
                <li>Thêm một document với ID là <strong>UID</strong> tài khoản của bạn.</li>
                <li>UID của bạn hiện tại: <code className="bg-editorial-muted/20 px-1">{user?.uid || "(Đăng nhập để xem UID)"}</code></li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-editorial-line/10 pb-10">
              <div>
                <span className="text-editorial-accent text-[12px] uppercase tracking-[4px] font-semibold mb-4 block">Store Management</span>
                <h1 className="text-5xl font-serif">Quản Lý Danh Mục</h1>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="px-8 py-4 bg-editorial-text text-white hover:bg-editorial-accent transition-all flex items-center gap-3 uppercase text-[10px] tracking-[4px] font-bold"
                >
                  {isAdding ? <X size={16} /> : <Plus size={16} />}
                  {isAdding ? "Hủy" : "Thêm Sản Phẩm"}
                </button>
                <button onClick={logout} className="p-4 border border-editorial-line/10 hover:bg-editorial-muted/10 transition-all text-editorial-text/40 hover:text-editorial-text">
                  <LogOut size={20} />
                </button>
              </div>
            </header>

            <AnimatePresence>
              {status && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'} text-xs font-bold uppercase tracking-wider`}
                >
                  {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {status.msg}
                  <button onClick={() => setStatus(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Section */}
            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleSave} className="bg-editorial-muted/5 border border-editorial-line/10 p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center gap-2">
                          <Package size={12} /> Tên sản phẩm
                        </label>
                        <input 
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white border border-editorial-line/10 p-4 font-serif outline-none focus:border-editorial-accent transition-colors"
                          placeholder="Ví dụ: Ghế Mây Thư Giãn"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center gap-2">
                          <DollarSign size={12} /> Giá (VNĐ)
                        </label>
                        <input 
                          type="number"
                          required
                          value={isNaN(formData.priceNum) ? "" : formData.priceNum}
                          onChange={e => {
                            const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                            setFormData({ ...formData, priceNum: isNaN(val) ? 0 : val });
                          }}
                          className="w-full bg-white border border-editorial-line/10 p-4 font-serif outline-none focus:border-editorial-accent transition-colors"
                        />
                        <p className="text-[10px] italic opacity-40">Hiển thị: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.priceNum || 0)}</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center gap-2">
                          <ImageIcon size={12} /> Hình ảnh sản phẩm (Chọn nhiều)
                        </label>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {/* Selected Previews & Existing Gallery */}
                          {(previewUrls.length > 0 || (formData.images && formData.images.length > 0)) && (
                            <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-white border border-editorial-line/10">
                              {/* Existing */}
                              {formData.images?.map((img, idx) => (
                                <div key={`ex-${idx}`} className="relative aspect-square border overflow-hidden group">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"><X size={14} /></button>
                                  {img === formData.image && <div className="absolute top-0 left-0 bg-editorial-accent text-white text-[8px] px-1 uppercase">Main</div>}
                                </div>
                              ))}
                              {/* New Previews */}
                              {previewUrls.map((url, idx) => (
                                <div key={`new-${idx}`} className="relative aspect-square border border-dashed border-editorial-accent/40 overflow-hidden group">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => removePreview(idx)} className="absolute inset-0 bg-editorial-text/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"><X size={14} /></button>
                                  <div className="absolute top-0 right-0 bg-editorial-accent text-white text-[8px] px-1 uppercase">New</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* File Upload Area */}
                          <div className="relative group">
                            <input 
                              type="file" 
                              multiple
                              accept="image/*"
                              onChange={handleFilesChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border border-dashed border-editorial-line/20 p-8 flex flex-col items-center justify-center gap-4 bg-white group-hover:border-editorial-accent transition-colors">
                              <Upload size={32} strokeWidth={1} className="text-editorial-accent opacity-40" />
                              <span className="text-[10px] uppercase tracking-[2px] opacity-40">Bấm hoặc kéo thả ảnh (Nhiều ảnh)</span>
                            </div>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <span className="text-[10px] uppercase tracking-widest opacity-30">URL ảnh</span>
                            </div>
                            <input 
                              value={formData.image}
                              onChange={e => {
                                const val = e.target.value;
                                setFormData({ 
                                  ...formData, 
                                  image: val, 
                                  images: val && !formData.images?.includes(val) ? [...(formData.images || []), val] : (formData.images || []) 
                                });
                              }}
                              className="w-full bg-white border border-editorial-line/10 p-4 pl-24 font-mono text-[10px] outline-none focus:border-editorial-accent transition-colors"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center gap-2">
                          <Tag size={12} /> Danh mục
                        </label>
                        <select 
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-white border border-editorial-line/10 p-4 font-serif outline-none focus:border-editorial-accent transition-colors"
                        >
                          {/* Combine standard and dynamic categories */}
                          {Array.from(new Set([...standardCategories, ...categories.map(c => c.name)])).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center gap-2">
                          <Briefcase size={12} /> Chất liệu / Chế tác
                        </label>
                        <select 
                          value={formData.material}
                          onChange={e => setFormData({ ...formData, material: e.target.value })}
                          className="w-full bg-white border border-editorial-line/10 p-4 font-serif outline-none focus:border-editorial-accent transition-colors"
                        >
                          {Array.from(new Set([...standardMaterials, ...materials.map(m => m.name)])).map(mat => (
                            <option key={mat} value={mat}>{mat === "Natural" ? "Tre Tự Nhiên (Natural)" : mat === "Handcrafted" ? "Thủ Công (Handcrafted)" : mat === "Processed" ? "Tre Kỹ Thuật (Processed)" : mat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40">
                            Đặc điểm nổi bật (Mỗi dòng 1 ý)
                          </label>
                          <textarea 
                            value={formData.highlights}
                            onChange={e => setFormData({ ...formData, highlights: e.target.value })}
                            className="w-full bg-white border border-editorial-line/10 p-4 font-serif text-sm outline-none focus:border-editorial-accent transition-colors min-h-[120px]"
                            placeholder="- Độ bền cao&#10;- Chống mối mọt&#10;- Thân thiện môi trường"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40">
                            Mô tả sản phẩm
                          </label>
                          <textarea 
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-editorial-line/10 p-4 font-serif text-sm outline-none focus:border-editorial-accent transition-colors min-h-[120px]"
                            placeholder="Nhập mô tả chi tiết sản phẩm..."
                          />
                        </div>
                      </div>

                      <div className="pt-6 flex gap-4">
                        <button 
                          type="submit" 
                          disabled={uploading}
                          className="flex-1 bg-editorial-text text-white py-5 flex items-center justify-center gap-3 uppercase text-[10px] tracking-[4px] font-bold hover:bg-editorial-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {uploading ? "Đang xử lý..." : (editingId ? "Cập Nhật Sản Phẩm" : "Lưu Sản Phẩm")}
                        </button>
                        <button type="button" onClick={resetForm} className="px-8 border border-editorial-line/10 hover:bg-white transition-all uppercase text-[10px] tracking-[2px] opacity-40 hover:opacity-100">
                          Hủy
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex border-b border-editorial-line/20 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-8 py-4 text-[10px] uppercase tracking-[4px] font-bold transition-all flex items-center gap-2 ${activeTab === 'products' ? 'border-b-2 border-editorial-accent text-editorial-accent' : 'opacity-40'}`}
              >
                <Grid size={14} /> Sản phẩm
              </button>
              <button 
                onClick={() => setActiveTab('metadata')}
                className={`px-8 py-4 text-[10px] uppercase tracking-[4px] font-bold transition-all flex items-center gap-2 ${activeTab === 'metadata' ? 'border-b-2 border-editorial-accent text-editorial-accent' : 'opacity-40'}`}
              >
                <Settings size={14} /> Danh mục & Chất liệu
              </button>
              <button 
                onClick={() => setActiveTab('media')}
                className={`px-8 py-4 text-[10px] uppercase tracking-[4px] font-bold transition-all flex items-center gap-2 ${activeTab === 'media' ? 'border-b-2 border-editorial-accent text-editorial-accent' : 'opacity-40'}`}
              >
                <ImageIcon size={14} /> Thư viện ảnh
              </button>
              <button 
                onClick={() => setActiveTab('inquiries')}
                className={`px-8 py-4 text-[10px] uppercase tracking-[4px] font-bold transition-all flex items-center gap-2 ${activeTab === 'inquiries' ? 'border-b-2 border-editorial-accent text-editorial-accent' : 'opacity-40'}`}
              >
                <FileText size={14} /> Liên hệ ({inquiries.length})
              </button>
            </div>

            {activeTab === 'products' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Sắp xếp theo:</span>
                    <div className="flex gap-2">
                      {[
                        { id: 'name', label: 'Tên' },
                        { id: 'price', label: 'Giá' },
                        { id: 'date', label: 'Ngày thêm' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            if (sortBy === option.id) {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy(option.id as any);
                              setSortOrder('asc');
                            }
                          }}
                          className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-all ${
                            sortBy === option.id 
                            ? 'bg-editorial-text text-white border-editorial-text' 
                            : 'border-editorial-line/10 hover:border-editorial-accent opacity-60'
                          }`}
                        >
                          {option.label} {sortBy === option.id && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* List Section */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-editorial-line/20">
                        <th className="py-6 px-4 text-[10px] uppercase tracking-[3px] font-bold opacity-30">Hình ảnh</th>
                        <th className="py-6 px-4 text-[10px] uppercase tracking-[3px] font-bold opacity-30">Tên sản phẩm</th>
                        <th className="py-6 px-4 text-[10px] uppercase tracking-[3px] font-bold opacity-30">Danh mục</th>
                        <th className="py-6 px-4 text-[10px] uppercase tracking-[3px] font-bold opacity-30">Giá</th>
                        <th className="py-6 px-4 text-[10px] uppercase tracking-[3px] font-bold opacity-30 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center font-serif italic text-[#999]">Chưa có sản phẩm nào trong kho.</td>
                        </tr>
                      ) : (
                        sortedProducts.map(product => (
                          <tr key={product.id} className="border-b border-editorial-line/10 hover:bg-editorial-muted/5 transition-colors group">
                            <td className="py-6 px-4">
                              <div className="w-16 h-20 overflow-hidden bg-editorial-muted/20">
                                <img src={product.image} alt="" className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 scale-105" referrerPolicy="no-referrer" />
                              </div>
                            </td>
                            <td className="py-6 px-4">
                              <div className="font-serif text-lg">{product.name}</div>
                              <div className="text-[10px] uppercase tracking-widest opacity-40">{product.material}</div>
                            </td>
                            <td className="py-6 px-4">
                              <span className="text-[10px] px-3 py-1 border border-editorial-line/10 uppercase tracking-widest">{product.category}</span>
                            </td>
                            <td className="py-6 px-4 font-serif">{product.price}</td>
                            <td className="py-6 px-4 text-right">
                              <div className="flex justify-end gap-4">
                                <button onClick={() => startEdit(product)} className="p-2 text-editorial-text hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 text-editorial-text hover:text-editorial-accent transition-colors"><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : activeTab === 'metadata' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Categories Management */}
                <div className="space-y-8">
                  <div className="bg-white border border-editorial-line/10 p-8">
                    <h3 className="text-sm font-bold uppercase tracking-[2px] mb-6 flex items-center gap-2">
                       <Tag size={16} /> Quản lý danh mục
                    </h3>
                    <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
                      <input 
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Tên danh mục..."
                        className="flex-1 border-b border-editorial-line/20 py-2 outline-none focus:border-editorial-accent text-sm"
                      />
                      <button type="submit" className="px-6 py-2 bg-editorial-text text-white text-[10px] uppercase tracking-widest font-bold">Thêm</button>
                    </form>
                    <div className="space-y-3">
                      {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center py-3 border-b border-editorial-line/5 text-sm group">
                          {editingMetadata?.id === cat.id ? (
                            <div className="flex gap-2 w-full">
                              <input 
                                value={editMetaValue}
                                onChange={e => setEditMetaValue(e.target.value)}
                                className="flex-1 border-b border-editorial-accent outline-none"
                                autoFocus
                              />
                              <button onClick={handleUpdateMetadata} className="text-blue-500 font-bold uppercase text-[10px]">Lưu</button>
                              <button onClick={() => setEditingMetadata(null)} className="text-gray-400 font-bold uppercase text-[10px]">Hủy</button>
                            </div>
                          ) : (
                            <>
                              <span className="font-serif italic">{cat.name}</span>
                              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingMetadata({ id: cat.id, name: cat.name, type: 'category' });
                                    setEditMetaValue(cat.name);
                                  }} 
                                  className="text-editorial-text hover:text-blue-500"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => deleteMetadata('categories', cat.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Materials Management */}
                <div className="space-y-8">
                  <div className="bg-white border border-editorial-line/10 p-8">
                    <h3 className="text-sm font-bold uppercase tracking-[2px] mb-6 flex items-center gap-2">
                       <Briefcase size={16} /> Quản lý chất liệu
                    </h3>
                    <form onSubmit={handleAddMaterial} className="flex flex-col gap-4 mb-8">
                      <input 
                        value={newMatName}
                        onChange={e => setNewMatName(e.target.value)}
                        placeholder="Tên chất liệu (VD: Thủ Công)..."
                        className="border-b border-editorial-line/20 py-2 outline-none focus:border-editorial-accent text-sm"
                      />
                      <select 
                        value={newMatValue}
                        onChange={e => setNewMatValue(e.target.value)}
                        className="border-b border-editorial-line/20 py-2 outline-none text-xs"
                      >
                         <option value="Natural">Tre Tự Nhiên (Natural)</option>
                         <option value="Handcrafted">Thủ Công (Handcrafted)</option>
                         <option value="Processed">Tre Kỹ Thuật (Processed)</option>
                      </select>
                      <button type="submit" className="w-full py-3 bg-editorial-text text-white text-[10px] uppercase tracking-widest font-bold">Thêm chất liệu</button>
                    </form>
                    <div className="space-y-3">
                      {materials.map(mat => (
                        <div key={mat.id} className="flex justify-between items-center py-3 border-b border-editorial-line/5 text-sm group">
                          {editingMetadata?.id === mat.id ? (
                            <div className="flex gap-2 w-full">
                              <input 
                                value={editMetaValue}
                                onChange={e => setEditMetaValue(e.target.value)}
                                className="flex-1 border-b border-editorial-accent outline-none"
                                autoFocus
                              />
                              <button onClick={handleUpdateMetadata} className="text-blue-500 font-bold uppercase text-[10px]">Lưu</button>
                              <button onClick={() => setEditingMetadata(null)} className="text-gray-400 font-bold uppercase text-[10px]">Hủy</button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="font-serif italic">{mat.name}</span>
                                <span className="text-[10px] ml-3 uppercase opacity-40 font-bold">({mat.value})</span>
                              </div>
                              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingMetadata({ id: mat.id, name: mat.name, type: 'material' });
                                    setEditMetaValue(mat.name);
                                  }} 
                                  className="text-editorial-text hover:text-blue-500"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => deleteMetadata('materials', mat.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'media' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {mediaGallery.map((img, i) => (
                  <div key={i} className="aspect-[3/4] bg-editorial-muted/10 relative group border border-editorial-line/5 overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 group-hover:scale-105 transition-all" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-editorial-text/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setFormData({ ...formData, image: img });
                          setStatus({ type: 'success', msg: "Đã chọn ảnh từ thư viện" });
                          setIsAdding(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white text-editorial-text p-2 rounded-full shadow-lg hover:text-editorial-accent"
                        title="Dùng cho sản phẩm này"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {inquiries.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-editorial-line/20 rounded-lg">
                    <p className="font-serif italic text-editorial-text/40">Chưa có liên hệ nào từ khách hàng.</p>
                  </div>
                ) : (
                  inquiries.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((inquiry) => (
                    <div key={inquiry.id} className="bg-white border border-editorial-line/10 p-8 relative group">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-lg font-serif mb-1">{inquiry.name}</h4>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent mb-2">{inquiry.email}</p>
                          <span className="text-[10px] opacity-30">
                            {inquiry.createdAt ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'Vừa xong'}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-editorial-muted/50 rounded-full text-[10px] uppercase tracking-widest font-bold opacity-60">
                          {inquiry.subject === 'consultancy' ? 'Tư vấn' : inquiry.subject === 'retail' ? 'Cá nhân' : 'Hợp tác'}
                        </span>
                      </div>
                      <div className="text-sm text-[#666] leading-relaxed border-l-2 border-editorial-accent/20 pl-6 italic">
                        "{inquiry.message}"
                      </div>
                      <button 
                         onClick={() => deleteMetadata('inquiries', inquiry.id)}
                         className="absolute top-4 right-4 p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
