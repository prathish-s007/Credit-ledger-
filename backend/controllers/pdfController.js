import PDFDocument from 'pdfkit';
import Customer from '../models/Customer.js';
import Purchase from '../models/Purchase.js';
import Payment from '../models/Payment.js';
import ShopOwner from '../models/ShopOwner.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Generate Customer Monthly Statement PDF
// @route   GET /api/ledgers/customer/:customerId/statement/pdf
// @access  Protected (Shop Owner Only)
export const generateCustomerStatementPDF = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;
  const { startDate, endDate } = req.query;

  // 1. Fetch Customer & ShopOwner Details
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  if (
    customer.shopOwner.toString() !== req.user._id.toString() &&
    customer._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to access statement.', 403);
  }

  const shopOwner = await ShopOwner.findById(customer.shopOwner);
  if (!shopOwner) {
    throw new AppError('Shop Owner information not found.', 404);
  }

  // 2. Determine Date Range
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 3. Compute opening balance before start date
  const prePurchases = await Purchase.find({
    customer: customerId,
    createdAt: { $lt: start },
  });
  const prePayments = await Payment.find({
    customer: customerId,
    createdAt: { $lt: start },
  });

  const prePurchasesSum = prePurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const prePaymentsSum = prePayments.reduce((sum, py) => sum + (py.amount || 0), 0);
  const openingBalance = prePurchasesSum - prePaymentsSum;

  // 4. Fetch transactions within range
  const dateQuery = { $gte: start, $lte: end };
  const purchases = await Purchase.find({ customer: customerId, createdAt: dateQuery });
  const payments = await Payment.find({ customer: customerId, createdAt: dateQuery });

  // 5. Merge and sort chronologically
  const purchaseEntries = purchases.map((p) => ({
    date: p.createdAt,
    type: 'purchase',
    description: `Purchase: ${p.products?.length || 0} item(s)`,
    reference: p.purchaseId,
    debit: p.totalAmount || 0,
    credit: 0,
  }));

  const paymentEntries = payments.map((py) => ({
    date: py.createdAt,
    type: 'payment',
    description: `Payment: ${py.paymentMethod}`,
    reference: py.remarks || 'Settle Payment',
    debit: 0,
    credit: py.amount || 0,
  }));

  const ledger = [...purchaseEntries, ...paymentEntries];
  ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate running balance
  let runningBalance = openingBalance;
  const ledgerWithBalances = ledger.map((entry) => {
    runningBalance = runningBalance + entry.debit - entry.credit;
    return {
      ...entry,
      remainingBalance: runningBalance,
    };
  });

  // Totals calculations (All-time totals for closing display)
  const allPurchases = await Purchase.find({ customer: customerId });
  const allPayments = await Payment.find({ customer: customerId });
  const totalPurchases = allPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPayments = allPayments.reduce((sum, py) => sum + (py.amount || 0), 0);

  // 6. Initialize PDF Document
  const doc = new PDFDocument({ margin: 50 });
  
  // Set headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=statement-${customer.name.replace(/\s+/g, '_')}.pdf`);
  
  // Pipe doc directly to express response
  doc.pipe(res);

  // --- DRAW PDF CONTENT ---

  // Primary Colors
  const primaryColor = '#1e293b';
  const darkGray = '#475569';
  const lightGray = '#94a3b8';
  const lineStrokeColor = '#e2e8f0';

  // Header Shop Info
  doc.fillColor(primaryColor).fontSize(20).text(shopOwner.shopName || 'Digital Credit Ledger', 50, 50, { bold: true });
  doc.fillColor(darkGray).fontSize(10).text(`Owner: ${shopOwner.name}`, 50, 75);
  doc.text(`Mobile: ${shopOwner.mobileNumber}`, 50, 90);
  doc.text(`Email: ${shopOwner.email}`, 50, 105);

  // Document Title
  doc.fillColor(primaryColor).fontSize(16).text('LEDGER STATEMENT', 350, 50, { align: 'right', bold: true });
  doc.fillColor(darkGray).fontSize(9).text(`Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`, 350, 75, { align: 'right' });
  doc.text(`Statement Date: ${now.toLocaleDateString()}`, 350, 90, { align: 'right' });

  // Divider Line
  doc.moveTo(50, 125).lineTo(560, 125).strokeColor(lineStrokeColor).stroke();

  // Customer Info Card
  doc.fillColor(primaryColor).fontSize(10).text('BILL TO:', 50, 140, { bold: true });
  doc.fillColor(primaryColor).fontSize(12).text(customer.name, 50, 155, { bold: true });
  doc.fillColor(darkGray).fontSize(10).text(`Mobile: ${customer.mobileNumber}`, 50, 172);
  if (customer.email) doc.text(`Email: ${customer.email}`, 50, 187);
  if (customer.address) doc.text(`Address: ${customer.address}`, 50, 202);

  // Closing details card
  doc.fillColor(primaryColor).fontSize(10).text('ACCOUNT SUMMARY:', 350, 140, { bold: true });
  doc.fillColor(darkGray).fontSize(10).text(`All-time Purchases: Rs.${totalPurchases.toFixed(2)}`, 350, 155);
  doc.text(`All-time Payments: Rs.${totalPayments.toFixed(2)}`, 350, 172);
  doc.fillColor(primaryColor).text(`Outstanding Balance: Rs.${customer.currentBalance.toFixed(2)}`, 350, 189, { bold: true });

  // Divider Line
  doc.moveTo(50, 230).lineTo(560, 230).strokeColor(lineStrokeColor).stroke();

  // Table Header
  let y = 250;
  doc.fillColor(primaryColor).fontSize(9).text('Date', 50, y, { bold: true });
  doc.text('Description', 140, y, { bold: true });
  doc.text('Reference', 280, y, { bold: true });
  doc.text('Debit (+)', 380, y, { align: 'right', bold: true });
  doc.text('Credit (-)', 450, y, { align: 'right', bold: true });
  doc.text('Balance', 510, y, { align: 'right', bold: true });

  // Header divider
  doc.moveTo(50, y + 15).lineTo(560, y + 15).strokeColor(primaryColor).stroke();
  y += 25;

  // Draw Opening Balance
  doc.fillColor(darkGray).fontSize(9).text(start.toLocaleDateString(), 50, y);
  doc.text('Opening Balance Forward', 140, y);
  doc.text('-', 280, y);
  doc.text('-', 380, y, { align: 'right' });
  doc.text('-', 450, y, { align: 'right' });
  doc.fillColor(primaryColor).text(`Rs.${openingBalance.toFixed(2)}`, 510, y, { align: 'right', bold: true });
  y += 20;

  // Loop through ledger items
  for (const entry of ledgerWithBalances) {
    // Check page break
    if (y > 700) {
      doc.addPage();
      y = 50;
      // Redraw Header on new page
      doc.fillColor(primaryColor).fontSize(9).text('Date', 50, y, { bold: true });
      doc.text('Description', 140, y, { bold: true });
      doc.text('Reference', 280, y, { bold: true });
      doc.text('Debit (+)', 380, y, { align: 'right', bold: true });
      doc.text('Credit (-)', 450, y, { align: 'right', bold: true });
      doc.text('Balance', 510, y, { align: 'right', bold: true });
      doc.moveTo(50, y + 15).lineTo(560, y + 15).strokeColor(primaryColor).stroke();
      y += 25;
    }

    const formattedDate = new Date(entry.date).toLocaleDateString();
    doc.fillColor(darkGray).fontSize(9).text(formattedDate, 50, y);
    doc.text(entry.type.toUpperCase() + ': ' + (entry.description.split(': ')[1] || entry.description), 140, y);
    doc.text(entry.reference || '-', 280, y);
    doc.text(entry.debit > 0 ? `Rs.${entry.debit.toFixed(2)}` : '-', 380, y, { align: 'right' });
    doc.text(entry.credit > 0 ? `Rs.${entry.credit.toFixed(2)}` : '-', 450, y, { align: 'right' });
    doc.fillColor(primaryColor).text(`Rs.${entry.remainingBalance.toFixed(2)}`, 510, y, { align: 'right', bold: true });

    y += 20;
  }

  // Divider Line
  doc.moveTo(50, y + 10).lineTo(560, y + 10).strokeColor(lineStrokeColor).stroke();
  y += 25;

  // Summary block (if y > 680, push to new page)
  if (y > 680) {
    doc.addPage();
    y = 50;
  }

  // Closing summary
  doc.fillColor(primaryColor).fontSize(10).text('CLOSING SUMMARY', 300, y, { bold: true });
  doc.moveTo(300, y + 12).lineTo(560, y + 12).strokeColor(lineStrokeColor).stroke();
  y += 20;

  const periodPurchases = ledger.filter(e => e.type === 'purchase').reduce((sum, e) => sum + e.debit, 0);
  const periodPayments = ledger.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.credit, 0);

  doc.fillColor(darkGray).fontSize(9).text('Period Total Purchases:', 300, y);
  doc.text(`Rs.${periodPurchases.toFixed(2)}`, 510, y, { align: 'right' });
  y += 15;

  doc.text('Period Total Payments:', 300, y);
  doc.text(`Rs.${periodPayments.toFixed(2)}`, 510, y, { align: 'right' });
  y += 15;

  doc.fillColor(primaryColor).text('Final Balance Due:', 300, y, { bold: true });
  doc.text(`Rs.${runningBalance.toFixed(2)}`, 510, y, { align: 'right', bold: true });

  // Footer notice
  y += 40;
  doc.fillColor(lightGray).fontSize(8).text('Thank you for your business. Please settle outstanding balances in a timely manner.', 50, y, { align: 'center' });

  doc.end();
});
