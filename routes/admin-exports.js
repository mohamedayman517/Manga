const express = require("express");
const router = express.Router();
const verifyAdmin = require("../middlewares/verifyAdmin");
const { admin, db } = require("../utils/firebase");
const fetchProductsFromFirebase = require("../utils/fetchProducts");
const { writeSheet } = require("../utils/googleSheets");
require("dotenv").config();

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

function ensureSheetEnv(res) {
  if (!SPREADSHEET_ID) {
    res.status(500).json({ success: false, error: "Missing GOOGLE_SPREADSHEET_ID in .env" });
    return false;
  }
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    res.status(500).json({ success: false, error: "Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY in .env" });
    return false;
  }
  return true;
}

router.get("/admin/exports", verifyAdmin, async (req, res) => {
  if (!ensureSheetEnv(res)) return;
  res.render("admin/exports", { spreadsheetId: SPREADSHEET_ID });
});

router.post("/admin/export/transactions", verifyAdmin, async (req, res) => {
  try {
    if (!ensureSheetEnv(res)) return;
    const snap = await db.collection("transactions").get();
    const rows = [];
    const headers = [
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

    snap.forEach((doc) => {
      const t = { id: doc.id, ...doc.data() };
      const createdAt = t.createdAt?._seconds ? new Date(t.createdAt._seconds * 1000).toISOString() : "";
      const latestStatus = Array.isArray(t.status) && t.status.length ? t.status[t.status.length - 1].state : "";
      const itemsJSON = JSON.stringify((t.products || []).map((p) => ({
        id: p.productId || p.id,
        title: p.title || p.name,
        price: p.price,
        qty: p.quantity,
      })));
      rows.push([
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

    await writeSheet({
      spreadsheetId: SPREADSHEET_ID,
      sheetName: "Transactions",
      headers,
      rows,
    });

    res.json({ success: true, count: rows.length, sheet: "Transactions" });
  } catch (e) {
    const apiErr = e && e.response && e.response.data ? e.response.data : null;
    console.error("Export transactions failed:", e.message, apiErr || "");
    res.status(500).json({ success: false, error: e.message, api: apiErr });
  }
});

router.post("/admin/export/points", verifyAdmin, async (req, res) => {
  try {
    if (!ensureSheetEnv(res)) return;
    const snap = await db.collection("users").get();
    const headers = ["uid", "email", "cashbackPoints", "displayName"];
    const rows = [];

    for (const doc of snap.docs) {
      const u = { id: doc.id, ...doc.data() };
      let email = "";
      let displayName = u.name || "";
      try {
        const userRecord = await admin.auth().getUser(u.id);
        email = userRecord.email || "";
        displayName = displayName || userRecord.displayName || "";
      } catch (_) {}
      rows.push([u.id, email, u.cashbackPoints || 0, displayName]);
    }

    await writeSheet({
      spreadsheetId: SPREADSHEET_ID,
      sheetName: "Points",
      headers,
      rows,
    });

    res.json({ success: true, count: rows.length, sheet: "Points" });
  } catch (e) {
    const apiErr = e && e.response && e.response.data ? e.response.data : null;
    console.error("Export points failed:", e.message, apiErr || "");
    res.status(500).json({ success: false, error: e.message, api: apiErr });
  }
});

router.post("/admin/export/stocks", verifyAdmin, async (req, res) => {
  try {
    if (!ensureSheetEnv(res)) return;
    // Use existing cached fetcher for products
    const data = await fetchProductsFromFirebase();
    const products = (data && data.products) || [];

    const headers = [
      "id",
      "name",
      "price",
      "categoryId",
      "subcategoryName",
      "isFeatured",
      "accountTypesJSON",
    ];
    const rows = products.map((p) => [
      p.id,
      p.name || "",
      p.price ?? "",
      p.categoryId || "",
      p.subcategoryName || "",
      !!p.isFeatured,
      JSON.stringify(p.accountTypes || []),
    ]);

    await writeSheet({
      spreadsheetId: SPREADSHEET_ID,
      sheetName: "Stocks",
      headers,
      rows,
    });

    res.json({ success: true, count: rows.length, sheet: "Stocks" });
  } catch (e) {
    const apiErr = e && e.response && e.response.data ? e.response.data : null;
    console.error("Export stocks failed:", e.message, apiErr || "");
    res.status(500).json({ success: false, error: e.message, api: apiErr });
  }
});

module.exports = router;
