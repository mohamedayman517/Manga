const { admin, db } = require("./firebase");
const fetchProductsFromFirebase = require("./fetchProducts");
const { writeSheet } = require("./googleSheets");

async function exportAllToSheets({ spreadsheetId }) {
  if (!spreadsheetId) throw new Error("spreadsheetId is required");

  // 1) Transactions
  const txSnap = await db.collection("transactions").get();
  const txHeaders = [
    "id",
    "createdAt",
    "currency",
    "totalPrice",
    "paymentMethod",
    "uid",
    "referralEmail",
    "latestStatus",
    "itemsJSON",
  ];
  const txRows = [];
  txSnap.forEach((doc) => {
    const t = { id: doc.id, ...doc.data() };
    const createdAt = t.createdAt?._seconds ? new Date(t.createdAt._seconds * 1000).toISOString() : "";
    const latestStatus = Array.isArray(t.status) && t.status.length ? t.status[t.status.length - 1].state : "";
    const itemsJSON = JSON.stringify((t.products || []).map((p) => ({
      id: p.productId || p.id,
      title: p.title || p.name,
      price: p.price,
      qty: p.quantity,
    })));
    txRows.push([
      t.id,
      createdAt,
      t.currency || "",
      t.totalPrice || "",
      t.paymentMethod || "",
      t.uid || "",
      t.referralEmail || "",
      latestStatus,
      itemsJSON,
    ]);
  });
  await writeSheet({ spreadsheetId, sheetName: "Transactions", headers: txHeaders, rows: txRows });

  // 2) Points
  const usersSnap = await db.collection("users").get();
  const ptHeaders = ["uid", "email", "cashbackPoints", "displayName"];
  const ptRows = [];
  for (const doc of usersSnap.docs) {
    const u = { id: doc.id, ...doc.data() };
    let email = "";
    let displayName = u.name || "";
    try {
      const userRecord = await admin.auth().getUser(u.id);
      email = userRecord.email || "";
      displayName = displayName || userRecord.displayName || "";
    } catch (_) {}
    ptRows.push([u.id, email, u.cashbackPoints || 0, displayName]);
  }
  await writeSheet({ spreadsheetId, sheetName: "Points", headers: ptHeaders, rows: ptRows });

  // 3) Stocks
  const data = await fetchProductsFromFirebase();
  const products = (data && data.products) || [];
  const stHeaders = [
    "id",
    "name",
    "price",
    "categoryId",
    "subcategoryName",
    "isFeatured",
    "accountTypesJSON",
  ];
  const stRows = products.map((p) => [
    p.id,
    p.name || "",
    p.price ?? "",
    p.categoryId || "",
    p.subcategoryName || "",
    !!p.isFeatured,
    JSON.stringify(p.accountTypes || []),
  ]);
  await writeSheet({ spreadsheetId, sheetName: "Stocks", headers: stHeaders, rows: stRows });

  return { Transactions: txRows.length, Points: ptRows.length, Stocks: stRows.length };
}

module.exports = { exportAllToSheets };
