"use client";

import React, { useEffect, useState } from "react";
import {
  getRegions,
  getRegionTablesAndSessions, // Güncel fonksiyon
  openTable,
  // Eski upsertOrderItems yerine bulk fonksiyon kullanacağız:
  upsertOrderItemsBulk,
  payTable,
  cancelTable,
  getProducts,
  getCanceledSessions,
  getPaidSessions,
} from "./actions"; // Güncel actions.js fonksiyonları

export default function OrdersPage() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);

  // Modal / Sipariş durumu
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTableIndex, setSelectedTableIndex] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // İptal / Ödenen listeleri (opsiyonel)
  const [canceledList, setCanceledList] = useState([]);
  const [paidList, setPaidList] = useState([]);

  // Sayfa yüklenince: bölgeleri ve ürünleri çek, ilk bölgeyi seç
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    const r = await getRegions();
    setRegions(r);
    if (r.length > 0) {
      setSelectedRegion(r[0].id);
      await loadTablesForRegion(r[0].id);
    }
    const prods = await getProducts();
    setProducts(prods);
  }

  // Tek API isteğiyle, seçili bölgeye ait masaları ve open session'ları çek
  async function loadTablesForRegion(regionId) {
    const { tables, sessionMap } = await getRegionTablesAndSessions(regionId);
    setTables(tables);
    // Her masa için, sessionMap'te varsa onu, yoksa null
    const sArr = tables.map((t) => sessionMap[t.id] || null);
    setSessions(sArr);
  }

  // Bölge sekmesine tıklayınca
  async function handleRegionTabClick(regionId) {
    setSelectedRegion(regionId);
    await loadTablesForRegion(regionId);
    setShowOrderModal(false);
    setShowPaymentModal(false);
  }

  // Masa tıklayınca: openTable çağır, sipariş modalı aç
  async function handleTableClick(i) {
    const t = tables[i];
    if (!selectedRegion) return;
    const session = await openTable(selectedRegion, t.tableId);
    setSessions((prev) => {
      const copy = [...prev];
      copy[i] = session;
      return copy;
    });
    setSelectedTableIndex(i);

    const initQty = {};
    products.forEach((p) => {
      initQty[p.id] = 0;
    });
    if (session?.items) {
      for (let it of session.items) {
        const found = products.find((p) => p.name === it.name);
        if (found) {
          initQty[found.id] = it.quantity;
        }
      }
    }
    setSelectedQuantities(initQty);
    setShowOrderModal(true);
  }

  // Sipariş modalı kapatılırken: eğer toplam miktar 0 ise oturumu iptal et
  function closeOrderModal() {
    setShowOrderModal(false);
    const s = sessions[selectedTableIndex];
    if (!s) return;
    const totalQty = Object.values(selectedQuantities).reduce((a, c) => a + c, 0);
    if (totalQty === 0) {
      cancelTable(s.id).then(() => {
        setSessions((prev) => {
          const copy = [...prev];
          copy[selectedTableIndex] = null;
          return copy;
        });
      });
    }
  }

  // Siparişi kaydet: Bulk işlem kullanarak, upsertOrderItemsBulk
  async function handleAddOrder() {
    const s = sessions[selectedTableIndex];
    if (!s) return;

    // Toplam miktar hesapla
    const totalQty = Object.values(selectedQuantities).reduce((a, c) => a + c, 0);
    if (totalQty === 0) {
      await cancelTable(s.id);
      setSessions((prev) => {
        const copy = [...prev];
        copy[selectedTableIndex] = null;
        return copy;
      });
      setShowOrderModal(false);
      return;
    }

    // Her ürünü chosenItems dizisine ekliyoruz, 0 olanlar da gönderilecek
    const chosenItems = products.map((p) => ({
      name: p.name,
      price: p.price,
      quantity: selectedQuantities[p.id] || 0,
    }));

    // Bulk işlem: mevcut sipariş kalemlerini sil + yeni öğeleri ekle, toplamı güncelle
    const updated = await upsertOrderItemsBulk(s.id, chosenItems);
    setSessions((prev) => {
      const copy = [...prev];
      copy[selectedTableIndex] = updated;
      return copy;
    });
    setShowOrderModal(false);
  }

  // Masa iptal
  async function handleCancelTable(i) {
    const s = sessions[i];
    if (!s) return;
    await cancelTable(s.id);
    setSessions((prev) => {
      const copy = [...prev];
      copy[i] = null;
      return copy;
    });
  }

  // Ödeme modalını aç
  function handlePaymentModal(i) {
    setSelectedTableIndex(i);
    setPaymentMethod("cash");
    setShowPaymentModal(true);
  }
  async function handleConfirmPayment() {
    const s = sessions[selectedTableIndex];
    if (!s) return;
    await payTable(s.id, paymentMethod);
    setSessions((prev) => {
      const copy = [...prev];
      copy[selectedTableIndex] = null;
      return copy;
    });
    setShowPaymentModal(false);
  }

  // Ürün miktar butonları
  function increment(prodId) {
    setSelectedQuantities((prev) => ({
      ...prev,
      [prodId]: (prev[prodId] || 0) + 1,
    }));
  }
  function decrement(prodId) {
    setSelectedQuantities((prev) => ({
      ...prev,
      [prodId]: Math.max((prev[prodId] || 0) - 1, 0),
    }));
  }

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Ana Sayfa - Masa/Sipariş Yönetimi</h1>

      {/* Bölge Sekmeleri */}
      <div className="flex gap-2">
        {regions.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRegionTabClick(r.id)}
            className={`px-3 py-1 rounded ${
              selectedRegion === r.id ? "bg-blue-600 text-white" : "bg-gray-300"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Masalar */}
      <div className="flex gap-4 flex-wrap mt-4">
        {tables.map((table, i) => {
          const session = sessions[i];
          let color = "bg-gray-200";
          let display = "Açılmamış";

          if (session) {
            const itemCount =
              session.items?.reduce((acc, cur) => acc + cur.quantity, 0) || 0;
            if (session.status === "open") {
              color = itemCount > 0 ? "bg-green-200" : "bg-gray-200";
              display = `Açık - ${session.total} TL`;
            } else if (session.status === "paid") {
              color = "bg-blue-200";
              display = `Ödendi - ${session.total} TL`;
            } else if (session.status === "canceled") {
              color = "bg-red-200";
              display = `İptal - ${session.total} TL`;
            }
          }

          return (
            <div
              key={table.id}
              className={`w-40 h-40 flex flex-col justify-center items-center cursor-pointer relative ${color}`}
              onClick={() => {
                if (!session || session.status === "open") {
                  handleTableClick(i);
                }
              }}
            >
              <div className="font-bold">Masa {table.tableId}</div>
              <div>{display}</div>
              {session && session.status === "open" && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePaymentModal(i);
                    }}
                    className="px-2 py-1 bg-blue-400 text-white rounded"
                  >
                    Öde
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelTable(i);
                    }}
                    className="px-2 py-1 bg-red-400 text-white rounded"
                  >
                    İptal
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sipariş Ekle Modal */}
      {showOrderModal && selectedTableIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-4 rounded w-72">
            <h2 className="text-xl font-bold mb-2">
              Masa {tables[selectedTableIndex].tableId} Sipariş Ekle
            </h2>
            <div
              className="flex flex-col gap-4 mb-4"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {products.length === 0 && <div>Menüde ürün yok.</div>}
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span>
                    {p.name} - {p.price} TL
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrement(p.id)}
                      className="px-2 py-1 bg-gray-300 rounded"
                    >
                      -
                    </button>
                    <span>{selectedQuantities[p.id] || 0}</span>
                    <button
                      onClick={() => increment(p.id)}
                      className="px-2 py-1 bg-gray-300 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={closeOrderModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Kapat
              </button>
              <button
                onClick={handleAddOrder}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Modal */}
      {showPaymentModal && selectedTableIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-4 rounded">
            <h2 className="text-xl font-bold mb-2">
              Ödeme: Masa {tables[selectedTableIndex].tableId}
            </h2>
            <div className="flex gap-4 mb-4">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="ml-2">Nakit</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="ml-2">Kart</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
