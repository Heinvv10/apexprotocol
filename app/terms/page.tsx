export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
      <div className="prose dark:prose-invert max-w-none space-y-8">

        <section>
          <h2 className="text-xl font-semibold mb-3">Ordering Procedures</h2>
          <p>When you&apos;re ready to place an order, add your desired products to your cart and proceed to checkout. If you&apos;re unsure about which products to order, please don&apos;t hesitate to contact us for advice. Please keep in mind that we don&apos;t accept returns for products that have been incorrectly ordered.</p>
          <p>An order confirmation with payment details will be sent to your email. Before proceeding with payment, we kindly ask you to double-check that all the details on the order are accurate.</p>
          <p>As soon as we receive your payment, we&apos;ll prepare your order for shipment. Typically, order preparation takes 2 to 5 business days. During peak periods, there may be a slight delay. Your order will be processed on a first-come, first-served basis.</p>
          <p>An email containing your tracking number will be sent to you once your order has been dispatched. Please use this tracking number to monitor the delivery progress.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Order Requirements</h2>
          <p>We kindly request that you only place an order if you intend to make a payment. To maintain the quality of our services, accounts that consistently request dummy orders will be deactivated.</p>
          <p>The minimum purchase value per order is <strong>R200</strong> (excluding shipping fees).</p>
          <p>Please verify that all details on your order, including the address, products, and quantities, are correct before payment.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Shipping</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
            <h4 className="font-semibold mb-2">Shipping Fees</h4>
            <p><strong>Orders below R4,600:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Main Cities: R150</li>
              <li>Rural Towns: R207</li>
              <li>PostNet: R161</li>
              <li>Farms: R598</li>
            </ul>
            <p className="mt-2"><strong>Orders R4,600 and over: Free Shipping</strong></p>
          </div>
          <p>We cannot combine and ship orders together to save on shipping costs. If you wish to merge orders, please request this before making a payment.</p>
          <p>Parcels are shipped on Mondays, Tuesdays, Wednesdays, and Thursdays. No parcels are shipped on Fridays, weekends, or public holidays.</p>
          <p>Upon receiving your delivery, please inspect the contents and report any missing, incorrect, or damaged items within three business days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Payments</h2>
          <p>Please only make payment after confirming your order details are correct.</p>
          <p>Changes to your order cannot be made after we&apos;ve received your payment. If you need amendments, kindly request them before making payment.</p>
          <p>We accept payments only from South African bank accounts. Unfortunately, we cannot accept SWIFT or Forex payments.</p>
          <p>To ensure your payment is properly processed, please use the correct reference number. Avoid including your name or any other additional information with the reference.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Denial of Liability</h2>
          <p>You hereby acknowledge that you are at least eighteen years of age (18).</p>
          <p>The use of any product without a doctor&apos;s prescription and/or instruction can and may have severe side effects to your health.</p>
          <p>Any product or usage information provided by Apex Protocol is for informational purposes only. We make every effort to provide accurate information, but it may contain factual inaccuracies and/or typographical errors.</p>
          <p>By accepting these terms, you acknowledge that neither Apex Protocol nor any representative will be held responsible for any harm or damage resulting from the use of products obtained from this website.</p>
        </section>

      </div>
    </div>
  );
}
