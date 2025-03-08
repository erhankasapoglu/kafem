// src/app/components/PrefetchButton.jsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const fetchRegions = async () => {
  const res = await axios.get("/api/regions");
  return res.data;
};

export default function PrefetchButton() {
  const queryClient = useQueryClient();

  const handlePrefetch = async () => {
    await queryClient.prefetchQuery(["regions"], fetchRegions);
  };

  return (
    <button
      onClick={handlePrefetch}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Regions Verilerini Önceden Yükle
    </button>
  );
}
