// app/tables/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import {
  getRegions,
  createRegion,
  getTablesByRegion,
  addTable,
  deleteTable,
} from "../orders/actions"; // actions.js içindeki fonksiyonlar

export default function TablesManagementPage() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [tables, setTables] = useState([]);
  
  // Yeni bölge eklerken kullanılan input
  const [newRegionName, setNewRegionName] = useState("");

  useEffect(() => {
    loadRegions();
  }, []);

  // Bölgeleri yükle
  async function loadRegions() {
    const regionsData = await getRegions();
    setRegions(regionsData);

    // Varsayılan olarak ilk bölgeyi seçip masaları yükle
    if (regionsData.length > 0) {
      setSelectedRegion(regionsData[0].id);
      loadTables(regionsData[0].id);
    }
  }

  // Seçili bölgenin masalarını yükle
  async function loadTables(regionId) {
    const tbl = await getTablesByRegion(regionId);
    setTables(tbl);
  }

  // Yeni bölge ekle
  async function handleAddRegion() {
    if (!newRegionName.trim()) return;
    await createRegion(newRegionName);
    setNewRegionName("");
    await loadRegions(); // Bölgeleri yeniden yükle
  }

  // Seçili bölgeye masa ekle
  async function handleAddTable() {
    if (!selectedRegion) return;
    await addTable(selectedRegion);
    loadTables(selectedRegion);
  }

  // Masa sil
  async function handleDeleteTable(tableId) {
    await deleteTable(tableId);
    loadTables(selectedRegion);
  }

  // Bölge seçimi değişince masaları yükle
  function handleRegionChange(e) {
    const regionId = e.target.value;
    setSelectedRegion(regionId);
    loadTables(regionId);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Masa Yönetimi</h1>

      {/* BÖLGE EKLE */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Yeni Bölge Adı:</label>
        <input
          type="text"
          value={newRegionName}
          onChange={(e) => setNewRegionName(e.target.value)}
          className="border p-1 mr-2"
        />
        <button
          onClick={handleAddRegion}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Bölge Ekle
        </button>
      </div>

      {/* BÖLGE SEÇİMİ */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Bölge Seç:</label>
        <select
          value={selectedRegion || ""}
          onChange={handleRegionChange}
          className="border p-1"
        >
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* MASA EKLE BUTONU */}
      <button onClick={handleAddTable} className="px-4 py-2 bg-green-300 rounded">
        Masa Ekle
      </button>

      {/* MASALAR LİSTESİ */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-gray-200 p-4 rounded">
            <div className="font-semibold">Masa {table.tableId}</div>
            <button
              onClick={() => handleDeleteTable(table.id)}
              className="mt-2 bg-red-400 text-white rounded px-2 py-1"
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
