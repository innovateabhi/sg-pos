import React from 'react';
import { Printer, X, ChefHat, CheckCircle2 } from 'lucide-react';

export default function KotModal({ isOpen, onClose, order, newlyAddedOnly = false }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const allItems = order.items || [];
  const displayItems = (newlyAddedOnly && order.recently_added?.length > 0)
    ? order.recently_added
    : allItems;

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Kitchen Order Ticket (KOT)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket */}
        <div className="p-5 bg-slate-100 flex justify-center max-h-[75vh] overflow-y-auto">
          <div
            id="kot-printable"
            className="w-[320px] bg-white p-4 rounded-lg shadow-sm border border-dashed border-slate-400 font-mono text-xs text-slate-900 leading-tight"
          >
            <div className="text-center pb-2 border-b-2 border-dashed border-slate-900 mb-2">
              <h2 className="text-base font-black tracking-wider uppercase">SAFFRON GRILL</h2>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mt-0.5">
                *** KITCHEN ORDER TICKET ***
              </p>
            </div>

            {/* Table & Order Banner */}
            <div className="bg-slate-100 p-2.5 rounded border border-slate-300 text-center mb-2">
              <div className="text-lg font-black tracking-wide text-slate-950">
                {order.table_number ? `TABLE: ${order.table_number}` : (order.order_type === 'takeaway' ? 'TAKEAWAY' : 'DINE-IN')}
              </div>
              <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                Order: #{order.order_number || 'Running'}
              </div>
            </div>

            {/* Meta */}
            <div className="text-[10px] pb-2 border-b border-dashed border-slate-300 mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-semibold">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Staff / Server:</span>
                <span className="font-semibold">{order.cashier_name || 'Staff'}</span>
              </div>
              {order.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest:</span>
                  <span className="font-semibold">{order.customer_name}</span>
                </div>
              )}
              {newlyAddedOnly && (
                <div className="text-amber-700 font-bold text-center pt-1">
                  [ NEW REPEAT ROUND DISHES ]
                </div>
              )}
            </div>

            {/* Dishes Checklist */}
            <div className="space-y-2 pb-3 border-b-2 border-dashed border-slate-900">
              <div className="flex justify-between text-[11px] font-black uppercase text-slate-700 pb-1 border-b border-slate-200">
                <span className="w-16">QTY</span>
                <span className="flex-1">ITEM DESCRIPTION</span>
              </div>

              {displayItems.map((item, idx) => (
                <div key={idx} className="flex items-start text-xs pt-1">
                  <div className="w-16 font-black text-sm text-slate-950">
                    [ {item.quantity}x ]
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-950 text-xs uppercase leading-snug">
                      {item.item_name || item.name}
                    </div>
                    {item.notes && (
                      <div className="text-[10px] font-bold text-rose-700 mt-0.5 bg-rose-50 px-1 py-0.5 rounded inline-block">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ticket Footer */}
            <div className="text-center text-[10px] text-slate-500 pt-2 space-y-0.5">
              <p className="font-bold">Total Items: {displayItems.reduce((acc, i) => acc + Number(i.quantity), 0)}</p>
              <p className="italic">Sent to Kitchen Display & Chefs</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print KOT</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
