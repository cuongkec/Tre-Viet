import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Edit2, Trash2, Save, X, 
  LogIn, LogOut, Package, Image as ImageIcon, 
  Tag, Briefcase, DollarSign, AlertCircle, CheckCircle,
  Upload, Loader, Settings, Grid, FileText, RefreshCw,
  ChevronLeft, ChevronRight, GripVertical
} from "lucide-react";
import { 
  collection, query, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, setDoc,
  serverTimestamp, getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth, storage, loginWithGoogle, logout } from "../lib/firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImageCropDialog from "../components/ImageCropDialog";

interface Product {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  isContactPrice?: boolean;
  image: string;
  images?: string[];
  category: string;
  material: string;
  description?: string;
  highlights?: string[];
  variations?: { name: string; options: string[] }[];
}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  category: string;
  createdAt?: any;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortMediaBy, setSortMediaBy] = useState<'name' | 'category' | 'date'>('date');
  const [sortMediaOrder, setSortMediaOrder] = useState<'asc' | 'desc'>('desc');
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [mediaFormData, setMediaFormData] = useState<{ url: string; name: string; category: string }>({ url: '', name: '', category: 'Chưa phân loại' });
  const [newMatValue, setNewMatValue] = useState("Handcrafted");
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'metadata' | 'inquiries' | 'media' | 'homepage'>('products');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [materials, setMaterials] = useState<{id: string, name: string, value: string}[]>([]);

  // Function to upload to Cloudinary (Alternative Storage)
  const uploadToCloudinary = async (file: File) => {
    // Check file size (10MB limit for Cloudinary free tier)
    if (file.size > 10485760) {
      throw new Error(`Kích thước file quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB. Tối đa 10MB.`);
    }

    const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || "dqashtrhn";
    const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || "TreViet";
    
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

  const handleImageSelectForCrop = (e: React.ChangeEvent<HTMLInputElement>, aspect: number, onCompleteUpload: (url: string) => void) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setCropState({
        src: reader.result as string,
        aspect,
        onComplete: async (croppedFile: File) => {
          setCropState(null);
          try {
            setUploading(true);
            const url = await uploadToCloudinary(croppedFile);
            if (url) onCompleteUpload(url);
          } catch (err: any) {
            setStatus({ type: 'error', msg: err.message || 'Lỗi tải ảnh lên' });
          } finally {
            setUploading(false);
          }
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const [newCatName, setNewCatName] = useState("");
  const [newMatName, setNewMatName] = useState("");
  const [editingMetadata, setEditingMetadata] = useState<{id: string, name: string, type: 'category' | 'material'} | null>(null);
  const [editMetaValue, setEditMetaValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cropState, setCropState] = useState<{ src: string, aspect: number, onComplete: (file: File) => void } | null>(null);

  const [homepageSettings, setHomepageSettings] = useState({
    logoImage: "",
    heroImage: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1500&q=80",
    storyImage: "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=1974&auto=format&fit=crop",
    collections: {
      livingRoom: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1000&q=80",
      lighting: "https://images.unsplash.com/photo-1513519247388-19345ed5d467?auto=format&fit=crop&w=1000&q=80",
      kitchen: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80"
    },
    archiveImages: [
      "https://images.unsplash.com/photo-1596073413908-445253ce39bb?auto=format&fit=crop&w=1500&q=80",
      "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=1500&q=80",
      "https://images.unsplash.com/photo-1582531383827-0240974ed22f?auto=format&fit=crop&w=1500&q=80",
      "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=1500&q=80",
      "https://images.unsplash.com/photo-1585128719715-46776b56a0d1?auto=format&fit=crop&w=1500&q=80",
      "https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=1500&q=80"
    ]
  });
  const [tempArchiveUrl, setTempArchiveUrl] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    priceNum: 0,
    isContactPrice: false,
    image: "",
    images: [] as string[],
    category: "Bàn Ghế",
    material: "Handcrafted",
    description: "",
    highlights: "", // Using string for textarea, will split to array on save
    variations: [] as { name: string; options: string[] }[]
  });

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [uploadingCount, setUploadingCount] = useState<number>(0);

  const standardCategories = ["Bàn Ghế", "Đèn Trang Trí", "Phụ Kiện", "Nội Thất"];
  const standardMaterials = ["Natural", "Handcrafted", "Processed"];

  const mediaGallery = useMemo(() => {
    // Collect unique images from products and homepage settings
    const allImages = new Set<string>();
    
    products.forEach(p => {
      if (p.image) allImages.add(p.image);
      if (p.images && Array.isArray(p.images)) {
        p.images.forEach((img: string) => allImages.add(img));
      }
    });
    
    // Add homepage settings images
    if (homepageSettings.logoImage) allImages.add(homepageSettings.logoImage);
    if (homepageSettings.heroImage) allImages.add(homepageSettings.heroImage);
    if (homepageSettings.storyImage) allImages.add(homepageSettings.storyImage);
    Object.values(homepageSettings.collections).forEach(url => {
      if (url) allImages.add(url);
    });
    homepageSettings.archiveImages.forEach(url => {
      if (url) allImages.add(url);
    });

    return Array.from(allImages);
  }, [products, homepageSettings]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        comparison = a.priceNum - b.priceNum;
      } else if (sortBy === 'date') {
        const dateA = (a as any).created_at?.seconds || (a as any).createdAt?.seconds || 0;
        const dateB = (b as any).created_at?.seconds || (b as any).createdAt?.seconds || 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [products, sortBy, sortOrder]);

  const sortedMedia = useMemo(() => {
    return [...mediaItems].sort((a, b) => {
      let comparison = 0;
      if (sortMediaBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortMediaBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortMediaBy === 'date') {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        comparison = dateA - dateB;
      }
      return sortMediaOrder === 'asc' ? comparison : -comparison;
    });
  }, [mediaItems, sortMediaBy, sortMediaOrder]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          try {
            const adminDoc = await getDoc(doc(db, "admins", user.uid));
            setIsAdmin(adminDoc.exists() || user.email === 'admin@sevenam.com.vn');
          } catch (err) {
            // If getDoc fails due to permissions or missing, fallback to email check
            setIsAdmin(user.email === 'admin@sevenam.com.vn');
          }
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

    const unsubHomepageSettings = onSnapshot(doc(db, "settings", "homepageSettings"), (docSnap) => {
      if (docSnap.exists()) {
        setHomepageSettings(docSnap.data() as any);
      }
    });

    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      setMediaItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem)));
    }, (error) => {
      console.error("Error listening to media:", error);
    });

    return () => {
      unsubscribe();
      unsubCats();
      unsubMats();
      unsubInquiries();
      unsubHomepageSettings();
      unsubMedia();
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

  const [confirmDeletingMeta, setConfirmDeletingMeta] = useState<string | null>(null);

  const deleteMetadata = async (col: string, id: string) => {
    setStatus({ type: 'success', msg: "Đang xóa..." });
    setConfirmDeletingMeta(null);
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

  const saveHomepageSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "homepageSettings"), homepageSettings);
      setStatus({ type: 'success', msg: "Đã cập nhật trang chủ" });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: "Không thể cập nhật trang chủ" });
    }
  };

  const forceRefreshHomepageSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "homepageSettings"));
      if (docSnap.exists()) {
        setHomepageSettings(docSnap.data() as any);
        setStatus({ type: 'success', msg: "Đã làm mới cache từ máy chủ" });
      } else {
        setStatus({ type: 'error', msg: "Không tìm thấy dữ liệu trên máy chủ" });
      }
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: "Tải cache thất bại" });
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
    if (!formData.isContactPrice && formData.priceNum <= 0) {
      setStatus({ type: 'error', msg: "Vui lòng nhập giá sản phẩm hợp lệ hoặc chọn 'Liên hệ'" });
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
            // Using a standard unsplash/default approach for demo or forcing Cloudinary
            const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || "dqashtrhn"; 
            const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || "TreViet";
            
            const fd = new FormData();
            fd.append('file', file);
            fd.append('upload_preset', uploadPreset);

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              {
                method: 'POST',
                body: fd,
              }
            );

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error?.message || "Cloudinary upload failed");
            }

            const data = await response.json();
            return data.secure_url;
          });
          
          const uploadedUrls = await Promise.all(uploadPromises);
          
          if (!imageUrl && uploadedUrls.length > 0) {
            imageUrl = uploadedUrls[0];
          }
          
          gallery = [...gallery, ...uploadedUrls];
        } catch (uploadError: any) {
          console.error("Upload error:", uploadError);
          throw new Error("Tải ảnh thất bại. Dịch vụ lưu trữ chưa được cấu hình đúng: " + uploadError.message);
        }
      }

      if (!imageUrl && !formData.image) {
        throw new Error("Vui lòng cung cấp ít nhất một hình ảnh (tải lên hoặc URL).");
      }

      const productData = {
        name: formData.name.trim(),
        priceNum: formData.isContactPrice ? 0 : formData.priceNum,
        isContactPrice: formData.isContactPrice,
        image: imageUrl || formData.image,
        images: gallery.length > 0 ? gallery : [imageUrl || formData.image],
        category: formData.category,
        material: formData.material,
        description: formData.description.trim(),
        highlights: formData.highlights.split('\n').map(h => h.trim()).filter(h => h !== ""),
        variations: formData.variations,
        price: formData.isContactPrice ? "Liên hệ" : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.priceNum),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setStatus({ type: 'success', msg: "Cập nhật sản phẩm thành công" });
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          created_at: serverTimestamp(),
          createdAt: serverTimestamp() // keeping createdAt just in case other parts of the app use it
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

  const confirmDelete = (id: string) => {
    setDeletingId(id);
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setStatus({ type: 'success', msg: "Đã xóa sản phẩm" });
    } catch (error) {
      setStatus({ type: 'error', msg: "Không thể xóa sản phẩm" });
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFormData.url.trim() || !mediaFormData.name.trim()) return;
    try {
      setUploading(true);
      if (editingMediaId) {
        await updateDoc(doc(db, "media", editingMediaId), {
          url: mediaFormData.url.trim(),
          name: mediaFormData.name.trim(),
          category: mediaFormData.category,
        });
        setStatus({ type: 'success', msg: 'Đã cập nhật ảnh' });
      } else {
        await addDoc(collection(db, "media"), {
          url: mediaFormData.url.trim(),
          name: mediaFormData.name.trim(),
          category: mediaFormData.category,
          createdAt: serverTimestamp()
        });
        setStatus({ type: 'success', msg: 'Đã thêm ảnh vào thư viện' });
      }
      setIsAddingMedia(false);
      setEditingMediaId(null);
      setMediaFormData({ url: '', name: '', category: 'Chưa phân loại' });
    } catch (error) {
      setStatus({ type: 'error', msg: 'Không thể lưu media' });
    } finally {
      setUploading(false);
    }
  };

  const executeDeleteMedia = async (id: string) => {
    try {
      await deleteDoc(doc(db, "media", id));
      setStatus({ type: 'success', msg: "Đã xóa ảnh khỏi thư viện" });
      setConfirmDeletingMeta(null);
    } catch (error) {
      setStatus({ type: 'error', msg: "Không thể xóa ảnh" });
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      priceNum: product.priceNum,
      isContactPrice: product.isContactPrice || false,
      image: product.image,
      images: product.images || [product.image],
      category: product.category,
      material: product.material,
      description: product.description || "",
      highlights: (product.highlights || []).join('\n'),
      variations: product.variations || []
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
      isContactPrice: false,
      image: "",
      images: [] as string[],
      category: "Bàn Ghế",
      material: "Handcrafted",
      description: "",
      highlights: "",
      variations: []
    });
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadingCount(files.length);
    setStatus(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        try {
          const url = await uploadToCloudinary(file);
          if (url) {
            urls.push(url);
            setFormData(prev => ({
              ...prev,
              image: prev.image ? prev.image : url,
              images: [...(prev.images || []), url]
            }));
          }
        } catch (uploadError: any) {
          console.error("Upload error single file:", uploadError);
          setStatus({ type: 'error', msg: `Tải ảnh lên thất bại: ${uploadError.message}` });
        } finally {
          setUploadingCount(prev => Math.max(0, prev - 1));
        }
      }
      if (urls.length > 0) {
        setStatus({ type: 'success', msg: `Đã tải lên thành công ${urls.length} ảnh` });
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err?.message || "Lỗi tải ảnh lên" });
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  };

  const removePreview = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleReorderImage = (dragIndex: number, hoverIndex: number) => {
    if (!formData.images || dragIndex === hoverIndex) return;
    const items = [...formData.images];
    const draggedItem = items[dragIndex];
    items.splice(dragIndex, 1);
    items.splice(hoverIndex, 0, draggedItem);
    setFormData(prev => ({
      ...prev,
      images: items
    }));
    setDraggingIndex(hoverIndex);
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (!formData.images) return;
    const items = [...formData.images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    // Swap
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    
    setFormData(prev => ({
      ...prev,
      images: items
    }));
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
      
      <main className="pt-40 pb-20 px-6 md:px-[60px] max-w-7xl mx-auto">
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
              <div className="flex flex-col items-center">
                {status?.type === 'error' && (
                  <div className="mb-4 text-red-500 font-bold border border-red-200 bg-red-50 p-4 w-full max-w-md">
                    LỖI ĐĂNG NHẬP: {status.msg}
                  </div>
                )}
                <button 
                  onClick={() => {
                    loginWithGoogle().catch(err => {
                      console.error("Login popup error:", err);
                      setStatus({ type: 'error', msg: err?.message || "Popup bị trình duyệt đóng ngang hoặc lỗi mạng." });
                    });
                  }}
                  className="flex items-center gap-4 mx-auto px-10 py-5 bg-editorial-text text-white hover:bg-editorial-accent transition-all duration-500 uppercase text-[12px] tracking-[4px] font-bold"
                >
                  <LogIn size={18} /> Đăng nhập bằng Google
                </button>
              </div>
            )}
            
            {/* Note about bootstrapping */}
            <div className="mt-20 p-6 border border-dashed border-editorial-line/20 max-w-2xl mx-auto text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-editorial-accent" /> Hướng dẫn cấp quyền admin
              </h3>
              <ol className="text-xs space-y-2 opacity-60 list-decimal pl-4">
                <li>Truy cập Firebase Console {">"} Firestore Database.</li>
                <li>Tạo collection có tên là <code>admins</code>.</li>
                <li>Thêm một document với <strong>Document ID</strong> chính là <strong>UID</strong> tài khoản của bạn.</li>
                <li>UID của bạn hiện tại: <code className="bg-editorial-muted/20 px-1 text-editorial-accent font-bold">{user?.uid || "(Đăng nhập để xem UID)"}</code></li>
                <li>F5 tải lại trang sau khi cấu hình xong.</li>
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
                  onClick={() => {
                    setRefreshing(true);
                    setTimeout(() => setRefreshing(false), 800);
                    setStatus({ type: 'success', msg: 'Đã cập nhật dữ liệu mới nhất' });
                    setTimeout(() => setStatus(null), 2000);
                  }}
                  className={`p-4 border border-editorial-line/10 hover:bg-editorial-muted/10 transition-all text-editorial-text/40 hover:text-editorial-text ${refreshing ? 'opacity-50' : ''}`}
                  disabled={refreshing}
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
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
                        <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center justify-between">
                          <span className="flex items-center gap-2"><DollarSign size={12} /> Giá (VNĐ)</span>
                          <label className="flex items-center gap-2 cursor-pointer normal-case tracking-normal">
                            <input 
                              type="checkbox"
                              checked={formData.isContactPrice || false}
                              onChange={e => setFormData({ ...formData, isContactPrice: e.target.checked })}
                              className="accent-editorial-accent"
                            />
                            <span>Giá Liên hệ</span>
                          </label>
                        </label>
                        <input 
                          type="number"
                          required={!formData.isContactPrice}
                          disabled={formData.isContactPrice}
                          value={formData.isContactPrice ? "" : (isNaN(formData.priceNum) ? "" : formData.priceNum)}
                          onChange={e => {
                            const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                            setFormData({ ...formData, priceNum: isNaN(val) ? 0 : val });
                          }}
                          className="w-full bg-white border border-editorial-line/10 p-4 font-serif outline-none focus:border-editorial-accent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                        />
                        <p className="text-[10px] italic opacity-40">Hiển thị: {formData.isContactPrice ? "Liên hệ" : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.priceNum || 0)}</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center gap-2">
                          <ImageIcon size={12} /> Hình ảnh sản phẩm (Chọn nhiều)
                        </label>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {/* Selected Previews & Existing Gallery */}
                          {((formData.images && formData.images.length > 0) || uploadingCount > 0) && (
                            <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-white border border-editorial-line/10">
                              {/* Existing */}
                              {formData.images?.map((img, idx) => (
                                <div 
                                  key={`ex-${idx}`} 
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggingIndex(idx);
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDragEnter={(e) => {
                                    if (draggingIndex !== null && draggingIndex !== idx) {
                                      handleReorderImage(draggingIndex, idx);
                                    }
                                  }}
                                  onDragEnd={() => setDraggingIndex(null)}
                                  className={`relative aspect-square border overflow-hidden group cursor-grab active:cursor-grabbing transition-all ${
                                    draggingIndex === idx ? 'opacity-40 border-editorial-accent scale-95' : 'border-editorial-line/10 hover:border-editorial-accent/60'
                                  }`}
                                >
                                  <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />
                                  
                                  {/* Drag Handle Overlay Icon on Hover */}
                                  <div className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <GripVertical size={12} />
                                  </div>

                                  {/* Quick Arrow Controls for Touchscreens / Click */}
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-1 z-10">
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()} onDragStart={(e) => e.preventDefault()}>
                                      {idx > 0 && (
                                        <button 
                                          type="button" 
                                          onClick={() => handleMoveImage(idx, 'left')}
                                          className="p-1 bg-white/20 hover:bg-white text-white hover:text-black transition-colors rounded-[2px] cursor-pointer"
                                          title="Di chuyển sang trái"
                                        >
                                          <ChevronLeft size={12} />
                                        </button>
                                      )}
                                      {idx < (formData.images.length - 1) && (
                                        <button 
                                          type="button" 
                                          onClick={() => handleMoveImage(idx, 'right')}
                                          className="p-1 bg-white/20 hover:bg-white text-white hover:text-black transition-colors rounded-[2px] cursor-pointer"
                                          title="Di chuyển sang phải"
                                        >
                                          <ChevronRight size={12} />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()} onDragStart={(e) => e.preventDefault()}>
                                      {img !== formData.image ? (
                                        <button 
                                          type="button" 
                                          onClick={() => setFormData({...formData, image: img})} 
                                          className="bg-white hover:bg-editorial-accent hover:text-white text-editorial-text text-[8px] px-1.5 py-0.5 font-bold uppercase transition-colors" 
                                          title="Đặt làm ảnh chính"
                                        >
                                          Main
                                        </button>
                                      ) : null}
                                      <button 
                                        type="button" 
                                        onClick={() => removeGalleryImage(idx)} 
                                        className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-[2px] transition-colors" 
                                        title="Xóa"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  </div>

                                  {img === formData.image && (
                                    <div className="absolute top-0 left-0 bg-editorial-accent text-white text-[8px] px-1.5 py-0.5 uppercase z-10 shadow-sm pointer-events-none font-bold">
                                      Main
                                    </div>
                                  )}
                                </div>
                              ))}
                              
                              {/* Uploading Progress Placeholders */}
                              {uploadingCount > 0 && Array.from({ length: uploadingCount }).map((_, uidx) => (
                                <div key={`uploading-${uidx}`} className="relative aspect-square border border-dashed border-editorial-accent/50 bg-editorial-muted/5 flex flex-col items-center justify-center animate-pulse font-sans">
                                  <Loader className="animate-spin text-editorial-accent mb-1" size={16} />
                                  <span className="text-[8px] uppercase tracking-wider opacity-60">Đang tải...</span>
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

                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-[10px] uppercase tracking-widest opacity-30">Thêm URL ảnh</span>
                              </div>
                              <input 
                                id="newImageUrlInput"
                                className="w-full bg-white border border-editorial-line/10 p-4 pl-[110px] font-mono text-[10px] outline-none focus:border-editorial-accent transition-colors"
                                placeholder="https://..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        image: prev.image ? prev.image : val,
                                        images: !prev.images?.includes(val) ? [...(prev.images || []), val] : (prev.images || []) 
                                      }));
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const input = document.getElementById("newImageUrlInput") as HTMLInputElement;
                                const val = input?.value?.trim();
                                if (val) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    image: prev.image ? prev.image : val,
                                    images: !prev.images?.includes(val) ? [...(prev.images || []), val] : (prev.images || []) 
                                  }));
                                  input.value = '';
                                }
                              }}
                              className="bg-black text-white px-6 text-[10px] uppercase font-bold tracking-widest hover:bg-editorial-accent transition-colors"
                            >
                              Thêm
                            </button>
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
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 flex items-center justify-between">
                            <span>Biến thể (Kích thước, Màu sắc...)</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, variations: [...(prev.variations || []), { name: "", options: [] }] }))}
                              className="text-editorial-accent hover:underline flex items-center gap-1"
                            >
                              <Plus size={12} /> Thêm biến thể
                            </button>
                          </label>
                          {formData.variations?.map((v, i) => (
                            <div key={i} className="flex gap-4 items-start bg-white p-4 border border-editorial-line/10">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider opacity-40 mb-1 block">Tên biến thể</label>
                                  <input 
                                    type="text"
                                    value={v.name}
                                    onChange={e => {
                                      const newVariations = [...(formData.variations || [])];
                                      newVariations[i].name = e.target.value;
                                      setFormData({...formData, variations: newVariations});
                                    }}
                                    placeholder="VD: Kích thước, Màu sắc"
                                    className="w-full border-b border-editorial-line/20 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider opacity-40 mb-1 block">Các tùy chọn (cách nhau bằng dấu phẩy)</label>
                                  <input 
                                    type="text"
                                    value={v.options.join(', ')}
                                    onChange={e => {
                                      const newVariations = [...(formData.variations || [])];
                                      // Support spaces after commas by joining back for the visual input but clean array on save
                                      newVariations[i].options = e.target.value.split(','); // Raw split to allow typing space after comma
                                      setFormData({...formData, variations: newVariations});
                                    }}
                                    onBlur={e => {
                                      const newVariations = [...(formData.variations || [])];
                                      newVariations[i].options = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                      setFormData({...formData, variations: newVariations});
                                    }}
                                    placeholder="VD: S, M, L hoặc Đen, Trắng"
                                    className="w-full border-b border-editorial-line/20 py-2 text-sm"
                                  />
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newVariations = [...(formData.variations || [])];
                                  newVariations.splice(i, 1);
                                  setFormData({...formData, variations: newVariations});
                                }}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
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
              <button 
                onClick={() => setActiveTab('homepage')}
                className={`px-8 py-4 text-[10px] uppercase tracking-[4px] font-bold transition-all flex items-center gap-2 ${activeTab === 'homepage' ? 'border-b-2 border-editorial-accent text-editorial-accent' : 'opacity-40'}`}
              >
                <Settings size={14} /> Trang chủ
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
                                {deletingId === product.id ? (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => executeDelete(product.id)} className="px-3 py-1 bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider hover:bg-red-700">Delete</button>
                                    <button onClick={cancelDelete} className="px-3 py-1 bg-gray-200 text-editorial-text text-[10px] uppercase font-bold tracking-wider hover:bg-gray-300">Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => confirmDelete(product.id)} className="p-2 text-editorial-text hover:text-editorial-accent transition-colors"><Trash2 size={18} /></button>
                                )}
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
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3.5 bg-editorial-muted/5 border border-editorial-line/10 rounded-[2px] text-sm hover:bg-editorial-muted/10 transition-colors">
                          {editingMetadata?.id === cat.id ? (
                            <div className="flex gap-2 w-full">
                              <input 
                                value={editMetaValue}
                                onChange={e => setEditMetaValue(e.target.value)}
                                className="flex-1 border-b border-editorial-accent bg-transparent py-1 outline-none text-sm font-sans"
                                autoFocus
                              />
                              <button onClick={handleUpdateMetadata} className="px-3 py-1 bg-editorial-accent text-white font-bold uppercase text-[9px] tracking-wider hover:bg-editorial-accent/90 transition-colors">Lưu</button>
                              <button onClick={() => setEditingMetadata(null)} className="px-3 py-1 bg-gray-200 text-[#333] font-bold uppercase text-[9px] tracking-wider hover:bg-gray-300 transition-colors">Hủy</button>
                            </div>
                          ) : (
                            <>
                              <span className="font-serif italic font-medium text-[15px]">{cat.name}</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingMetadata({ id: cat.id, name: cat.name, type: 'category' });
                                    setEditMetaValue(cat.name);
                                  }} 
                                  className="p-2 text-editorial-text hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-[2px]"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={13} />
                                </button>
                                {confirmDeletingMeta === cat.id ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => deleteMetadata('categories', cat.id)} className="px-2 py-1 bg-red-600 text-white text-[9px] uppercase font-bold tracking-wider hover:bg-red-700 transition-colors rounded-[2px]">Xóa</button>
                                    <button onClick={() => setConfirmDeletingMeta(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-[9px] uppercase font-bold tracking-wider hover:bg-gray-300 transition-colors rounded-[2px]">Hủy</button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setConfirmDeletingMeta(cat.id)} 
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-[2px]"
                                    title="Xóa"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
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
                        className="border-b border-editorial-line/20 py-2 outline-none text-xs bg-transparent"
                      >
                         <option value="Natural">Tre Tự Nhiên (Natural)</option>
                         <option value="Handcrafted">Thủ Công (Handcrafted)</option>
                         <option value="Processed">Tre Kỹ Thuật (Processed)</option>
                      </select>
                      <button type="submit" className="w-full py-3 bg-editorial-text text-white text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors">Thêm chất liệu</button>
                    </form>
                    <div className="space-y-2">
                      {materials.map(mat => (
                        <div key={mat.id} className="flex justify-between items-center p-3.5 bg-editorial-muted/5 border border-editorial-line/10 rounded-[2px] text-sm hover:bg-editorial-muted/10 transition-colors">
                          {editingMetadata?.id === mat.id ? (
                            <div className="flex gap-2 w-full">
                              <input 
                                value={editMetaValue}
                                onChange={e => setEditMetaValue(e.target.value)}
                                className="flex-1 border-b border-editorial-accent bg-transparent py-1 outline-none text-sm font-sans"
                                autoFocus
                              />
                              <button onClick={handleUpdateMetadata} className="px-3 py-1 bg-editorial-accent text-white font-bold uppercase text-[9px] tracking-wider hover:bg-editorial-accent/90 transition-colors">Lưu</button>
                              <button onClick={() => setEditingMetadata(null)} className="px-3 py-1 bg-gray-200 text-[#333] font-bold uppercase text-[9px] tracking-wider hover:bg-gray-300 transition-colors">Hủy</button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="font-serif italic font-medium text-[15px]">{mat.name}</span>
                                <span className="text-[9px] ml-2.5 px-2 py-0.5 bg-editorial-accent/10 text-editorial-accent font-bold uppercase tracking-wider rounded-[2px]">({mat.value})</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingMetadata({ id: mat.id, name: mat.name, type: 'material' });
                                    setEditMetaValue(mat.name);
                                  }} 
                                  className="p-2 text-editorial-text hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-[2px]"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={13} />
                                </button>
                                {confirmDeletingMeta === mat.id ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => deleteMetadata('materials', mat.id)} className="px-2 py-1 bg-red-600 text-white text-[9px] uppercase font-bold tracking-wider hover:bg-red-700 transition-colors rounded-[2px]">Xóa</button>
                                    <button onClick={() => setConfirmDeletingMeta(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-[9px] uppercase font-bold tracking-wider hover:bg-gray-300 transition-colors rounded-[2px]">Hủy</button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setConfirmDeletingMeta(mat.id)} 
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-[2px]"
                                    title="Xóa"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
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
              <>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Sắp xếp theo:</span>
                    <div className="flex bg-white border border-editorial-line/10">
                      {(['name', 'category', 'date'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            if (sortMediaBy === type) setSortMediaOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                            else { setSortMediaBy(type); setSortMediaOrder('desc'); }
                          }}
                          className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center gap-1
                            ${sortMediaBy === type ? 'bg-editorial-text text-white' : 'hover:bg-editorial-muted/10'}
                          `}
                        >
                          {type === 'name' ? 'Tên' : type === 'category' ? 'Danh mục' : 'Ngày thêm'}
                          {sortMediaBy === type && (
                            <span className="text-[10px]">{sortMediaOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsAddingMedia(true); setEditingMediaId(null); setMediaFormData({ url: '', name: '', category: 'Chưa phân loại' }); }}
                    className="w-full md:w-auto px-8 py-3 bg-editorial-text text-white text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Thêm ảnh mới
                  </button>
                </div>

                <div className="bg-white border border-editorial-line/10 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-editorial-line/10 text-[10px] uppercase tracking-[2px] opacity-40 font-bold">
                        <th className="p-6 w-24">Hình ảnh</th>
                        <th className="p-6">Tên ảnh</th>
                        <th className="p-6">Danh mục</th>
                        <th className="p-6 w-32 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMedia.map((media) => (
                        <tr key={media.id} className="border-b border-editorial-line/5 hover:bg-editorial-muted/5 transition-colors group">
                          <td className="p-6">
                            <div className="w-16 h-16 bg-editorial-muted/10 relative overflow-hidden group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                               onClick={() => {
                                 setFormData(prev => ({ 
                                   ...prev, 
                                   image: media.url,
                                   images: !prev.images?.includes(media.url) ? [...(prev.images || []), media.url] : prev.images
                                 }));
                                 setStatus({ type: 'success', msg: "Đã chọn ảnh từ thư viện" });
                                 setIsAdding(true);
                                 window.scrollTo({ top: 0, behavior: 'smooth' });
                               }}
                               title="Click để thêm vào sản phẩm đang chỉnh sửa"
                            >
                              <img src={media.url} alt={media.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          </td>
                          <td className="p-6">
                            <h4 className="font-serif text-lg">{media.name}</h4>
                          </td>
                          <td className="p-6">
                            <span className="text-[10px] uppercase tracking-widest border border-editorial-line/20 px-3 py-1 bg-white">{media.category}</span>
                          </td>
                          <td className="p-6">
                            <div className="flex justify-end gap-2 pr-4">
                              <button 
                                onClick={() => {
                                  setEditingMediaId(media.id);
                                  setMediaFormData({ url: media.url, name: media.name, category: media.category });
                                  setIsAddingMedia(true);
                                }} 
                                className="p-2 text-editorial-text hover:text-blue-600 transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              {confirmDeletingMeta === media.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => executeDeleteMedia(media.id)} className="px-3 py-1 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold">Xóa</button>
                                  <button onClick={() => setConfirmDeletingMeta(null)} className="px-3 py-1 bg-gray-200 text-[#333] text-[10px] uppercase tracking-widest font-bold">Hủy</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeletingMeta(media.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sortedMedia.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-sm font-serif italic text-editorial-text/40">
                            Chưa có ảnh nào trong thư viện.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <AnimatePresence>
                  {isAddingMedia && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-editorial-bg/80 backdrop-blur-sm">
                      <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white border border-editorial-line/10 shadow-2xl p-8 max-w-lg w-full"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-serif">{editingMediaId ? "Cập Nhật Ảnh" : "Thêm Ảnh Mới"}</h3>
                          <button onClick={() => setIsAddingMedia(false)} className="text-editorial-text/50 hover:text-editorial-text group"><X size={20} className="group-hover:rotate-90 transition-transform" /></button>
                        </div>
                        <form onSubmit={handleSaveMedia} className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 block">Tên ảnh</label>
                            <input 
                              required
                              value={mediaFormData.name}
                              onChange={e => setMediaFormData({ ...mediaFormData, name: e.target.value })}
                              className="w-full bg-transparent border-b border-editorial-line py-2 focus:border-editorial-accent outline-none text-sm transition-colors"
                              placeholder="Ví dụ: Không gian phòng khách"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 block">Tải ảnh lên</label>
                            {mediaFormData.url ? (
                              <div className="relative group">
                                <img src={mediaFormData.url} alt="Preview" className="w-full max-h-[200px] object-contain border border-editorial-line/10 bg-editorial-muted/5" />
                                <button 
                                  type="button"
                                  disabled={uploading}
                                  onClick={() => setMediaFormData({ ...mediaFormData, url: '' })}
                                  className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 shadow hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col flex-1 items-center justify-center p-8 border border-dashed border-editorial-line/20 bg-editorial-muted/5 hover:bg-editorial-muted/10 transition-colors cursor-pointer group rounded-sm text-center">
                                <Upload size={24} className="text-editorial-text/40 mb-3 group-hover:-translate-y-1 group-hover:text-editorial-accent transition-all" />
                                <span className="text-[10px] uppercase tracking-[2px] text-editorial-text/60 font-bold">Bấm để tải ảnh lên</span>
                                {uploading && <span className="text-xs text-editorial-accent italic mt-2">Đang tải lên...</span>}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setUploading(true);
                                      try {
                                        const url = await uploadToCloudinary(file);
                                        if (url) {
                                          setMediaFormData({ ...mediaFormData, url: url });
                                          setStatus({ type: "success", msg: "Tải ảnh lên thành công. Vui lòng nhập thông tin và bấm Lưu ảnh." });
                                        }
                                      } catch (error) {
                                        setStatus({ type: "error", msg: "Lỗi khi tải ảnh lên Cloudinary" });
                                      } finally {
                                        setUploading(false);
                                      }
                                    }
                                  }}
                                  disabled={uploading}
                                />
                              </label>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[2px] font-bold opacity-40 block">Danh mục</label>
                            <select 
                              required
                              value={mediaFormData.category}
                              onChange={e => setMediaFormData({ ...mediaFormData, category: e.target.value })}
                              className="w-full bg-transparent border-b border-editorial-line py-2 focus:border-editorial-accent outline-none text-sm transition-colors"
                            >
                              <option value="Chưa phân loại">Chưa phân loại</option>
                              {Array.from(new Set([...standardCategories, ...categories.map(c => c.name)])).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={() => setIsAddingMedia(false)} className="px-6 py-3 text-[10px] uppercase tracking-[2px] font-bold text-editorial-text/50 hover:text-editorial-text transition-colors">Hủy</button>
                            <button type="submit" disabled={uploading} className="px-8 py-3 bg-editorial-text text-white text-[10px] uppercase tracking-[3px] font-bold hover:bg-editorial-accent transition-colors disabled:opacity-50 flex items-center gap-2">
                              {uploading ? <><Loader size={14} className="animate-spin" /> Đang lưu...</> : <><Save size={14} /> Lưu ảnh</>}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </>
            ) : activeTab === 'inquiries' ? (
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
                      <div className="absolute top-4 right-4">
                        {confirmDeletingMeta === inquiry.id ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => deleteMetadata('inquiries', inquiry.id)} className="px-3 py-1 bg-red-600 text-white text-[9px] uppercase font-bold tracking-wider hover:bg-red-700 transition-colors rounded-[2px]">Xóa</button>
                            <button onClick={() => setConfirmDeletingMeta(null)} className="px-3 py-1 bg-gray-200 text-gray-700 text-[9px] uppercase font-bold tracking-wider hover:bg-gray-300 transition-colors rounded-[2px]">Hủy</button>
                          </div>
                        ) : (
                          <button 
                             onClick={() => setConfirmDeletingMeta(inquiry.id)}
                             className="p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2px]"
                          >
                             <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'homepage' ? (
              <div className="space-y-12">
                <div className="bg-white p-8 md:p-12 border border-editorial-line/10">
                  <h3 className="text-xl font-serif mb-8 border-b border-editorial-line/10 pb-4">Logo và Nhận diện thương hiệu</h3>
                  <div>
                    <label className="text-[10px] uppercase tracking-[2px] font-bold block mb-4">Logo Website</label>
                    <div className="h-24 bg-editorial-muted/10 mb-4 border border-editorial-line/10 relative overflow-hidden group flex items-center justify-center">
                      {homepageSettings.logoImage ? (
                        <img 
                          src={homepageSettings.logoImage} 
                          className="h-full object-contain p-2" 
                          alt="Logo Preview" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs uppercase tracking-widest opacity-30">Chưa có Logo</span>
                      )}
                    </div>
                    <div className="flex gap-4 items-center">
                      <input
                        type="text"
                        value={homepageSettings.logoImage || ''}
                        onChange={(e) => setHomepageSettings({
                          ...homepageSettings,
                          logoImage: e.target.value
                        })}
                        placeholder="URL Logo"
                        className="flex-1 py-3 px-4 border border-editorial-line/10 bg-transparent text-sm focus:border-editorial-accent outline-none font-sans"
                      />
                      <label className="flex items-center justify-center gap-2 border border-dashed border-editorial-line/30 py-3 px-6 cursor-pointer bg-editorial-muted/5 hover:bg-editorial-muted/10 hover:border-editorial-accent transition-all text-[11px] font-bold uppercase tracking-[2px] rounded-[2px] shrink-0">
                        <Upload size={14} className="text-editorial-accent" /> {uploading ? "ĐANG TẢI LÊN..." : "TẢI LOGO LÊN"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploading(true);
                              try {
                                const url = await uploadToCloudinary(file);
                                if (url) {
                                  setHomepageSettings({
                                    ...homepageSettings,
                                    logoImage: url
                                  });
                                  setStatus({ type: "success", msg: "Tải lên thành công! Nhớ bấm 'LƯU TRANG CHỦ' bên dưới." });
                                }
                              } catch (error) {
                                setStatus({ type: "error", msg: "Lỗi khi tải logo lên" });
                              } finally {
                                setUploading(false);
                              }
                            }
                          }}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 md:p-12 border border-editorial-line/10">
                  <h3 className="text-xl font-serif mb-8 border-b border-editorial-line/10 pb-4">Bamboo Interior Hero (Ảnh chính)</h3>
                  <div>
                    <label className="text-[10px] uppercase tracking-[2px] font-bold block mb-4">Ảnh Hero</label>
                    <div className="aspect-[21/9] bg-editorial-muted/10 mb-4 border border-editorial-line/10 relative overflow-hidden group">
                      {homepageSettings.heroImage && (
                        <img 
                          src={homepageSettings.heroImage} 
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" 
                          alt="Hero" 
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      value={homepageSettings.heroImage || ""}
                      onChange={(e) => setHomepageSettings({
                        ...homepageSettings,
                        heroImage: e.target.value
                      })}
                      placeholder="URL Hình ảnh"
                      className="w-full py-3 px-4 border border-editorial-line/10 bg-transparent text-sm focus:border-editorial-accent outline-none mb-3 font-sans"
                    />
                    <label className="flex items-center justify-center gap-2 border border-dashed border-editorial-line/30 py-4 px-6 cursor-pointer bg-editorial-muted/5 hover:bg-editorial-muted/10 hover:border-editorial-accent transition-all text-[11px] font-bold uppercase tracking-[2px] rounded-[2px]">
                      <Upload size={14} className="text-editorial-accent" /> {uploading ? "ĐANG TẢI LÊN..." : "TẢI ẢNH LÊN"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploading(true);
                            try {
                              const url = await uploadToCloudinary(file);
                              if (url) {
                                setHomepageSettings({
                                  ...homepageSettings,
                                  heroImage: url
                                });
                                setStatus({ type: "success", msg: "Tải ảnh lên thành công" });
                              }
                            } catch (error) {
                              setStatus({ type: "error", msg: "Lỗi khi tải ảnh lên" });
                            } finally {
                              setUploading(false);
                            }
                          }
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-white p-8 md:p-12 border border-editorial-line/10">
                  <h3 className="text-xl font-serif mb-8 border-b border-editorial-line/10 pb-4">Story Section (Kế thừa & sáng tạo)</h3>
                  <div>
                    <label className="text-[10px] uppercase tracking-[2px] font-bold block mb-4">Ảnh câu chuyện</label>
                    <div className="aspect-[4/5] md:aspect-[3/4] max-w-sm bg-editorial-muted/10 mb-4 border border-editorial-line/10 relative overflow-hidden group">
                      {homepageSettings.storyImage && (
                        <img 
                          src={homepageSettings.storyImage} 
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" 
                          alt="Story" 
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      value={homepageSettings.storyImage || ""}
                      onChange={(e) => setHomepageSettings({
                        ...homepageSettings,
                        storyImage: e.target.value
                      })}
                      placeholder="URL Hình ảnh"
                      className="w-full py-3 px-4 border border-editorial-line/10 bg-transparent text-sm focus:border-editorial-accent outline-none mb-3 font-sans"
                    />
                    <label className="flex items-center justify-center gap-2 border border-dashed border-editorial-line/30 py-4 px-6 cursor-pointer bg-editorial-muted/5 hover:bg-editorial-muted/10 hover:border-editorial-accent transition-all text-[11px] font-bold uppercase tracking-[2px] rounded-[2px] max-w-sm">
                      <Upload size={14} className="text-editorial-accent" /> Tải ảnh lên & Cắt hình
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageSelectForCrop(e, 3/4, (url) => {
                          setHomepageSettings({
                            ...homepageSettings,
                            storyImage: url
                          });
                        })}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-white p-8 md:p-12 border border-editorial-line/10">
                  <h3 className="text-xl font-serif mb-8 border-b border-editorial-line/10 pb-4">Our Collections (Ảnh trang chủ)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {['livingRoom', 'lighting', 'kitchen'].map((key) => (
                      <div key={key}>
                        <label className="text-[10px] uppercase tracking-[2px] font-bold block mb-4">
                          {key === 'livingRoom' ? 'Bàn Ghế Phòng Khách' : key === 'lighting' ? 'Đèn Trang Trí' : 'Phụ Kiện Nhà Bếp'}
                        </label>
                        <div className="aspect-[4/5] bg-editorial-muted/10 mb-4 border border-editorial-line/10 relative overflow-hidden group">
                          {homepageSettings.collections[key as keyof typeof homepageSettings.collections] && (
                            <img 
                              src={homepageSettings.collections[key as keyof typeof homepageSettings.collections]} 
                              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" 
                              alt={key} 
                            />
                          )}
                        </div>
                        <input
                          type="text"
                          value={homepageSettings.collections[key as keyof typeof homepageSettings.collections]}
                          onChange={(e) => setHomepageSettings({
                            ...homepageSettings,
                            collections: {
                              ...homepageSettings.collections,
                              [key]: e.target.value
                            }
                          })}
                          placeholder="URL Hình ảnh"
                          className="w-full py-3 px-4 border border-editorial-line/10 bg-transparent text-sm focus:border-editorial-accent outline-none mb-3 font-sans"
                        />
                        <label className="flex items-center justify-center gap-2 border border-dashed border-editorial-line/30 py-3 px-4 cursor-pointer bg-editorial-muted/5 hover:bg-editorial-muted/10 hover:border-editorial-accent transition-all text-[10px] font-bold uppercase tracking-[1.5px] rounded-[2px] w-full">
                          <Upload size={12} className="text-editorial-accent" /> Tải ảnh lên & Cắt hình
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelectForCrop(e, 4/5, (url) => {
                              setHomepageSettings(prev => ({
                                ...prev,
                                collections: {
                                  ...prev.collections,
                                  [key]: url
                                }
                              }));
                            })}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 md:p-12 border border-editorial-line/10">
                  <h3 className="text-xl font-serif mb-8 border-b border-editorial-line/10 pb-4">Archive (Kho Lưu Trữ Vẻ Đẹp)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {homepageSettings.archiveImages.map((img, i) => (
                      <div 
                        key={i} 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', i.toString());
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          if (isNaN(draggedIndex) || draggedIndex === i) return;
                          const newImages = [...homepageSettings.archiveImages];
                          const draggedItem = newImages[draggedIndex];
                          newImages.splice(draggedIndex, 1);
                          newImages.splice(i, 0, draggedItem);
                          setHomepageSettings({ ...homepageSettings, archiveImages: newImages });
                        }}
                        className="aspect-video bg-editorial-muted/10 relative group border border-editorial-line/10 cursor-move"
                      >
                        <img src={img} className="w-full h-full object-cover" alt="" draggable={false} />
                        <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity uppercase text-[10px] tracking-widest font-bold gap-2">
                           <span className="mb-2">Kéo thả để sắp xếp</span>
                           <button
                             onClick={() => setHomepageSettings({
                               ...homepageSettings,
                               archiveImages: homepageSettings.archiveImages.filter((_, idx) => idx !== i)
                             })}
                             className="text-red-300 hover:text-red-400 mt-2 px-4 py-2 border border-red-300/30"
                           >
                             Xóa
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-[2px] font-bold block mb-4">Thêm URL ảnh hoặc Tải lên</label>
                      <input
                        type="text"
                        value={tempArchiveUrl}
                        onChange={(e) => setTempArchiveUrl(e.target.value)}
                        placeholder="URL hình ảnh"
                        className="w-full py-4 px-6 border border-editorial-line/10 bg-transparent text-sm focus:border-editorial-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <input
                          type="file"
                          accept="image/*"
                          id="archive-upload"
                          className="hidden"
                          onChange={(e) => handleImageSelectForCrop(e, 16/9, (url) => {
                            setHomepageSettings({
                              ...homepageSettings,
                              archiveImages: [...homepageSettings.archiveImages, url]
                            });
                          })}
                        />
                        <label htmlFor="archive-upload" className="py-4 px-6 border border-editorial-line/10 hover:bg-gray-50 cursor-pointer text-xs uppercase tracking-widest block h-full flex items-center">
                          Tải lên
                        </label>
                    </div>
                    <button
                      onClick={() => {
                        if (tempArchiveUrl) {
                          setHomepageSettings({
                            ...homepageSettings,
                            archiveImages: [...homepageSettings.archiveImages, tempArchiveUrl]
                          });
                          setTempArchiveUrl("");
                        }
                      }}
                      className="bg-editorial-text text-white py-4 px-8 uppercase text-[10px] tracking-widest font-bold hover:bg-editorial-accent transition-all"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={forceRefreshHomepageSettings}
                    disabled={uploading}
                    className="bg-editorial-line/10 text-editorial-text py-4 px-8 uppercase text-[10px] tracking-[4px] font-bold hover:bg-editorial-line/20 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    Làm Mới Cache
                  </button>
                  <button
                    onClick={saveHomepageSettings}
                    disabled={uploading}
                    className="bg-editorial-accent text-white py-4 px-12 uppercase text-[10px] tracking-[4px] font-bold hover:bg-editorial-accent/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading && <Loader size={12} className="animate-spin" />}
                    Lưu Trang Chủ
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      <Footer />
      {cropState && (
        <ImageCropDialog
          imageSrc={cropState.src}
          aspectRatio={cropState.aspect}
          onCancel={() => setCropState(null)}
          onComplete={cropState.onComplete}
        />
      )}
    </div>
  );
}
