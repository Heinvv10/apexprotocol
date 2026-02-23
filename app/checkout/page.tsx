'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/components/CartProvider';
import { useRouter } from 'next/navigation';

const SHIPPING_OPTIONS = [
  { value: 'courier_door', label: 'Courier to-Door', cost: 180, desc: 'Delivered to your door' },
  { value: 'courier_kiosk', label: 'Courier to-Kiosk', cost: 180, desc: 'Collect from courier kiosk' },
  { value: 'postnet', label: 'PostNet', cost: 140, desc: 'Collect from PostNet branch' },
  { value: 'fastway', label: 'Fastway (Main Cities)', cost: 130, desc: 'Main cities only' },
];

const PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];

const QUOTE_ACTIONS = [
  { value: 'create_new', label: 'Create new order' },
  { value: 'replace_existing', label: 'Replace existing order' },
  { value: 'add_to_existing', label: 'Add to existing order' },
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
  const [shipping, setShipping] = useState('courier_door');
  const [quoteAction, setQuoteAction] = useState('create_new');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', instructions: '',
    street: '', suburb: '', city: '', postalCode: '', province: 'Gauteng',
    saveAddress: true, addressLabel: 'Home',
  });

  useEffect(() => {
    fetch('/api/addresses').then(r => r.json()).then(d => {
      setSavedAddresses(d.addresses || []);
      if (d.addresses?.length > 0) {
        const def = d.addresses.find((a: any) => a.is_default) || d.addresses[0];
        setSelectedAddressId(def.id);
      }
    }).catch(() => {});
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setForm(prev => ({ ...prev, name: d.user.name || '' }));
    }).catch(() => {});
  }, []);

  const shippingCost = subtotal >= 4600 ? 0 : SHIPPING_OPTIONS.find(o => o.value === shipping)?.cost || 180;
  const total = subtotal + shippingCost;

  const getAddress = () => {
    if (selectedAddressId !== 'new') {
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      if (addr) return { street: addr.street, suburb: addr.suburb, city: addr.city, postalCode: addr.postal_code, province: addr.province };
    }
    return { street: form.street, suburb: form.suburb, city: form.city, postalCode: form.postalCode, province: form.province };
  };

  const update = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const canProceedStep1 = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return false;
    if (selectedAddressId === 'new') {
      return !!(form.street.trim() && form.city.trim() && form.postalCode.trim());
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const addr = getAddress();
    if (selectedAddressId === 'new' && form.saveAddress) {
      try {
        await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: form.addressLabel, street: form.street, suburb: form.suburb,
            city: form.city, postal_code: form.postalCode, province: form.province,
            is_default: savedAddresses.length === 0,
          }),
        });
      } catch {}
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          shipping: { method: shipping, cost: shippingCost },
          customer: { name: form.name, email: form.email, phone: form.phone, instructions: form.instructions },
          address: addr, subtotal, total, quoteAction, agreedTerms: true,
        }),
      });
      const data = await res.json();
      if (data.orderRef) { clearCart(); router.push(`/checkout/success?ref=${data.orderRef}`); }
      else alert(data.error || 'Failed to place order');
    } catch { alert('Something went wrong'); }
    finally { setLoading(false); }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="w-20 h-20 rounded-full bg-apex-card border border-apex-border flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-apex-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold mb-2 uppercase tracking-wider">Your Cart is Empty</h1>
        <button onClick={() => router.push('/catalog')} className="btn-primary mt-4">Browse Products</button>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Shipping' },
    { num: 2, label: 'Review' },
    { num: 3, label: 'Agreement' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
      <h1 className="font-display text-3xl font-bold mb-2 uppercase tracking-wider text-white">Checkout</h1>

      {/* Step indicator — connected dots */}
      <div className="flex items-center justify-center gap-0 mb-10 mt-6">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            {i > 0 && (
              <div className={`w-12 sm:w-20 h-[2px] ${step >= s.num ? 'bg-apex-accent' : 'bg-apex-border'} transition-colors duration-300`} />
            )}
            <button
              onClick={() => s.num < step && setStep(s.num)}
              disabled={s.num > step}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step === s.num
                  ? 'bg-apex-accent text-apex-black shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                  : step > s.num
                  ? 'bg-apex-accent/20 text-apex-accent border border-apex-accent/30'
                  : 'bg-apex-card border border-apex-border text-apex-muted/40'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs tracking-wider uppercase font-medium ${
                step >= s.num ? 'text-apex-accent' : 'text-apex-muted/30'
              }`}>{s.label}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left — Form steps */}
        <div className="md:col-span-2">
          {/* STEP 1: Shipping */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Contact Details</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <input value={form.name} onChange={e => update('name', e.target.value)} className="input-floating peer" placeholder=" " required />
                    <label className="input-floating-label">Full Name *</label>
                  </div>
                  <div className="relative">
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-floating peer" placeholder=" " required />
                    <label className="input-floating-label">Email Address *</label>
                  </div>
                  <div className="relative">
                    <input value={form.phone} onChange={e => update('phone', e.target.value)} className="input-floating peer" placeholder=" " required />
                    <label className="input-floating-label">Phone Number *</label>
                  </div>
                </div>
              </div>

              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Shipping Method</h2>
                <div className="space-y-2">
                  {SHIPPING_OPTIONS.map(opt => (
                    <label key={opt.value} className={`flex items-center justify-between p-4 rounded border cursor-pointer transition-all ${
                      shipping === opt.value ? 'border-apex-accent bg-apex-accent/5' : 'border-apex-border hover:border-apex-accent/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          shipping === opt.value ? 'border-apex-accent' : 'border-apex-border'
                        }`}>
                          {shipping === opt.value && <div className="w-2 h-2 rounded-full bg-apex-accent" />}
                        </div>
                        <div>
                          <span className="font-medium text-base text-apex-text">{opt.label}</span>
                          <p className="text-sm text-apex-muted/50">{opt.desc}</p>
                        </div>
                      </div>
                      <span className="font-bold text-base text-apex-accent">
                        {subtotal >= 4600 ? 'FREE' : `R${opt.cost}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Delivery Address</h2>
                {savedAddresses.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {savedAddresses.map(addr => (
                      <label key={addr.id} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                        selectedAddressId === addr.id ? 'border-apex-accent bg-apex-accent/5' : 'border-apex-border'
                      }`}>
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-apex-accent' : 'border-apex-border'}`}>
                          {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-apex-accent" />}
                        </div>
                        <div>
                          <span className="font-medium text-base text-apex-text">{addr.label}</span>
                          <p className="text-sm text-apex-muted/50">{addr.street}{addr.suburb ? `, ${addr.suburb}` : ''}, {addr.city}, {addr.province} {addr.postal_code}</p>
                        </div>
                      </label>
                    ))}
                    <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${
                      selectedAddressId === 'new' ? 'border-apex-accent bg-apex-accent/5' : 'border-apex-border'
                    }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddressId === 'new' ? 'border-apex-accent' : 'border-apex-border'}`}>
                        {selectedAddressId === 'new' && <div className="w-2 h-2 rounded-full bg-apex-accent" />}
                      </div>
                      <input type="radio" name="address" checked={selectedAddressId === 'new'} onChange={() => setSelectedAddressId('new')} className="hidden" />
                      <span className="text-sm font-medium text-apex-muted">+ New address</span>
                    </label>
                  </div>
                )}

                {selectedAddressId === 'new' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <input value={form.street} onChange={e => update('street', e.target.value)} className="input-floating peer" placeholder=" " required />
                      <label className="input-floating-label">Street Address *</label>
                    </div>
                    <div className="relative">
                      <input value={form.suburb} onChange={e => update('suburb', e.target.value)} className="input-floating peer" placeholder=" " />
                      <label className="input-floating-label">Suburb / Complex</label>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="relative">
                        <input value={form.city} onChange={e => update('city', e.target.value)} className="input-floating peer" placeholder=" " required />
                        <label className="input-floating-label">City *</label>
                      </div>
                      <div>
                        <select value={form.province} onChange={e => update('province', e.target.value)} className="input-field text-sm">
                          {PROVINCES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="relative">
                        <input value={form.postalCode} onChange={e => update('postalCode', e.target.value)} className="input-floating peer" placeholder=" " required />
                        <label className="input-floating-label">Postal Code *</label>
                      </div>
                    </div>
                    <p className="text-sm text-apex-muted/40">Country: South Africa</p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-apex-muted">
                        <input type="checkbox" checked={form.saveAddress as boolean} onChange={e => update('saveAddress', e.target.checked)} className="accent-apex-accent w-4 h-4" />
                        Save this address
                      </label>
                      {form.saveAddress && (
                        <input value={form.addressLabel} onChange={e => update('addressLabel', e.target.value)} className="input-field !py-1.5 !text-sm w-32" placeholder="Label" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Special Instructions</h2>
                <textarea value={form.instructions} onChange={e => update('instructions', e.target.value)} className="input-field h-24 resize-none" placeholder="Any special delivery instructions..." />
              </div>

              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Quote Action</h2>
                <div className="space-y-2">
                  {QUOTE_ACTIONS.map(qa => (
                    <label key={qa.value} className="flex items-center gap-3 text-sm cursor-pointer text-apex-muted hover:text-apex-text transition-colors">
                      <input type="radio" name="quoteAction" value={qa.value} checked={quoteAction === qa.value} onChange={() => setQuoteAction(qa.value)} className="accent-apex-accent" />
                      {qa.label}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1()}
                className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue to Review →
              </button>
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Order Review</h2>
                <div className="divide-y divide-apex-border">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 py-3">
                      <img src={`/images/products/${item.image}`} alt={item.name} className="w-12 h-12 object-contain rounded bg-apex-dark p-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base text-apex-text truncate">{item.name}</p>
                        <p className="text-sm text-apex-muted/50">Qty: {item.quantity} × R{item.price.toFixed(0)}</p>
                      </div>
                      <span className="font-bold text-base text-apex-accent font-display">R{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Delivery Details</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-apex-muted/40 text-sm uppercase tracking-wider">Name</span>
                    <p className="font-medium text-apex-text">{form.name}</p>
                  </div>
                  <div>
                    <span className="text-apex-muted/40 text-sm uppercase tracking-wider">Phone</span>
                    <p className="font-medium text-apex-text">{form.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-apex-muted/40 text-sm uppercase tracking-wider">Address</span>
                    {(() => {
                      const a = getAddress();
                      return <p className="font-medium text-apex-text">{a.street}{a.suburb ? `, ${a.suburb}` : ''}, {a.city}, {a.province} {a.postalCode}</p>;
                    })()}
                  </div>
                  <div>
                    <span className="text-apex-muted/40 text-sm uppercase tracking-wider">Shipping</span>
                    <p className="font-medium text-apex-text">{SHIPPING_OPTIONS.find(o => o.value === shipping)?.label}</p>
                  </div>
                  {form.instructions && (
                    <div className="sm:col-span-2">
                      <span className="text-apex-muted/40 text-sm uppercase tracking-wider">Instructions</span>
                      <p className="font-medium text-apex-text">{form.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6 border-apex-border">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-apex-muted">Subtotal</span><span className="text-apex-text">R{subtotal.toFixed(0)}</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-apex-muted">Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-400 font-medium' : 'text-apex-text'}>{shippingCost === 0 ? 'FREE' : `R${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-apex-border pt-3 mt-3">
                    <span className="text-apex-text">Total</span>
                    <span className="text-apex-accent font-display">R{total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Agreement */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="card p-6 border-apex-border">
                <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wider text-apex-text">Terms & Conditions</h2>
                <div className="max-h-64 overflow-y-auto text-base text-apex-muted/70 space-y-3 pr-2 mb-6 leading-relaxed">
                  <p><strong className="text-apex-muted">Ordering:</strong> We don&apos;t accept returns for incorrectly ordered products. Order preparation takes 2 to 5 business days.</p>
                  <p><strong className="text-apex-muted">Minimum Order:</strong> R200 (excluding shipping fees).</p>
                  <p><strong className="text-apex-muted">Shipping:</strong> Parcels shipped Monday to Thursday. No parcels on Fridays, weekends, or public holidays. Inspect contents and report issues within 3 business days.</p>
                  <p><strong className="text-apex-muted">Payment:</strong> Only make payment after confirming your order details. Changes cannot be made after payment. Use the correct reference number.</p>
                  <p><strong className="text-apex-muted">Liability:</strong> You acknowledge that you are at least 18 years of age. Any product information provided is for informational purposes only. Apex Protocol will not be held responsible for any harm or damage resulting from the use of products obtained from this website.</p>
                </div>

                <label className={`flex items-start gap-3 p-4 rounded border cursor-pointer transition-all ${
                  agreedTerms ? 'border-apex-accent bg-apex-accent/5' : 'border-apex-border hover:border-apex-accent/20'
                }`}>
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={e => setAgreedTerms(e.target.checked)}
                    className="accent-apex-accent w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-medium text-base text-apex-text">I agree to the Terms & Conditions</span>
                    <p className="text-sm text-apex-muted/50 mt-0.5">By placing this order, I confirm that I am at least 18 years old and agree to the terms above.</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={!agreedTerms || loading}
                  className={`btn-primary flex-1 disabled:opacity-30 disabled:cursor-not-allowed ${agreedTerms && !loading ? 'animate-pulse-accent' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Placing Order...
                    </span>
                  ) : 'Agree & Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — Sticky order summary */}
        <div className="hidden md:block">
          <div className="card p-6 sticky top-24 border-apex-border">
            <h3 className="font-display text-sm font-bold mb-4 uppercase tracking-wider text-apex-text">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate mr-2 text-apex-muted">{item.name} ×{item.quantity}</span>
                  <span className="font-medium whitespace-nowrap text-apex-text">R{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-apex-border pt-3 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-apex-muted">Subtotal</span><span className="text-apex-text">R{subtotal.toFixed(0)}</span></div>
              <div className="flex justify-between text-sm">
                <span className="text-apex-muted">Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-400' : 'text-apex-text'}>{shippingCost === 0 ? 'FREE' : `R${shippingCost}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-apex-border pt-2">
                <span className="text-apex-text">Total</span>
                <span className="text-apex-accent font-display">R{total.toFixed(0)}</span>
              </div>
            </div>
            {subtotal < 200 && (
              <p className="text-sm text-red-400 mt-2">Minimum order: R200</p>
            )}
            {subtotal < 4600 && subtotal >= 200 && (
              <p className="text-sm text-apex-muted/50 mt-2">Add R{(4600 - subtotal).toFixed(0)} more for free shipping</p>
            )}
            {subtotal >= 4600 && (
              <p className="text-sm text-green-400 mt-2">✓ Free shipping applied</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
