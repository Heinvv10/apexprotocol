import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.apexprotocol.co.za',
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: 'orders@apexprotocol.co.za',
    pass: 'Mitzi@19780203',
  },
  tls: { rejectUnauthorized: false }, // Shared hosting cert mismatch
});

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderEmailData {
  ref: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: string;
  address: {
    street: string;
    suburb?: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 15px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif; font-size: 14px;">${item.name}</td>
          <td style="padding: 10px 15px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif; font-size: 14px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 15px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif; font-size: 14px; text-align: right;">R ${item.price.toFixed(2)}</td>
          <td style="padding: 10px 15px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif; font-size: 14px; text-align: right;">R ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const shippingLabel: Record<string, string> = {
    courier_door: 'The Courier Guy (Door-to-Door)',
    courier_kiosk: 'The Courier Guy (Kiosk)',
    postnet: 'PostNet (Counter)',
    fastway: 'Fastway (Door-to-Door)',
  };

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #111827; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-family: Arial, sans-serif; font-size: 24px; margin: 0; letter-spacing: 2px;">APEX PROTOCOL</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 10px;">
              <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333; margin: 0;">
                Hi ${data.customerName},
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 10px 0 0;">
                Thank you for your order. Please find your quotation details below.
              </p>
            </td>
          </tr>

          <!-- Order Reference -->
          <tr>
            <td style="padding: 15px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999; margin: 0; text-transform: uppercase;">Order Reference</p>
                    <p style="font-family: 'Courier New', monospace; font-size: 22px; color: #111827; margin: 5px 0 0; font-weight: bold;">${data.ref}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 10px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 10px 15px; font-family: Arial, sans-serif; font-size: 12px; color: #666; text-align: left; text-transform: uppercase;">Product</th>
                  <th style="padding: 10px 15px; font-family: Arial, sans-serif; font-size: 12px; color: #666; text-align: center; text-transform: uppercase;">Qty</th>
                  <th style="padding: 10px 15px; font-family: Arial, sans-serif; font-size: 12px; color: #666; text-align: right; text-transform: uppercase;">Price</th>
                  <th style="padding: 10px 15px; font-family: Arial, sans-serif; font-size: 12px; color: #666; text-align: right; text-transform: uppercase;">Total</th>
                </tr>
                ${itemRows}
                <tr>
                  <td colspan="3" style="padding: 8px 15px; font-family: Arial, sans-serif; font-size: 14px; text-align: right; color: #666;">Subtotal</td>
                  <td style="padding: 8px 15px; font-family: Arial, sans-serif; font-size: 14px; text-align: right;">R ${data.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 8px 15px; font-family: Arial, sans-serif; font-size: 14px; text-align: right; color: #666;">Shipping (${shippingLabel[data.shippingMethod] || data.shippingMethod})</td>
                  <td style="padding: 8px 15px; font-family: Arial, sans-serif; font-size: 14px; text-align: right;">R ${data.shippingCost.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td colspan="3" style="padding: 12px 15px; font-family: Arial, sans-serif; font-size: 16px; text-align: right; font-weight: bold;">Total</td>
                  <td style="padding: 12px 15px; font-family: Arial, sans-serif; font-size: 16px; text-align: right; font-weight: bold; color: #111827;">R ${data.total.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 15px 40px 5px;">
              <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999; margin: 0; text-transform: uppercase;">Shipping To</p>
              <p style="font-family: Arial, sans-serif; font-size: 14px; color: #333; margin: 5px 0;">
                ${data.customerName}<br>
                ${data.address.street}<br>
                ${data.address.suburb ? data.address.suburb + '<br>' : ''}
                ${data.address.city}, ${data.address.province} ${data.address.postalCode}
              </p>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 15px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="font-family: Arial, sans-serif; font-size: 14px; color: #854d0e; margin: 0 0 12px; text-transform: uppercase;">Payment Details (EFT)</h3>
                    <table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                      <tr><td style="padding: 3px 15px 3px 0; color: #666;">Bank:</td><td style="padding: 3px 0; font-weight: bold;">Absa</td></tr>
                      <tr><td style="padding: 3px 15px 3px 0; color: #666;">Account Name:</td><td style="padding: 3px 0; font-weight: bold;">Apex Protocol</td></tr>
                      <tr><td style="padding: 3px 15px 3px 0; color: #666;">Account Number:</td><td style="padding: 3px 0; font-weight: bold;">4123044486</td></tr>
                      <tr><td style="padding: 3px 15px 3px 0; color: #666;">Branch Code:</td><td style="padding: 3px 0; font-weight: bold;">632005</td></tr>
                      <tr><td style="padding: 3px 15px 3px 0; color: #666;">Account Type:</td><td style="padding: 3px 0; font-weight: bold;">Cheque</td></tr>
                      <tr><td colspan="2" style="padding: 10px 0 0; border-top: 1px solid #fde047;">
                        <span style="color: #666;">Reference:</span> 
                        <strong style="font-size: 18px; color: #111827; font-family: 'Courier New', monospace;">${data.ref}</strong>
                      </td></tr>
                    </table>
                    <p style="font-family: Arial, sans-serif; font-size: 12px; color: #dc2626; margin: 12px 0 0; font-weight: bold;">
                      ⚠️ Use ONLY the reference above when making payment — no names or extra info.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Timeline -->
          <tr>
            <td style="padding: 10px 40px 20px;">
              <p style="font-family: Arial, sans-serif; font-size: 13px; color: #666; line-height: 1.8; margin: 0;">
                💳 Your order will be processed once full payment is received<br>
                📦 Preparation takes 2–5 business days after payment confirmation<br>
                🚚 A tracking number will be sent to you on dispatch
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999; margin: 0;">
                Apex Protocol — orders@apexprotocol.co.za
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const plainText = `
Hi ${data.customerName},

Thank you for your order. Here are your quotation details:

Order Reference: ${data.ref}

Items:
${data.items.map((i) => `- ${i.name} x${i.quantity} — R ${(i.price * i.quantity).toFixed(2)}`).join('\n')}

Subtotal: R ${data.subtotal.toFixed(2)}
Shipping: R ${data.shippingCost.toFixed(2)}
Total: R ${data.total.toFixed(2)}

Shipping to:
${data.customerName}
${data.address.street}
${data.address.suburb || ''}
${data.address.city}, ${data.address.province} ${data.address.postalCode}

PAYMENT DETAILS (EFT):
Bank: Absa
Account Name: Apex Protocol
Account Number: 4123044486
Branch Code: 632005
Account Type: Cheque
Reference: ${data.ref}

⚠️ Use ONLY the reference above when making payment.

Your order will be processed once payment is received.
Preparation takes 2-5 business days.
A tracking number will be sent on dispatch.

Apex Protocol
orders@apexprotocol.co.za
`;

  await transporter.sendMail({
    from: '"Apex Protocol" <orders@apexprotocol.co.za>',
    to: data.customerEmail,
    subject: `Order Confirmation — ${data.ref}`,
    text: plainText,
    html,
  });
}

export async function sendTrackingUpdate(email: string, ref: string, courier: string, trackingNumber: string) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #111827; padding: 25px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-family: Arial, sans-serif; font-size: 24px; margin: 0; letter-spacing: 2px;">APEX PROTOCOL</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="font-family: Arial, sans-serif; font-size: 20px; color: #333; margin: 0 0 10px;">🚚 Your order is on its way!</h2>
              <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666;">
                Your order <strong>${ref}</strong> has been shipped via <strong>${courier}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin: 15px 0;">
                <tr>
                  <td style="padding: 15px 20px; text-align: center;">
                    <p style="font-family: Arial, sans-serif; font-size: 12px; color: #666; margin: 0; text-transform: uppercase;">Tracking Number</p>
                    <p style="font-family: 'Courier New', monospace; font-size: 24px; color: #166534; margin: 5px 0 0; font-weight: bold;">${trackingNumber}</p>
                  </td>
                </tr>
              </table>
              <p style="font-family: Arial, sans-serif; font-size: 13px; color: #666;">
                Track your delivery at your courier's website. Delivery typically takes 1–3 business days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 15px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999; margin: 0;">Apex Protocol — orders@apexprotocol.co.za</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: '"Apex Protocol" <orders@apexprotocol.co.za>',
    to: email,
    subject: `Your order ${ref} has shipped — Tracking: ${trackingNumber}`,
    text: `Your order ${ref} has been shipped via ${courier}. Tracking number: ${trackingNumber}`,
    html,
  });
}
