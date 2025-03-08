// src/app/sidebar.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar({ children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false); // İstatistikler alt menü açık/kapalı

  // Prefetch fonksiyonu: Fare menü öğesi üzerine gelince sayfayı önceden yükler
  function handleHover(route) {
    router.prefetch(route);
  }

  // Tıklama fonksiyonu: sayfaya git, menüyü kapat
  function handleClick(route) {
    router.push(route);
    setOpen(false);
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Üst Bar */}
      <header className="bg-gray-800 text-white p-2 flex items-center">
        <button onClick={() => setOpen(!open)} className="mr-2">
          ☰
        </button>
        <h1 className="font-bold">Kafem</h1>
      </header>

      {/* Sayfa İçeriği */}
      <main>{children}</main>

      {/* Soldan açılan sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white
          transform transition-transform duration-300 z-50
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4">
          {/* Kapat Butonu */}
          <button onClick={() => setOpen(false)} className="mb-4">
            X
          </button>

          {/* Ana Menü Butonları (manual prefetch + push) */}
          <nav className="flex flex-col gap-2">
            <button
              onMouseEnter={() => handleHover("/orders")}
              onClick={() => handleClick("/orders")}
              className="hover:bg-gray-700 p-2 rounded text-left"
            >
              Masalar
            </button>

            <button
              onMouseEnter={() => handleHover("/tables")}
              onClick={() => handleClick("/tables")}
              className="hover:bg-gray-700 p-2 rounded text-left"
            >
              Masa Yönetimi
            </button>

            <button
              onMouseEnter={() => handleHover("/products")}
              onClick={() => handleClick("/products")}
              className="hover:bg-gray-700 p-2 rounded text-left"
            >
              Ürün Yönetimi
            </button>

            {/* İstatistikler (Alt Menü) */}
            <div>
              <button
                onClick={() => setStatsOpen(!statsOpen)}
                className="w-full text-left hover:bg-gray-700 p-2 rounded"
              >
                İstatistikler
              </button>

              {/* Alt Menü (Ödemeler / İptal Edilenler) */}
              {statsOpen && (
                <div className="pl-4 flex flex-col gap-1 mt-1">
                  <button
                    onMouseEnter={() => handleHover("/statistics/paid")}
                    onClick={() => handleClick("/statistics/paid")}
                    className="hover:bg-gray-700 p-1 rounded text-left"
                  >
                    Ödemeler
                  </button>
                  <button
                    onMouseEnter={() => handleHover("/statistics/canceled")}
                    onClick={() => handleClick("/statistics/canceled")}
                    className="hover:bg-gray-700 p-1 rounded text-left"
                  >
                    İptal Edilenler
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Arkada karartı (menü açıksa) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
