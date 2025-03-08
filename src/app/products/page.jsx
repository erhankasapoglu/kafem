"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
// ÖNEMLİ: actions.js dosyası orders klasöründe ise yol şu şekilde olmalı
import { getProducts, createProduct, deleteProduct } from "../orders/actions";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const prods = await getProducts();
      setProducts(prods);
    }
    loadProducts();
  }, []);

  async function handleAddProduct() {
    if (!productName.trim() || !productPrice.trim()) return;
    const pval = parseFloat(productPrice);
    if (isNaN(pval) || pval <= 0) {
      alert("Fiyat sıfırdan büyük olmalı");
      return;
    }
    const newProd = await createProduct(productName, pval);
    setProducts((prev) => [...prev, newProd]);
    setProductName("");
    setProductPrice("");
  }

  async function handleDeleteProduct(id) {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
      <div className="mt-4">
        {/* Masalar Ekranı'na geri dönmek için link */}
        <Link href="/orders" className="px-4 py-2 bg-gray-200 rounded">
          &larr; Geri (Masalar Ekranı)
        </Link>
      </div>

      <div className="bg-gray-100 p-4 mt-4 rounded max-w-sm">
        <h2 className="text-lg font-semibold mb-2">Yeni Ürün Ekle</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="border px-2 py-1 flex-1"
            placeholder="Ürün adı"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <input
            type="number"
            className="border px-2 py-1 w-24"
            placeholder="Fiyat"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
          />
          <button
            onClick={handleAddProduct}
            className="px-4 bg-green-400 text-white rounded"
          >
            Ekle
          </button>
        </div>
      </div>

      <div className="mt-4 max-w-sm">
        <h2 className="text-md font-semibold">Mevcut Ürünler</h2>
        {products.length === 0 ? (
          <div>Henüz ürün yok.</div>
        ) : (
          <ul className="space-y-2 mt-2">
            {products.map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                <span>
                  {p.name} - {p.price} TL
                </span>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="px-2 py-1 bg-red-400 text-white rounded text-sm"
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
