/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import CartSidebar from "./components/CartSidebar";
import ChatWidget from "./components/ChatWidget";
import HomePage from "./pages/HomePage";
import CollectionsPage from "./pages/CollectionsPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetailPage from "./pages/ProductDetailPage";

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <CartProvider>
          <CartSidebar />
          <ChatWidget />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </CartProvider>
      </ToastProvider>
    </Router>
  );
}

