import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  X, 
  CheckCircle, 
  QrCode, 
  AlertCircle,
  Clock,
  Users,
  Utensils
} from 'lucide-react';
import api from '../../services/api';

export default function SettleModal({ 
  isOpen, 
  onClose, 
  order, 
  additionalItems = [], 
  onSuccess 
}) {
  if (!isOpen || !order) return null;

  // Calculate items and subtotals
  const existingItems = order.items || [];
  const existingSubtotal = existingItems.reduce(
    (sum, item) => sum + (Number(item.subtotal) || Number(item.unit_price || item.price) * Number(item.quantity)),
    0
  );

  const additionalSubtotal = additionalItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const rawSubtotal = existingSubtotal + additionalSubtotal;

  // Discount state
  const [discountType, setDiscountType] = useState(order.discount_type || 'flat');
  const [discountValue, setDiscountValue] = useState(order.discount_value || 0);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'upi', 'card'
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tax Rate
  const taxRate = Number(order.tax_rate ?? order.settings?.tax_rate ?? 5.0);

  // Discount calculation
  const numDiscountVal = Math.max(0, Number(discountValue) || 0);
  const discountAmt = discountType === 'percentage'
    ? Math.round(((rawSubtotal * numDiscountVal) / 100) * 100) / 100
    : Math.min(rawSubtotal, numDiscountVal);

  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmt);
  const taxAmount = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;
  const grandTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

  // Pre-fill tendered amount with grandTotal whenever it changes
  useEffect(() => {
    setTenderedAmount(grandTotal.toString());
  }, [grandTotal]);

  const numericTendered = Number(tenderedAmount) || 0;
  const changeDue = Math.max(0, numericTendered - grandTotal);

  // UPI QR Code URI
  const upiId = order.settings?.phone ? `${order.settings.phone.replace(/[^0-9]/g, '')}@upi` : 'saffrongrill@upi';
  const restaurantName = encodeURIComponent(order.settings?.restaurant_name || 'Saffron Grill');
  const upiString = `upi://pay?pa=${upiId}&pn=${restaurantName}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table_${order.table_number || 'Dining'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiString)}`;

  const handleSettle = async () => {
    if (isSubmitting) return;
    setError('');

    if (paymentMethod === 'cash' && numericTendered < grandTotal) {
      setError(`Cash tendered (₹${numericTendered}) must be at least ₹${grandTotal.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      // If this is an existing order in database (has id > 0)
      if (order.id) {
        const payload = {
          order_id: order.id,
          payment_method: paymentMethod,
          tendered_amount: paymentMethod === 'cash' ? numericTendered : grandTotal,
          change_amount: paymentMethod === 'cash' ? changeDue : 0,
          transaction_ref: paymentMethod === 'upi' ? (transactionRef || 'UPI/VERIFIED') : transactionRef,
          discount_type: discountType,
          discount_value: numDiscountVal,
          additional_items: additionalItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          }))
        };
        res = await api.post('/api/orders.php?action=settle', payload);
      } else {
        // Direct checkout for new fresh order
        const payload = {
          order_type: order.order_type || 'dine_in',
          table_id: order.table_id || null,
          table_number: order.table_number || null,
          customer_name: order.customer_name || '',
          customer_phone: order.customer_phone || '',
          notes: order.notes || '',
          discount_type: discountType,
          discount_value: numDiscountVal,
          payment_method: paymentMethod,
          tendered_amount: paymentMethod === 'cash' ? numericTendered : grandTotal,
          transaction_ref: paymentMethod === 'upi' ? (transactionRef || 'UPI/VERIFIED') : transactionRef,
          is_hold: false,
          items: [...existingItems, ...additionalItems].map(ci => ({
            id: ci.id || ci.menu_item_id,
            name: ci.name || ci.item_name,
            price: ci.price || ci.unit_price,
            quantity: ci.quantity,
            notes: ci.notes || ''
          }))
        };
        res = await api.post('/api/orders.php?action=create', payload);
      }

      if (res && res.success) {
        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Payment settlement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm">
                Settle Bill & Free Table
              </h2>
              <p className="text-[11px] text-slate-400">
                {order.table_number ? `Table ${order.table_number}` : 'Takeaway'} • Order #{order.order_number || 'New'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Bill Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-700">
              <span>Items Total ({existingItems.length + additionalItems.length} dishes):</span>
              <span className="text-slate-900 font-bold">₹{rawSubtotal.toFixed(2)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Discount:</span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="py-0.5 px-1 rounded border border-slate-300 text-[11px] bg-white"
                >
                  <option value="flat">Flat ₹</option>
                  <option value="percentage">% Percent</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0"
                  className="w-20 py-0.5 px-2 text-right rounded border border-slate-300 text-xs bg-white font-bold"
                />
                {discountAmt > 0 && (
                  <span className="text-emerald-700 font-semibold">(-₹{discountAmt.toFixed(2)})</span>
                )}
              </div>
            </div>

            {/* GST Tax Row */}
            <div className="flex items-center justify-between text-slate-600">
              <span>GST ({taxRate}%):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-950">
              <span>AMOUNT TO PAY:</span>
              <span className="text-lg text-amber-700">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Payment Method:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Card / POS</span>
              </button>
            </div>
          </div>

          {/* Method 1: Cash Details */}
          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Cash Tendered by Customer (₹):
                </label>
                <input
                  type="number"
                  step="1"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="w-full py-2 px-3 text-lg font-black rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[grandTotal, Math.ceil(grandTotal / 50) * 50, Math.ceil(grandTotal / 100) * 100, 500, 1000, 2000]
                  .filter((v, idx, arr) => v >= grandTotal && arr.indexOf(v) === idx)
                  .slice(0, 5)
                  .map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTenderedAmount(amt.toString())}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition cursor-pointer"
                    >
                      ₹{amt.toFixed(0)}
                    </button>
                  ))}
              </div>

              {/* Change Due Display */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900">Change Due to Customer:</span>
                <span className="text-base font-black text-emerald-800">₹{changeDue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Method 2: UPI QR Details */}
          {paymentMethod === 'upi' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-center">
              <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code"
                  className="w-36 h-36 mx-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Scan using PhonePe / GPay / Paytm</p>
                <p className="text-[11px] text-slate-500">Pay exactly ₹{grandTotal.toFixed(2)}</p>
              </div>

              <input
                type="text"
                placeholder="UPI Reference / UTR / Order ID (Optional)"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-300 bg-white text-center focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Method 3: Card Details */}
          {paymentMethod === 'card' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs text-slate-600">
                Swipe / Dip credit or debit card on the EDC card terminal for <strong className="text-slate-900">₹{grandTotal.toFixed(2)}</strong>.
              </p>
              <input
                type="text"
                placeholder="Terminal Approval Code / Batch Ref (Optional)"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSettle}
            disabled={isSubmitting || (paymentMethod === 'cash' && numericTendered < grandTotal)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-40 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Settling Bill...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Paid ₹{grandTotal.toFixed(2)} & Free Table</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
