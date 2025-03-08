// src/app/components/RegionsList.jsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API'den bölgeleri çeken fonksiyon
const fetchRegions = async () => {
  const res = await axios.get("/api/regions");
  return res.data;
};

export default function RegionsList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
    staleTime: 30000, // 30 saniye boyunca veriler taze sayılır
  });

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error.message}</div>;

  return (
    <div>
      {data.map((region) => (
        <div key={region.id}>{region.name}</div>
      ))}
    </div>
  );
}
