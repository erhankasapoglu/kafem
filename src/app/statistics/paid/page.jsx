// src/app/statistics/paid/page.jsx
"use client";

import { useEffect, useState } from "react";
import { getPaidSessions } from "../../orders/actions";

export default function PaidStatisticsPage() {
  const [paidList, setPaidList] = useState([]);

  useEffect(() => {
    loadPaid();
  }, []);

  async function loadPaid() {
    const list = await getPaidSessions();
    setPaidList(list);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ödenen Siparişler</h1>
      {paidList.length === 0 ? (
        <div>Henüz ödenmiş sipariş yok.</div>
      ) : (
        paidList.map((p) => (
          <div key={p.id} className="border p-2 mb-2">
            <p>Session ID: {p.id}</p>
            <p>Toplam: {p.total} TL</p>
            <p>Ödeme Yöntemi: {p.paymentMethod}</p>
            <p>
              Kapanış:{" "}
              {p.closedAt ? new Date(p.closedAt).toLocaleString() : ""}
            </p>
            <ul className="ml-4 list-disc">
              {p.items?.map((it) => (
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
