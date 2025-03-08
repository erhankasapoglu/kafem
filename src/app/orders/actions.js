// actions.js
"use server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ---------- YENİ FONKSİYON: Tek seferde masalar + open session map ---------- */
/** Seçili bölgedeki tüm masaları ve her masanın "open" session'ını tek seferde döndürür */
export async function getRegionTablesAndSessions(regionId) {
  // 1) Bu bölgedeki tüm masaları çek
  const tables = await prisma.table.findMany({
    where: { regionId },
    orderBy: { tableId: "asc" },
  });

  // 2) Masaların ID'lerini toplayalım
  const tableIds = tables.map((t) => t.id);

  // 3) Bu tablolara ait "open" session kayıtlarını tek seferde çek
  const sessions = await prisma.tableSession.findMany({
    where: {
      tableId: { in: tableIds },
      status: "open",
    },
    include: { items: true },
  });

  // 4) tableId => session eşlemesi yapmak için bir map oluştur
  const sessionMap = {};
  for (const s of sessions) {
    sessionMap[s.tableId] = s;
  }

  // 5) Front-end'e tek seferde { tables, sessionMap } döndür
  return { tables, sessionMap };
}

/* ---------- BÖLGE (Region) FONKSİYONLARI ---------- */
export async function getRegions() {
  return await prisma.region.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createRegion(name) {
  return await prisma.region.create({ data: { name } });
}

/* ---------- MASA / OTURUM FONKSİYONLARI ---------- */

/** Bir bölgedeki tüm masaları getir (opsiyonel) */
export async function getTablesByRegion(regionId) {
  return await prisma.table.findMany({
    where: { regionId },
    orderBy: { tableId: "asc" },
  });
}

/** Tüm masaları (bölge ayırt etmeden) bulmak isterseniz: */
export async function getAllTables() {
  return await prisma.table.findMany({
    orderBy: { tableId: "asc" },
    include: { region: true },
  });
}

/** Yeni masa ekle -> Belirli bir regionId içinde en büyük tableId + 1 */
export async function addTable(regionId) {
  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) throw new Error("Bölge bulunamadı!");

  const tablesInRegion = await prisma.table.findMany({
    where: { regionId },
    orderBy: { tableId: "asc" },
  });
  let nextId = 1;
  if (tablesInRegion.length > 0) {
    nextId = tablesInRegion[tablesInRegion.length - 1].tableId + 1;
  }

  return await prisma.table.create({
    data: {
      tableId: nextId,
      regionId,
    },
  });
}

/** Bir masayı sil (tableDbId => Table modelindeki "id") */
export async function deleteTable(tableDbId) {
  // Not: Oturumlar cascade silinmez; gerekirse öncesinde ilgili session'ları da silebilirsiniz.
  return await prisma.table.delete({
    where: { id: tableDbId },
  });
}

/** Masa aç (regionId + numericTableId'ye göre bul, eğer open yoksa yeni oluştur) */
export async function openTable(regionId, numericTableId) {
  const tableData = await prisma.table.findFirst({
    where: { regionId, tableId: numericTableId },
  });
  if (!tableData) {
    throw new Error(`Bölgede (regionId=${regionId}) tableId=${numericTableId} bulunamadı!`);
  }

  let session = await prisma.tableSession.findFirst({
    where: {
      tableId: tableData.id,
      status: "open",
    },
    include: { items: true },
  });

  if (!session) {
    session = await prisma.tableSession.create({
      data: {
        tableId: tableData.id,
        status: "open",
        total: 0,
      },
      include: { items: true },
    });
  }
  return session;
}

/** Masa için açık session varsa çek (regionId, numericTableId) */
export async function getOpenSession(regionId, numericTableId) {
  const tableData = await prisma.table.findFirst({
    where: { regionId, tableId: numericTableId },
  });
  if (!tableData) return null;

  return await prisma.tableSession.findFirst({
    where: {
      tableId: tableData.id,
      status: "open",
    },
    include: { items: true },
  });
}

/** Upsert mantığıyla sipariş kalemlerini ekle/güncelle */
export async function upsertOrderItems(tableSessionId, items) {
  for (const i of items) {
    if (i.quantity === 0) {
      await prisma.tableSessionItem.deleteMany({
        where: { tableSessionId, name: i.name },
      });
    } else {
      await prisma.tableSessionItem.upsert({
        where: {
          tableSessionId_name: {
            tableSessionId,
            name: i.name,
          },
        },
        update: {
          quantity: i.quantity,
          price: i.price,
        },
        create: {
          tableSessionId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        },
      });
    }
  }

  const allItems = await prisma.tableSessionItem.findMany({
    where: { tableSessionId },
  });
  const total = allItems.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);

  return await prisma.tableSession.update({
    where: { id: tableSessionId },
    data: { total },
    include: { items: true },
  });
}

/** Yeni Bulk Fonksiyonu: Tüm sipariş kalemlerini toplu güncelle (Sil + createMany) */
export async function upsertOrderItemsBulk(tableSessionId, items) {
  // 1. Oturuma ait mevcut öğeleri toplu sil
  await prisma.tableSessionItem.deleteMany({
    where: { tableSessionId },
  });

  // 2. Yeni öğeleri toplu ekle
  await prisma.tableSessionItem.createMany({
    data: items.map((it) => ({
      tableSessionId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
    })),
  });

  // 3. Tüm öğeleri çekip toplamı hesapla
  const allItems = await prisma.tableSessionItem.findMany({
    where: { tableSessionId },
  });
  const total = allItems.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);

  return await prisma.tableSession.update({
    where: { id: tableSessionId },
    data: { total },
    include: { items: true },
  });
}

/** Masa öde => status: paid */
export async function payTable(sessionId, paymentMethod) {
  const session = await prisma.tableSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found!");
  if (session.status !== "open") throw new Error("Session not open!");

  return await prisma.tableSession.update({
    where: { id: sessionId },
    data: {
      status: "paid",
      paymentMethod,
      closedAt: new Date(),
    },
  });
}

/** Masa iptal => status: canceled */
export async function cancelTable(sessionId) {
  const session = await prisma.tableSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found!");
  if (session.status !== "open") throw new Error("Session not open!");

  return await prisma.tableSession.update({
    where: { id: sessionId },
    data: {
      status: "canceled",
      closedAt: new Date(),
    },
  });
}

/** İptal edilmiş oturumlar */
export async function getCanceledSessions() {
  return await prisma.tableSession.findMany({
    where: { status: "canceled" },
    orderBy: { closedAt: "desc" },
    include: { items: true },
  });
}

/** Ödenmiş oturumlar */
export async function getPaidSessions() {
  return await prisma.tableSession.findMany({
    where: { status: "paid" },
    orderBy: { closedAt: "desc" },
    include: { items: true },
  });
}

/* ---------- ÜRÜN (MENU) FONKSİYONLARI ---------- */

/** Tüm ürünleri (Product) getir */
export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { name: "asc" },
  });
}

/** Yeni ürün ekle */
export async function createProduct(name, price) {
  return await prisma.product.create({
    data: { name, price },
  });
}

/** Ürün sil */
export async function deleteProduct(productId) {
  return await prisma.product.delete({
    where: { id: productId },
  });
}
