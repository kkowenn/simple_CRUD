// Code.gs.js ->  Code.gs
// ✅ Server-side Code.gs (cleaned up version)

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Stock');
  if (!sheet) {
    throw new Error("❌ Sheet 'Stock' not found. Please check the tab name.");
  }
  const data = sheet.getDataRange().getDisplayValues();
  const headers = data.shift();
  return { data: data, headers: headers };
}

function getProductNames() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Stock');
  const data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  const names = data.flat().filter(name => name && name.toString().trim() !== '');
  return [...new Set(names)];
}

function updateStockBySelling(productName, quantitySold, customerName) {
  Logger.log("🟡 Called updateStockBySelling with:");
  Logger.log("productName: " + productName);
  Logger.log("quantitySold: " + quantitySold);
  Logger.log("customerName: " + customerName);

  const sheetStock = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Stock');
  const sheetOrder = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SalesLog'); // ✅ เปลี่ยนจาก 'Order' เป็น 'SalesLog'
  const stockData = sheetStock.getDataRange().getValues();

  let found = false;
  let price = 0;
  let oldQuantity = 0;

  for (let i = 1; i < stockData.length; i++) {
    if (stockData[i][1] === productName) {
      price = Number(stockData[i][5]);
      oldQuantity = Number(stockData[i][2]);
      found = true;

      Logger.log("📦 Found product. Old quantity: " + oldQuantity);

      if (quantitySold > oldQuantity) {
        Logger.log("❌ quantitySold > stock. Stopping.");
        return "❌ จำนวนที่ขายมากกว่าของที่มีใน stock";
      }

      const newQuantity = oldQuantity - quantitySold;
      sheetStock.getRange(i + 1, 3).setValue(newQuantity);
      break;
    }
  }

  if (!found) {
    Logger.log("❌ Product not found in stock.");
    return "❌ ไม่พบชื่อสินค้านี้ในระบบ";
  }

  // Proceed to save to Order
  const timestamp = new Date();
  const totalPrice = quantitySold * price;
  const newOrderId = generateNextOrderId(sheetOrder);

  Logger.log("✅ Writing to Order sheet...");

  sheetOrder.appendRow([
    newOrderId,
    productName,
    customerName,
    timestamp,
    quantitySold,
    totalPrice,
    timestamp.getDate(),
    timestamp.toLocaleString('en-US', { weekday: 'long' }),
    timestamp.getMonth() + 1,
    timestamp.toLocaleString('th-TH', { weekday: 'long' }),
    (timestamp.getHours() < 12) ? "Morning" :
    (timestamp.getHours() < 15) ? "Noon" :
    (timestamp.getHours() < 18) ? "Afternoon" : "Evening"
  ]);

  Logger.log("✅ Order row saved.");
  return "✅ บันทึกการขายและอัปเดตจำนวนคงเหลือเรียบร้อยแล้ว";
}


function getStockByProductName(productName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Stock');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === productName) {
      return Number(data[i][2]);
    }
  }
  return 0;
}

function addNewProduct(product) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Stock");
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  
  // Check for duplicate รหัสสินค้า
  const codeIndex = header.indexOf("รหัสสินค้า");
  const existingCodes = data.slice(1).map(row => row[codeIndex]);
  if (existingCodes.includes(product.code)) {
    throw new Error("รหัสสินค้านี้มีอยู่แล้วในระบบ");
  }

  // Append new row
  sheet.appendRow([
    product.code,
    product.name,
    product.quantity,
    product.minQty,
    product.costPrice,
    product.sellPrice,
    product.updateDate,
    "ปกติ",
    product.imageUrl
  ]);
}

function generateNextOrderId(sheet) {
  const lastRow = sheet.getLastRow();
  
  // ถ้ายังไม่มี order ใดๆ เลย
  if (lastRow <= 1) {
    return "ORD0001";
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); // ✅ now safe
  const numbers = data
    .map(row => row[0])
    .filter(id => typeof id === 'string' && id.startsWith('ORD'))
    .map(id => parseInt(id.slice(3)))
    .filter(n => !isNaN(n));

  const maxId = numbers.length > 0 ? Math.max(...numbers) : 0;
  return "ORD" + String(maxId + 1).padStart(4, '0');
}





