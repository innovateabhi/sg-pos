import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid3x3, 
  Users, 
  Clock, 
  PlusCircle, 
  CheckCircle2, 
  UtensilsCrossed, 
  Receipt, 
  RefreshCw,
  Trash2,
  ChefHat,
  IndianRupee,
  Plus
} from 'lucide-react';
import api from '../services/api';
import ReceiptModal from '../components/pos/ReceiptModal';
import KotModal from '../components/pos/KotModal';
import SettleModal from '../components/pos/SettleModal';

export default function Tables() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'available', 'occupied', 'reserved'

  // Modals State
  const [settleOrder, setSettleOrder] = useState(null);
  const [kotOrder, setKotOrder] = useState(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  const fetchTables = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/tables.php', { action: 'list' });
      if (res && res.success) {
        setTables(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch table layout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleClearTable = async (table) => {
    if (!window.confirm(`Clear and release table "${table.table_number}" as Available?`)) return;
    try {
      const res = await api.post('/api/tables.php?action=clear-table', { id: table.id });
      if (res?.success) {
        fetchTables();
      }
    } catch (err) {
      alert('Failed to clear table: ' + err.message);
    }
  };

  const handleToggleReserved = async (table) => {
    const newStatus = table.status === 'reserved' ? 'available' : 'reserved';
    try {
      const res = await api.post('/api/tables.php?action=update-status', {
        id: table.id,
        status: newStatus,
      });
      if (res?.success) {
        fetchTables();
      }
    } catch (err) {
      alert('Failed to update table status: ' + err.message);
    }
  };

  // Open Settle Bill Modal for Occupied Table
  const openSettleModal = async (table) => {
    try {
      const res = await api.get('/api/orders.php', {
        action: 'active-table-order',
        table_id: table.id
      });
      if (res?.success && res.data) {
        setSettleOrder(res.data);
      } else {
        alert('No active running order found for this table.');
      }
    } catch (err) {
      alert('Could not fetch active order: ' + err.message);
    }
  };

  // Open KOT Modal for table
  const openKotModal = async (table) => {
    try {
      const res = await api.get('/api/orders.php', {
        action: 'active-table-order',
        table_id: table.id
      });
      if (res?.success && res.data) {
        setKotOrder(res.data);
      } else {
        alert('Could not load order details for KOT');
      }
    } catch (err) {
      alert('Failed to load KOT: ' + err.message);
    }
  };

  // Callback when SettleModal successfully finishes payment
  const handleSettlementSuccess = (finalOrder) => {
    fetchTables();
    setSelectedReceiptOrder(finalOrder);
  };

  const totalOccupied = tables.filter((t) => t.status === 'occupied').length;
  const totalAvailable = tables.filter((t) => t.status === 'available').length;
  const totalReserved = tables.filter((t) => t.status === 'reserved').length;

  const filteredTables = tables.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dining Floor & Tables</h1>
          <p className="text-xs text-slate-500">Live visual occupancy, table turnaround, and instant settlement</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus(filterStatus === 'available' ? 'all' : 'available')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                filterStatus === 'available'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{totalAvailable} Available</span>
            </button>

            <button
              onClick={() => setFilterStatus(filterStatus === 'occupied' ? 'all' : 'occupied')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                filterStatus === 'occupied'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{totalOccupied} Occupied</span>
            </button>

            <button
              onClick={() => setFilterStatus(filterStatus === 'reserved' ? 'all' : 'reserved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                filterStatus === 'reserved'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>{totalReserved} Reserved</span>
            </button>
          </div>

          <button
            onClick={fetchTables}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh tables"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const isReserved = table.status === 'reserved';
          const isAvailable = table.status === 'available';

          return (
            <div
              key={table.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                isOccupied
                  ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                  : isReserved
                  ? 'bg-purple-50/60 border-purple-200'
                  : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'
              }`}
            >
              <div>
                {/* Table Header: Number & Capacity */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                        isOccupied
                          ? 'bg-amber-600 text-white shadow-xs'
                          : isReserved
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {table.table_number}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">{table.table_number}</h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{table.capacity} Guests</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isOccupied
                        ? 'bg-amber-200 text-amber-900 border border-amber-300'
                        : isReserved
                        ? 'bg-purple-200 text-purple-900 border border-purple-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                {/* Body: Active Running Ticket Info if Occupied */}
                {isOccupied ? (
                  <div className="bg-white/95 p-3 rounded-xl border border-amber-200 text-xs space-y-1.5 mb-3 shadow-2xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-950 truncate">
                        {table.customer_name || 'Dine-In Guests'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {table.items_count || 0} dishes
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Order No:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {table.order_number || 'Running'}
                      </span>
                    </div>

                    <div className="text-[11px] flex justify-between items-center pt-1 border-t border-slate-100">
                      <span className="font-bold text-slate-700">Running Total:</span>
                      <span className="font-black text-amber-900 text-sm">
                        ₹{Number(table.total_amount || 0).toFixed(0)}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Seated {table.elapsed_minutes || 0} mins ago</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => navigate(`/pos?tableId=${table.id}`)}
                    className="py-6 text-center text-xs text-slate-400 cursor-pointer hover:bg-emerald-50/50 rounded-xl transition"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 opacity-70" />
                    <span className="font-semibold text-slate-600">Table Ready</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click to Take Order</p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100/80 flex flex-col gap-1.5">
                {isOccupied ? (
                  <div className="space-y-1.5">
                    {/* Primary Button: + Add More Dishes in POS */}
                    <button
                      onClick={() => navigate(`/pos?tableId=${table.id}`)}
                      className="w-full py-1.5 px-2 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Dishes to Table</span>
                    </button>

                    {/* Settle Bill & KOT Actions */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openSettleModal(table)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                      >
                        <IndianRupee className="w-3 h-3" />
                        <span>Settle Bill</span>
                      </button>

                      <button
                        onClick={() => openKotModal(table)}
                        className="py-1.5 px-2 rounded-xl border border-amber-300 hover:bg-white text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Kitchen Order Ticket"
                      >
                        <ChefHat className="w-3 h-3" />
                        <span>KOT</span>
                      </button>

                      <button
                        onClick={() => handleClearTable(table)}
                        className="py-1.5 px-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-[11px] transition cursor-pointer"
                        title="Clear & Free Table"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => navigate(`/pos?tableId=${table.id}`)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Take Order</span>
                    </button>
                    <button
                      onClick={() => handleToggleReserved(table)}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isReserved
                          ? 'border-purple-300 bg-purple-100 text-purple-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                      title={isReserved ? 'Unreserve Table' : 'Reserve Table'}
                    >
                      {isReserved ? 'Reserved' : 'Reserve'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Settle Bill Modal from Tables screen */}
      <SettleModal
        isOpen={!!settleOrder}
        onClose={() => setSettleOrder(null)}
        order={settleOrder}
        onSuccess={handleSettlementSuccess}
      />

      {/* KOT Modal from Tables screen */}
      <KotModal
        isOpen={!!kotOrder}
        onClose={() => setKotOrder(null)}
        order={kotOrder}
      />

      {/* Thermal Receipt Modal on Bill Paid */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />
    </div>
  );
}
