const express = require("express");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const router = express.Router();
const Order = require("../models/Order");

router.get("/generate-sales-report-excel", async (req, res) => {
  try {
    const { dateFilter, startDate, endDate, searchQuery } = req.query;

    let query = {
      "payment.status": "Completed",
    };

    const now = new Date();
    if (dateFilter === "today") {
      query["timestamps.orderedAt"] = {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lt: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (dateFilter === "week") {
      query["timestamps.orderedAt"] = {
        $gte: new Date(now.setDate(now.getDate() - 7)),
      };
    } else if (dateFilter === "month") {
      query["timestamps.orderedAt"] = {
        $gte: new Date(now.setMonth(now.getMonth() - 1)),
      };
    } else if (dateFilter === "custom" && startDate && endDate) {
      query["timestamps.orderedAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (searchQuery) {
      query.$or = [
        { orderNumber: new RegExp(searchQuery, "i") },
        { "shippingAddress.name": new RegExp(searchQuery, "i") },
        { "shippingAddress.city": new RegExp(searchQuery, "i") },
      ];
    }

    const salesData = await Order.find(query)
      .populate("product", "name description price")
      .populate("user", "name email")
      .sort({ "timestamps.orderedAt": -1 });

    const reportDir = path.join(__dirname, "../public/reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.mergeCells("A1:F1");
    worksheet.getCell("A1").value = "TIMELESS MOTORS - Sales Report";
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.addRow([]);
    worksheet.addRow(["Report Generated:", new Date().toLocaleString()]);
    worksheet.addRow(["Period:", dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)]);
    if (dateFilter === "custom") {
      worksheet.addRow(["Date Range:", `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`]);
    }
    if (searchQuery) worksheet.addRow(["Search Filter:", searchQuery]);
    worksheet.addRow([]);

    const totalSales = salesData.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalTax = salesData.reduce((sum, order) => sum + order.tax.amount, 0);
    const tenPercentSales = totalSales * 0.1;
    const ordersByPaymentMethod = {};

    salesData.forEach(order => {
      ordersByPaymentMethod[order.payment.method] = (ordersByPaymentMethod[order.payment.method] || 0) + 1;
    });

    worksheet.addRow(["Summary"]).font = { bold: true };
    worksheet.addRow(["Total Orders", salesData.length]);
    worksheet.addRow(["Total Revenue", `₹${totalSales.toLocaleString()}`]);
    worksheet.addRow(["Total Commission Earned", `₹${tenPercentSales.toLocaleString()}`]);
    worksheet.addRow(["Total Tax Collected", `₹${totalTax.toLocaleString()}`]);
    worksheet.addRow([]);

    worksheet.addRow(["Payment Method Distribution"]).font = { bold: true };
    Object.entries(ordersByPaymentMethod).forEach(([method, count]) => {
      worksheet.addRow([method, `${count} orders (${((count / salesData.length) * 100).toFixed(1)}%)`]);
    });
    worksheet.addRow([]);

    worksheet.addRow(["Order Details"]).font = { bold: true };
    worksheet.addRow(["Order #", "Date", "Customer", "Amount", "Payment Method", "Status"]).font = { bold: true };
    
    salesData.forEach(order => {
      worksheet.addRow([
        order.orderNumber,
        new Date(order.timestamps.orderedAt).toLocaleDateString(),
        order.shippingAddress.name,
        `₹${order.totalAmount.toLocaleString()}`,
        order.payment.method,
        order.payment.status,
      ]);
    });

    worksheet.columns.forEach(column => {
      column.width = column.values.reduce((max, val) => Math.max(max, val?.toString().length || 10), 10);
    });

    const fileName = `timeless-motors-sales-report-${Date.now()}.xlsx`;
    const filePath = path.join(reportDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    res.json({
      excelUrl: `/reports/${fileName}`,
      summary: {
        totalOrders: salesData.length,
        totalSales,
        totalTax,
        ordersByPaymentMethod,
        averageOrderValue: totalSales / salesData.length,
      },
    });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

module.exports = router;
