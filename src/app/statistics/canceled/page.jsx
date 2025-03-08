// src/app/statistics/canceled/page.jsx
"use client";

import { useEffect, useState } from "react";
import { getCanceledSessions } from "../../orders/actions";

export default function CanceledStatisticsPage() {
  const [canceledList, setCanceledList] = useState([]);

  useEffect(() => {
    loadCanceled();
  }, []);

  async function loadCanceled() {
    const list = await getCanceledSessions();
    setCanceledList(list);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">İptal Edilen Siparişler</h1>
      {canceledList.length === 0 ? (
        <div>Henüz iptal edilen sipariş yok.</div>
      ) : (
        canceledList.map((c) => (
          <div key={c.id} className="border p-2 mb-2">
            <p>Session ID: {c.id}</p>
            <p>Toplam: {c.total} TL</p>
            <p>
              Kapanış:{" "}
              {c.closedAt ? new Date(c.closedAt).toLocaleString() : ""}
            </p>
            <ul className="ml-4 list-disc">
              {c.items?.map((it) => (
                <li key={it.id}>
                  {it.name} x {it.quantity} = {it.price * it.quantity} TL
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
