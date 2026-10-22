import React from 'react';
import { Printer, X, CheckCircle, Utensils } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];
  const payment = order.payment || order.payments?.[0] || {};
  const settings = order.settings || {
    restaurant_name: 'Saffron Grill',
    tagline: 'Authentic Tandoor & Indian Flavours',
    address: 'Near IQ City Medical College, Bijra More, Durgapur 713206',
    phone: '+91 98321 45678',
    gstin: '19AABCS1234F1Z9',
    receipt_footer: 'Thank you for dining at Saffron Grill! Visit again soon.'
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Actions */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Receipt Preview (58mm Thermal)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-5 bg-slate-100 flex justify-center max-h-[75vh] overflow-y-auto">
          <div
            id="thermal-receipt-printable"
            className="w-[320px] bg-white p-4 rounded-lg shadow-sm border border-dashed border-slate-300 font-mono text-xs text-slate-900 leading-tight"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400 mb-2">
              <h2 className="text-base font-bold uppercase tracking-wider">{settings.restaurant_name}</h2>
              <p className="text-[10px] text-slate-600">{settings.tagline}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Ph: {settings.phone}</p>
              {settings.gstin && <p className="text-[10px] text-slate-600">GSTIN: {settings.gstin}</p>}
            </div>

            {/* Bill Info */}
            <div className="text-[11px] pb-2 border-b border-dashed border-slate-400 mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Bill No:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cashier:</span>
                <span>{order.cashier_name || 'Staff'}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Type:</span>
                <span className="uppercase text-amber-700">
                  {order.order_type === 'dine_in'
                    ? `Dine-In (${order.table_number || 'Table'})`
                    : 'Takeaway'}
                </span>
              </div>
              {order.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer:</span>
                  <span>{order.customer_name}</span>
                </div>
              )}
            </div>

            {/* Item Table */}
            <div className="pb-2 border-b border-dashed border-slate-400 mb-2">
              <div className="flex justify-between font-bold text-[10px] uppercase border-b border-slate-300 pb-1 mb-1">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Qty x Rate</span>
                <span className="w-1/4 text-right">Amt (₹)</span>
              </div>
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="w-1/2 pr-1">
                      <div className="font-semibold leading-tight">{item.item_name}</div>
                      {item.notes && <div className="text-[9px] text-slate-500 italic">*{item.notes}</div>}
                    </div>
                    <div className="w-1/4 text-center text-slate-600">
                      {item.quantity} x {Number(item.unit_price).toFixed(0)}
                    </div>
                    <div className="w-1/4 text-right font-medium">
                      {Number(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations */}
            <div className="text-[11px] pb-2 border-b border-dashed border-slate-400 mb-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
              </div>
              {Number(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(order.tax_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span>GST ({order.tax_rate || 5}%):</span>
                  <span>₹{Number(order.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300 text-slate-950">
                <span>GRAND TOTAL:</span>
                <span>₹{Number(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="text-[10px] pb-2 border-b border-dashed border-slate-400 mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold uppercase">{payment.payment_method || 'CASH'}</span>
              </div>
              {payment.payment_method === 'cash' && payment.tendered_amount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Tendered:</span>
                    <span>₹{Number(payment.tendered_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Change Due:</span>
                    <span>₹{Number(payment.change_amount || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
              {payment.payment_method === 'upi' && payment.transaction_ref && (
                <div className="flex justify-between">
                  <span>Ref:</span>
                  <span className="truncate max-w-[160px]">{payment.transaction_ref}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-600 pt-1">
              <p>{settings.receipt_footer}</p>
              <p className="mt-1 font-bold">*** HAVE A GREAT DAY ***</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
