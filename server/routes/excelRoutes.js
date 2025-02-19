const express = require("express");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const router = express.Router();
const Order = require("../models/Order");

router.get("/generate-sales-report-excel", async (req, res) => {
  try {
    const { dateFilter, startDate, endDate, searchQuery } = req.query;

    let query = { orderStatus: "Confirmed" };

    // Apply Date Filtering
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

    // Apply Search Filtering
    if (searchQuery) {
      query.$or = [
        { orderNumber: new RegExp(searchQuery, "i") },
        { "shippingAddress.name": new RegExp(searchQuery, "i") },
        { "shippingAddress.city": new RegExp(searchQuery, "i") },
      ];
    }

    // Fetch Confirmed Sales Data
    const salesData = await Order.find(query)
      .populate("product", "name description price")
      .populate("user", "name email")
      .sort({ "timestamps.orderedAt": -1 });

    // Create reports directory if it doesn't exist
    const reportDir = path.join(__dirname, "../public/reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Create Excel Workbook & Sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Title & Metadata
    worksheet.mergeCells("A1:F1");
    worksheet.getCell("A1").value = "Confirmed Orders Report";
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.addRow([]);
    worksheet.addRow(["Generated:", new Date().toLocaleString()]);
    worksheet.addRow(["Filter:", dateFilter]);

    if (dateFilter === "custom") {
      worksheet.addRow(["Period:", `${startDate} to ${endDate}`]);
    }
    if (searchQuery) {
      worksheet.addRow(["Search Query:", searchQuery]);
    }
    worksheet.addRow([]);

    // Summary Statistics
    const totalSales = salesData.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalTax = salesData.reduce((sum, order) => sum + order.tax.amount, 0);
    const ordersByPaymentMethod = {};
    const paymentStatusCount = {};

    salesData.forEach((order) => {
      ordersByPaymentMethod[order.payment.method] =
        (ordersByPaymentMethod[order.payment.method] || 0) + 1;
      paymentStatusCount[order.payment.status] =
        (paymentStatusCount[order.payment.status] || 0) + 1;
    });

    worksheet.addRow(["Summary"]);
    worksheet.addRow(["Total Confirmed Orders", salesData.length]);
    worksheet.addRow(["Total Sales Amount", `₹${totalSales.toLocaleString()}`]);
    worksheet.addRow(["Total Tax Collected", `₹${totalTax.toLocaleString()}`]);
    worksheet.addRow([]);

    // Payment Method Distribution
    worksheet.addRow(["Payment Method Distribution"]);
    Object.entries(ordersByPaymentMethod).forEach(([method, count]) => {
      worksheet.addRow([method, `${count} orders`]);
    });
    worksheet.addRow([]);

    // Payment Status Distribution
    worksheet.addRow(["Payment Status Distribution"]);
    Object.entries(paymentStatusCount).forEach(([status, count]) => {
      worksheet.addRow([status, `${count} orders`]);
    });
    worksheet.addRow([]);

    // Detailed Orders Table
    worksheet.addRow([
      "Order #",
      "Date",
      "Customer",
      "Amount",
      "Payment Method",
      "Payment Status",
    ]).font = { bold: true };

    salesData.forEach((order) => {
      worksheet.addRow([
        order.orderNumber,
        new Date(order.timestamps.orderedAt).toLocaleDateString(),
        order.shippingAddress.name,
        `₹${order.totalAmount.toLocaleString()}`,
        order.payment.method,
        order.payment.status,
      ]);
    });

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      column.width = column.values.reduce(
        (max, val) => Math.max(max, val?.toString().length || 10),
        10
      );
    });

    // Save Excel File
    const fileName = `confirmed-sales-report-${Date.now()}.xlsx`;
    const filePath = path.join(reportDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    // Return URL
    res.json({
      excelUrl: `/reports/${fileName}`,
      summary: {
        totalOrders: salesData.length,
        totalSales,
        totalTax,
        ordersByPaymentMethod,
        paymentStatusCount,
      },
    });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

module.exports = router;
