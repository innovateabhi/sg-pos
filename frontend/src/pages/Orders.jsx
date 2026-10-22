import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Receipt, 
  Eye, 
  XCircle, 
  Calendar, 
  RefreshCw, 
  Utensils, 
  ShoppingBag,
  X,
  ChefHat,
  IndianRupee,
  Plus,
  Clock
} from 'lucide-react';
import api from '../services/api';
import ReceiptModal from '../components/pos/ReceiptModal';
import KotModal from '../components/pos/KotModal';
import SettleModal from '../components/pos/SettleModal';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Order for Receipt & Details Modal & Settle
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [kotOrder, setKotOrder] = useState(null);
  const [settleOrder, setSettleOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/orders.php', {
        action: 'list',
        search,
        order_type: orderType,
        status,
        payment_method: paymentMethod,
        start_date: startDate,
        end_date: endDate,
      });

      if (res && res.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [orderType, status, paymentMethod, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const openReceipt = async (orderId) => {
    try {
      const res = await api.get('/api/orders.php', { action: 'receipt', id: orderId });
      if (res && res.success) {
        setReceiptOrder(res.data);
      }
    } catch (err) {
      alert('Failed to load receipt: ' + err.message);
    }
  };

  const openDetails = async (orderId) => {
    try {
      const res = await api.get('/api/orders.php', { action: 'details', id: orderId });
      if (res && res.success) {
        setViewOrder(res.data);
      }
    } catch (err) {
      alert('Failed to load order details: ' + err.message);
    }
  };

  const openSettle = async (orderId) => {
    try {
      const res = await api.get('/api/orders.php', { action: 'active-table-order', order_id: orderId });
      if (res && res.success && res.data) {
        setSettleOrder(res.data);
      } else {
        alert('Could not load order for settlement');
      }
    } catch (err) {
      alert('Failed to open checkout: ' + err.message);
    }
  };

  const openKot = async (orderId) => {
    try {
      const res = await api.get('/api/orders.php', { action: 'active-table-order', order_id: orderId });
      if (res && res.success && res.data) {
        setKotOrder(res.data);
      }
    } catch (err) {
      alert('Failed to load KOT: ' + err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Enter reason for cancelling this order (e.g., Customer cancelled, billing error):');
    if (!reason) return;

    try {
      const res = await api.post('/api/orders.php?action=cancel', { id: orderId, reason });
      if (res && res.success) {
        alert('Order cancelled successfully.');
        fetchOrders();
        if (viewOrder?.id === orderId) setViewOrder(null);
      }
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
    }
  };

  const handleSettleSuccess = (paidOrder) => {
    fetchOrders();
    setReceiptOrder(paidOrder);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Order Management</h1>
            <p className="text-xs text-slate-500">Live occupied table orders, historical bills, and settlements</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setStatus('')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              status === ''
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setStatus('pending')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              status === 'pending'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Active Running Tables</span>
          </button>
          <button
            onClick={() => setStatus('completed')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              status === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed & Paid
          </button>
          <button
            onClick={() => setStatus('cancelled')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              status === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Search & Filters */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bill no, guest, table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800"
          >
            <option value="">All Types (Dine-In / Takeaway)</option>
            <option value="dine_in">Dine-In</option>
            <option value="takeaway">Takeaway</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800"
          >
            <option value="">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI QR</option>
            <option value="card">Card / POS</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800"
            title="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800"
            title="End Date"
          />
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order / Bill #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => {
                  const isPending = ord.order_status === 'pending';

                  return (
                    <tr 
                      key={ord.id} 
                      className={`hover:bg-slate-50/70 transition ${
                        isPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {ord.order_number}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>
                          {new Date(ord.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                          ,{' '}
                          {new Date(ord.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {isPending && ord.elapsed_minutes !== undefined && (
                          <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {ord.elapsed_minutes}m seated
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.order_type === 'dine_in'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ord.order_type === 'dine_in' ? `Table ${ord.table_number || '?'}` : 'Takeaway'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{ord.customer_name || 'Guest'}</span>
                        {ord.customer_phone && <span className="text-slate-400 block text-[10px]">{ord.customer_phone}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ord.cashier_name}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        ₹{Number(ord.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isPending ? 'UNPAID' : (ord.payment_method || 'CASH')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.order_status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.order_status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-200 text-amber-950 border border-amber-300 font-extrabold'
                        }`}>
                          {isPending ? 'OCCUPIED' : ord.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending ? (
                            <>
                              {/* Add Dishes Button -> takes to POS */}
                              <button
                                onClick={() => navigate(`/pos?tableId=${ord.table_id}`)}
                                className="px-2 py-1 rounded-lg bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Add dishes to this table"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Dishes</span>
                              </button>

                              {/* Settle Bill Button */}
                              <button
                                onClick={() => openSettle(ord.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Settle payment and free table"
                              >
                                <IndianRupee className="w-3 h-3" />
                                <span>Settle</span>
                              </button>

                              {/* KOT Button */}
                              <button
                                onClick={() => openKot(ord.id)}
                                className="p-1.5 rounded-lg border border-amber-300 hover:bg-amber-50 text-amber-800 transition cursor-pointer"
                                title="View KOT"
                              >
                                <ChefHat className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openDetails(ord.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openReceipt(ord.id)}
                                className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
                                title="Reprint 58mm Thermal Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {ord.order_status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Cancel Order"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Bill Modal */}
      <SettleModal
        isOpen={!!settleOrder}
        onClose={() => setSettleOrder(null)}
        order={settleOrder}
        onSuccess={handleSettleSuccess}
      />

      {/* KOT Modal */}
      <KotModal
        isOpen={!!kotOrder}
        onClose={() => setKotOrder(null)}
        order={kotOrder}
      />

      {/* Order Details Drawer / Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Order Summary: {viewOrder.order_number}</h3>
                <p className="text-[11px] text-amber-400 capitalize">{viewOrder.order_type} • {viewOrder.table_number || 'Direct Takeaway'}</p>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Cashier:</span>
                  <p className="font-semibold">{viewOrder.cashier_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Date:</span>
                  <p className="font-semibold">{new Date(viewOrder.created_at).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-slate-400">Guest:</span>
                  <p className="font-semibold">{viewOrder.customer_name || 'Walk-in'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-bold uppercase text-amber-800">{viewOrder.order_status}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Ordered Items ({viewOrder.items?.length || 0})</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {viewOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center bg-white">
                      <div>
                        <div className="font-bold text-slate-900">{item.item_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.quantity} x ₹{Number(item.unit_price).toFixed(0)}
                          {item.notes && <span className="italic ml-2 text-amber-800">*{item.notes}</span>}
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-900">
                        ₹{Number(item.subtotal).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{Number(viewOrder.subtotal).toFixed(2)}</span>
                </div>
                {Number(viewOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-₹{Number(viewOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {Number(viewOrder.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({viewOrder.tax_rate}%):</span>
                    <span>₹{Number(viewOrder.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200 text-slate-950">
                  <span>Total Amount:</span>
                  <span className="text-amber-800">₹{Number(viewOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setViewOrder(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />
    </div>
  );
}
