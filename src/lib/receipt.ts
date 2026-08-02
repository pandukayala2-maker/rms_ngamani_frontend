import { api } from "./axios";

// Helper to format currency
function formatKD(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const value = Number.isFinite(num) ? num : 0;
  return `KD ${value.toFixed(3)}`;
}

// Helper to announce order out loud via browser speech synthesis
export function speakOrder(order: any): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const itemsSummary = order.items
      ? order.items
          .map((item: any) => {
            const name = item.menuItem?.name || item.nameSnapshot || "Item";
            const portion = item.portion === "HALF" ? "Half" : "";
            return `${item.quantity} ${portion} ${name}`.trim();
          })
          .join(", ")
      : "";

    const shortNo = order.orderNumber ? order.orderNumber.split("-").pop() : "";
    const speechText = `Order number ${shortNo}. ${itemsSummary ? `Items: ${itemsSummary}.` : ""} Total: ${Number(order.total).toFixed(3)} KD.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Voice alert error:", err);
  }
}

export async function openReceipt(orderId: string): Promise<void> {
  try {
    // 1. Fetch Order and Branch settings details
    const orderRes = await api.get(`/orders/${orderId}`);
    const order = orderRes.data.data;

    // Speak out the order out loud
    speakOrder(order);

    // Get currency settings (default to KD / KWD formatting)
    const totalPaid = order.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const changeReturn = Math.max(0, totalPaid - order.total);

    // 2. Prepare receipt items HTML
    let itemsHtml = "";
    order.items.forEach((item: any) => {
      // Calculate unit price and final price
      const name = item.menuItem?.name || item.nameSnapshot;
      const isHalf = item.portion === "HALF";
      const displayName = name + (isHalf ? " (Half)" : "");
      
      const qty = item.quantity;
      const price = Number(item.priceSnapshot);
      const total = qty * price;
      
      itemsHtml += `
        <tr>
          <td style="padding: 4px 0;">
            <div style="font-weight: bold;">${displayName}</div>
            <div style="font-size: 9px; color: #555;">${qty} x ${price.toFixed(3)}</div>
          </td>
          <td style="text-align: center; padding: 4px 0;">${qty}</td>
          <td style="text-align: right; padding: 4px 0;">${price.toFixed(3)}</td>
          <td style="text-align: right; padding: 4px 0;">${total.toFixed(3)}</td>
        </tr>
      `;
    });

    // 3. Prepare payments summary
    let paymentsHtml = "";
    order.payments.forEach((p: any) => {
      paymentsHtml += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>${p.method} / طريقة الدفع:</span>
          <span style="font-weight: bold;">${formatKD(Number(p.amount))}</span>
        </div>
      `;
    });

    // 4. Construct Full HTML structure matching the modern Arabic/English thermal receipt
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 8px;
            }
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 8px;
            width: 72mm;
            background-color: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .info-table, .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .info-table td {
            padding: 2px 0;
            vertical-align: top;
          }
          .items-table th {
            border-bottom: 1px solid #000;
            border-top: 1px solid #000;
            padding: 4px 0;
            font-weight: bold;
            font-size: 9px;
          }
          .items-table td {
            vertical-align: top;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="text-center" style="margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 16px; font-weight: 900; letter-spacing: 1px;">NAGAMI HOTEL</h2>
          <div style="font-size: 9px; margin-top: 2px;">Restaurant & Cafe</div>
          <div class="bold" style="font-size: 12px; margin-top: 6px; text-transform: uppercase;">Invoice / فاتورة</div>
        </div>

        <!-- Info Table -->
        <table class="info-table">
          <tr>
            <td><strong>Invoice / الفاتورة:</strong></td>
            <td class="text-right">${order.orderNumber}</td>
          </tr>
          <tr>
            <td><strong>Date / التاريخ:</strong></td>
            <td class="text-right">${new Date(order.createdAt).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Order Type / نوع الطلب:</strong></td>
            <td class="text-right">${order.orderType}${order.table ? ` (${order.table.name})` : ""}</td>
          </tr>
          ${order.customer ? `
          <tr>
            <td><strong>Customer / العميل:</strong></td>
            <td class="text-right">${order.customer.name || "NA"}</td>
          </tr>
          <tr>
            <td><strong>Phone / الهاتف:</strong></td>
            <td class="text-right">${order.customer.phone || "NA"}</td>
          </tr>
          ` : `
          <tr>
            <td><strong>Customer / العميل:</strong></td>
            <td class="text-right">Walk-in Customer</td>
          </tr>
          `}
        </table>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="text-left" style="width: 45%;">ITEM / العنصر</th>
              <th style="text-align: center; width: 10%;">QTY</th>
              <th class="text-right" style="width: 20%;">UNIT</th>
              <th class="text-right" style="width: 25%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <!-- Summary -->
        <div style="font-size: 10px; margin-left: 20%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Subtotal / الفرعي:</span>
            <span>${formatKD(Number(order.subtotal))}</span>
          </div>
          ${Number(order.discount) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Discount / الخصم:</span>
            <span>-${formatKD(Number(order.discount))}</span>
          </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Tax / الضريبة:</span>
            <span>${formatKD(Number(order.tax))}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
            <span>Total / الإجمالي:</span>
            <span>${formatKD(order.total)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Payments Details -->
        <div style="font-size: 10px; margin-bottom: 6px;">
          <div class="bold" style="margin-bottom: 4px;">Payments / الدفعات</div>
          ${paymentsHtml}
          
          <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px dashed #ccc; padding-top: 4px;">
            <span>Total Paid / المستلم:</span>
            <span class="bold">${formatKD(totalPaid)}</span>
          </div>
          
          ${changeReturn > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Change Return / المتبقي:</span>
            <span class="bold" style="font-size: 12px;">${formatKD(changeReturn)}</span>
          </div>
          ` : ""}
        </div>

        <!-- Footer -->
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9px; margin-top: 8px;">
          <div>Thank you for your order! / شكراً لزيارتكم</div>
          <div style="margin-top: 4px; font-weight: bold;">We're open 24x7 to serve you better!</div>
        </div>
      </body>
      </html>
    `;

    // 5. Create a hidden iframe and write the content to it
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Trigger the native print dialog inside the iframe context
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Remove iframe after print dialog is closed
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  } catch (err) {
    console.error("Print receipt error:", err);
    throw err;
  }
}
