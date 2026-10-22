import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  IndianRupee, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Utensils, 
  ShoppingBag, 
  Users, 
  X, 
  CheckCircle,
  QrCode, 
  Flame, 
  ArrowRight,
  Clock,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import ReceiptModal from '../components/pos/ReceiptModal';
import KotModal from '../components/pos/KotModal';
import SettleModal from '../components/pos/SettleModal';

export default function POS() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryTableId = searchParams.get('tableId');

  // Catalogs
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active Order / Table State
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' or 'takeaway'
  const [selectedTableId, setSelectedTableId] = useState(queryTableId || '');
  const [activeTableOrder, setActiveTableOrder] = useState(null); // Loaded if table is occupied
  const [loadingTableOrder, setLoadingTableOrder] = useState(false);

  // New Cart Items (dishes picked to either occupy table or add to table)
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountValue, setDiscountValue] = useState(0);

  // Restaurant Settings
  const [restaurantSettings, setRestaurantSettings] = useState({ tax_rate: 5.0 });

  // Modals & Confirmation States
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [kotOrder, setKotOrder] = useState(null); // If open, show KOT modal
  const [kotNewlyAddedOnly, setKotNewlyAddedOnly] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null); // Receipt modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // Success notification banner

  // Fetch initial catalogs
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes, tablesRes, setRes] = await Promise.all([
        api.get('/api/menu.php', { action: 'categories' }),
        api.get('/api/menu.php', { action: 'items' }),
        api.get('/api/tables.php', { action: 'list' }),
        api.get('/api/settings.php')
      ]);

      if (catsRes?.success) setCategories(catsRes.data);
      if (itemsRes?.success) setMenuItems(itemsRes.data);
      if (tablesRes?.success) setTables(tablesRes.data);
      if (setRes?.success) setRestaurantSettings(setRes.data || { tax_rate: 5.0 });
    } catch (err) {
      console.error('POS data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // When selectedTableId changes or query param is set, load active order if occupied
  const loadActiveTableOrder = useCallback(async (tableId) => {
    if (!tableId || orderType !== 'dine_in') {
      setActiveTableOrder(null);
      return;
    }

    setLoadingTableOrder(true);
    try {
      const res = await api.get('/api/orders.php', {
        action: 'active-table-order',
        table_id: tableId
      });

      if (res?.success && res.data) {
        setActiveTableOrder(res.data);
        if (res.data.customer_name) setCustomerName(res.data.customer_name);
        if (res.data.customer_phone) setCustomerPhone(res.data.customer_phone);
        if (res.data.notes) setOrderNotes(res.data.notes);
      } else {
        setActiveTableOrder(null);
      }
    } catch (err) {
      console.error('Failed to load table active order:', err);
      setActiveTableOrder(null);
    } finally {
      setLoadingTableOrder(false);
    }
  }, [orderType]);

  useEffect(() => {
    if (selectedTableId) {
      loadActiveTableOrder(selectedTableId);
    } else {
      setActiveTableOrder(null);
    }
  }, [selectedTableId, loadActiveTableOrder]);

  // If query param set initially, select it
  useEffect(() => {
    if (queryTableId) {
      setSelectedTableId(queryTableId);
      setOrderType('dine_in');
    }
  }, [queryTableId]);

  // Selected Table Object
  const currentTable = tables.find((t) => Number(t.id) === Number(selectedTableId));
  const isTableOccupied = currentTable?.status === 'occupied' || !!activeTableOrder;

  // Filter Menu Items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 0 || Number(item.category_id) === Number(selectedCategory);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !vegOnly || Number(item.is_veg) === 1;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  // Cart operations (for new items to add)
  const addToCart = (item) => {
    if (Number(item.is_available) !== 1) return;

    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        return [
          ...prevCart,
          {
            id: item.id,
            name: item.name,
            price: Number(item.price),
            is_veg: item.is_veg,
            quantity: 1,
            notes: '',
          },
        ];
      }
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean)
    );
  };

  const updateItemNotes = (itemId, notes) => {
    setCart((prevCart) =>
      prevCart.map((ci) => (ci.id === itemId ? { ...ci, notes } : ci))
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.id !== itemId));
  };

  const clearNewCart = () => {
    if (cart.length === 0) return;
    setCart([]);
  };

  // Remove existing item from active table order
  const handleRemoveExistingItem = async (item) => {
    if (!activeTableOrder) return;
    if (!window.confirm(`Remove "${item.item_name}" from active table order?`)) return;

    try {
      const res = await api.post('/api/orders.php?action=remove-item', {
        order_id: activeTableOrder.id,
        item_id: item.id
      });
      if (res?.success) {
        setActiveTableOrder((prev) => ({
          ...prev,
          items: res.data.items,
          subtotal: res.data.subtotal,
          total_amount: res.data.total_amount
        }));
        setStatusMessage({ type: 'info', text: `Removed "${item.item_name}" from table order.` });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      alert('Failed to remove item: ' + err.message);
    }
  };

  // Calculations
  const taxRate = Number(restaurantSettings?.tax_rate || 5.0);
  const existingItems = activeTableOrder?.items || [];
  const existingSubtotal = existingItems.reduce(
    (sum, item) => sum + (Number(item.subtotal) || Number(item.unit_price) * Number(item.quantity)),
    0
  );

  const newSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSubtotal = existingSubtotal + newSubtotal;

  const numDiscount = Math.max(0, Number(discountValue) || 0);
  const discountAmt = Math.min(totalSubtotal, numDiscount);
  const discountedSubtotal = Math.max(0, totalSubtotal - discountAmt);
  const taxAmount = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;
  const grandTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

  // 1. SAVE & OCCUPY TABLE (Primary action when table is available)
  const handleSaveAndOccupyTable = async () => {
    if (cart.length === 0) {
      alert('Please add dishes to the cart first.');
      return;
    }
    if (orderType === 'dine_in' && !selectedTableId) {
      alert('Please choose a dining table to occupy.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        order_type: orderType,
        table_id: orderType === 'dine_in' ? selectedTableId : null,
        table_number: currentTable?.table_number || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        notes: orderNotes,
        discount_type: 'flat',
        discount_value: discountAmt,
        is_hold: true, // KEEP / OCCUPY TABLE
        items: cart.map((ci) => ({
          id: ci.id,
          name: ci.name,
          price: ci.price,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
      };

      const res = await api.post('/api/orders.php?action=create', payload);

      if (res && res.success) {
        const created = res.data;
        setStatusMessage({
          type: 'success',
          text: `Table "${currentTable?.table_number || 'Dine-In'}" is now OCCUPIED with Order #${created.order_number}! Dishes sent to kitchen.`
        });

        // Set as active order
        setActiveTableOrder(created);
        setCart([]); // Clear new cart since they are now saved on the table

        // Prompt or offer KOT
        setKotOrder(created);
        setKotNewlyAddedOnly(false);

        // Refresh tables list
        const tablesRes = await api.get('/api/tables.php', { action: 'list' });
        if (tablesRes?.success) setTables(tablesRes.data);
      }
    } catch (err) {
      alert('Failed to occupy table: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. ADD MORE DISHES TO OCCUPIED TABLE
  const handleAddMoreDishesToTable = async () => {
    if (!activeTableOrder) {
      alert('No active table order found to add dishes to.');
      return;
    }
    if (cart.length === 0) {
      alert('Select dishes from the menu to add to this table.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        order_id: activeTableOrder.id,
        items: cart.map((ci) => ({
          id: ci.id,
          name: ci.name,
          price: ci.price,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
      };

      const res = await api.post('/api/orders.php?action=add-items', payload);

      if (res && res.success) {
        const updated = res.data;
        setStatusMessage({
          type: 'success',
          text: `Added ${cart.length} new dish(es) to Table "${currentTable?.table_number}". Total updated to ₹${Number(updated.total_amount).toFixed(2)}.`
        });

        // Open KOT modal for newly added round of dishes
        setKotOrder(updated);
        setKotNewlyAddedOnly(true);

        setActiveTableOrder(updated);
        setCart([]); // Clear cart of newly added items

        // Refresh tables list
        const tablesRes = await api.get('/api/tables.php', { action: 'list' });
        if (tablesRes?.success) setTables(tablesRes.data);
      }
    } catch (err) {
      alert('Failed to add dishes to table: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. CHECKOUT / PAY BILL (Opens SettleModal)
  const handleOpenSettle = () => {
    if (!activeTableOrder && cart.length === 0) {
      alert('Cart is empty. Add dishes or select an active table.');
      return;
    }
    if (orderType === 'dine_in' && !selectedTableId) {
      alert('Please select a dining table.');
      return;
    }
    setShowSettleModal(true);
  };

  // Order settled successfully
  const handleSettlementSuccess = async (settledOrder) => {
    setCompletedOrder(settledOrder);
    setCart([]);
    setActiveTableOrder(null);
    setSelectedTableId('');
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setDiscountValue(0);

    setStatusMessage({
      type: 'success',
      text: `Payment completed for Order #${settledOrder.order_number}! Table is now FREE & Available.`
    });

    // Refresh tables list
    const tablesRes = await api.get('/api/tables.php', { action: 'list' });
    if (tablesRes?.success) setTables(tablesRes.data);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 -m-2 sm:-m-4 h-[calc(100vh-5rem)]">
      
      {/* LEFT 2 COLUMNS: Menu Catalog & Categories */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden min-w-0">
        
        {/* Search & Filters Header */}
        <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. Biryani, Butter Naan, Kebab)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#E99A24] bg-white text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                vegOnly
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Veg Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="px-4 py-2 border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0 bg-white">
          <button
            onClick={() => setSelectedCategory(0)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 0
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Dishes ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#E99A24] text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dishes Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Loading Saffron Grill menu catalogue...
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const inNewCart = cart.find((c) => c.id === item.id);
                const inExisting = existingItems.find((e) => Number(e.menu_item_id) === Number(item.id));
                const isOutOfStock = Number(item.is_available) !== 1;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`p-3 rounded-2xl border transition relative flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200/90 hover:border-amber-400 hover:shadow-md cursor-pointer group active:scale-98'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                              Number(item.is_veg) === 1
                                ? 'bg-emerald-600 border-emerald-700'
                                : 'bg-rose-600 border-rose-700'
                            }`}
                            title={Number(item.is_veg) === 1 ? 'Vegetarian' : 'Non-Vegetarian'}
                          />
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-800 transition line-clamp-1">
                            {item.name}
                          </h4>
                        </div>

                        {/* Badges for in cart or on table */}
                        <div className="flex items-center gap-1 shrink-0">
                          {inExisting && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {inExisting.quantity} on table
                            </span>
                          )}
                          {inNewCart && (
                            <span className="w-5 h-5 rounded-full bg-[#E99A24] text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                              {inNewCart.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{Number(item.price).toFixed(0)}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-amber-50 group-hover:bg-[#E99A24] text-amber-900 group-hover:text-slate-950'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
              <Flame className="w-8 h-8 text-slate-300 mb-2" />
              <p>No dishes found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: Table Selector, Existing Dishes & New Dishes Cart */}
      <div className="w-full lg:w-[410px] bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden shrink-0">
        
        {/* Banner / Notification Toast */}
        {statusMessage && (
          <div className={`p-2.5 px-4 text-xs font-semibold flex items-center justify-between transition ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' : 'bg-blue-50 text-blue-900 border-b border-blue-200'
          }`}>
            <span className="flex-1">{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="ml-2 text-slate-500 hover:text-slate-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Control Bar: Dine-In vs Takeaway & Table Selection */}
        <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 space-y-2.5">
          
          {/* Order Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setOrderType('dine_in');
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                orderType === 'dine_in'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Dine-In Table</span>
            </button>
            <button
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTableId('');
                setActiveTableOrder(null);
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                orderType === 'takeaway'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Takeaway</span>
            </button>
          </div>

          {/* Dine-in Table Selector */}
          {orderType === 'dine_in' && (
            <div>
              <div className="flex gap-2 items-center">
                <label className="text-[11px] font-bold text-slate-700 shrink-0">Table:</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
                >
                  <option value="">-- Select Dining Table --</option>
                  {tables.map((tbl) => {
                    const isOcc = tbl.status === 'occupied';
                    return (
                      <option key={tbl.id} value={tbl.id}>
                        {tbl.table_number} ({tbl.capacity} Seats) - {isOcc ? `🔴 OCCUPIED (₹${Number(tbl.total_amount || 0).toFixed(0)})` : '🟢 Available'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Table Status Quick Strip */}
              {selectedTableId && (
                <div className="mt-2">
                  {loadingTableOrder ? (
                    <div className="p-2 text-center text-xs text-slate-400">Loading table status...</div>
                  ) : isTableOccupied && activeTableOrder ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                          <span className="font-bold text-amber-950">
                            {currentTable?.table_number} is OCCUPIED
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800">
                          Order #{activeTableOrder.order_number} • Seated {activeTableOrder.elapsed_minutes || 0}m ago
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setKotOrder(activeTableOrder);
                            setKotNewlyAddedOnly(false);
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[10px] font-bold flex items-center gap-1 transition"
                          title="View Kitchen Order Ticket"
                        >
                          <ChefHat className="w-3 h-3" />
                          <span>KOT</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{currentTable?.table_number} is Available for new guests</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Name & Phone Input */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <input
              type="text"
              placeholder="Guest Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
            />
            <input
              type="text"
              placeholder="Phone (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
            />
          </div>
        </div>

        {/* ORDER ITEMS LIST: Section A (Existing Table Dishes) + Section B (New Dishes to Add) */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          
          {/* SECTION A: Existing Ordered Dishes on this Occupied Table */}
          {isTableOccupied && existingItems.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <ChefHat className="w-3 h-3 text-amber-600" />
                  <span>Dishes in Kitchen / On Table ({existingItems.length})</span>
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  ₹{existingSubtotal.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5">
                {existingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl border border-amber-200/90 bg-amber-50/40 text-xs flex items-center justify-between"
                  >
                    <div className="pr-2 truncate">
                      <div className="font-bold text-slate-900 truncate">
                        {item.item_name}
                      </div>
                      <div className="text-[10px] text-amber-800 flex items-center gap-2">
                        <span>{item.quantity} x ₹{Number(item.unit_price).toFixed(0)}</span>
                        {item.notes && <span className="italic">*{item.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-extrabold text-slate-900">
                        ₹{(Number(item.subtotal) || Number(item.unit_price) * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleRemoveExistingItem(item)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove dish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION B: New Dishes Being Added (Cart) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>{isTableOccupied ? 'New Dishes to Add' : 'Order Dishes'} ({cart.length})</span>
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearNewCart}
                  className="text-[10px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  Clear New
                </button>
              )}
            </div>

            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold text-slate-900 truncate pr-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                        +New
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      ₹{item.price} each
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center ml-1 transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Special Cooking Note */}
                  <input
                    type="text"
                    placeholder="Instructions for chef (e.g. less spicy, crisp naan)..."
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    className="w-full mt-1.5 py-0.5 px-2 text-[10px] text-slate-600 italic rounded border border-transparent focus:border-slate-300 focus:bg-slate-50 bg-slate-50/50"
                  />
                </div>
              ))
            ) : (
              !isTableOccupied && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mb-1.5" />
                  <p className="font-semibold text-slate-600">No dishes selected yet</p>
                  <p className="text-[10px] text-slate-400">Click dishes from the menu catalog to begin</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bill Calculations & Multi-Option Action Panel */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 space-y-2">
          
          {/* Subtotal, Discount, Tax */}
          <div className="text-xs space-y-1 text-slate-600">
            {isTableOccupied && existingItems.length > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>Existing Table Subtotal:</span>
                <span className="font-medium text-slate-700">₹{existingSubtotal.toFixed(2)}</span>
              </div>
            )}

            {cart.length > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>New Items Subtotal:</span>
                <span className="font-medium text-emerald-800">+₹{newSubtotal.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold">
              <span>Combined Subtotal:</span>
              <span className="text-slate-900">₹{totalSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder="0"
                className="w-20 py-0.5 px-1.5 text-right text-xs rounded border border-slate-300 bg-white text-slate-900 font-semibold"
              />
            </div>

            <div className="flex justify-between">
              <span>GST ({taxRate}%):</span>
              <span className="text-slate-900">₹{taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-200 text-slate-950">
              <span>TOTAL PAYABLE:</span>
              <span className="text-amber-800 text-base">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* DYNAMIC ACTION BUTTONS BASED ON TABLE STATUS */}
          <div className="pt-1.5 space-y-2">
            
            {/* SCENARIO 1: Table is ALREADY Occupied */}
            {isTableOccupied ? (
              <div className="space-y-2">
                {/* Add new dishes to running table order */}
                {cart.length > 0 && (
                  <button
                    onClick={handleAddMoreDishesToTable}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Send {cart.length} New Dishes to Table & Kitchen</span>
                  </button>
                )}

                {/* Settle Bill & Free Table */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setKotOrder(activeTableOrder);
                      setKotNewlyAddedOnly(false);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer flex items-center justify-center gap-1"
                    title="Print KOT for table"
                  >
                    <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                    <span>KOT</span>
                  </button>

                  <button
                    onClick={handleOpenSettle}
                    disabled={totalSubtotal === 0}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <IndianRupee className="w-4 h-4" />
                    <span>Checkout & Pay ₹{grandTotal.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* SCENARIO 2: Table is Available or Takeaway */
              <div className="space-y-2">
                {orderType === 'dine_in' ? (
                  <>
                    {/* PRIMARY BUTTON: Save & Occupy Table */}
                    <button
                      onClick={handleSaveAndOccupyTable}
                      disabled={cart.length === 0 || isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-40 transition active:scale-98 cursor-pointer"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Save & Occupy Table {currentTable?.table_number ? `(${currentTable.table_number})` : ''}</span>
                    </button>

                    {/* SECONDARY BUTTON: Direct Immediate Checkout */}
                    <button
                      onClick={handleOpenSettle}
                      disabled={cart.length === 0 || isSubmitting}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Quick Pay Directly (₹{grandTotal.toFixed(2)})</span>
                    </button>
                  </>
                ) : (
                  /* Takeaway Buttons */
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveAndOccupyTable}
                      disabled={cart.length === 0 || isSubmitting}
                      className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
                    >
                      Hold Order
                    </button>
                    <button
                      onClick={handleOpenSettle}
                      disabled={cart.length === 0 || isSubmitting}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer disabled:opacity-40"
                    >
                      <span>Pay ₹{grandTotal.toFixed(2)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Settle Bill & Payment Modal */}
      <SettleModal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        order={activeTableOrder || {
          order_type: orderType,
          table_id: selectedTableId,
          table_number: currentTable?.table_number,
          customer_name: customerName,
          customer_phone: customerPhone,
          notes: orderNotes,
          tax_rate: taxRate,
          discount_type: 'flat',
          discount_value: discountValue,
          items: []
        }}
        additionalItems={cart}
        onSuccess={handleSettlementSuccess}
      />

      {/* MODAL 2: Kitchen Order Ticket (KOT) Modal */}
      <KotModal
        isOpen={!!kotOrder}
        onClose={() => setKotOrder(null)}
        order={kotOrder}
        newlyAddedOnly={kotNewlyAddedOnly}
      />

      {/* MODAL 3: Auto-Triggered Thermal Bill Receipt Modal on Settle */}
      <ReceiptModal
        isOpen={!!completedOrder}
        onClose={() => setCompletedOrder(null)}
        order={completedOrder}
      />
    </div>
  );
}
