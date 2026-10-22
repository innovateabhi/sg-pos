import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search, 
  BookOpen, 
  FolderPlus,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../services/api';

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [search, setSearch] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemVeg, setItemVeg] = useState(1);
  const [itemAvailable, setItemAvailable] = useState(1);

  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState(1);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        api.get('/api/menu.php', { action: 'categories' }),
        api.get('/api/menu.php', { action: 'items' }),
      ]);
      if (catsRes?.success) setCategories(catsRes.data);
      if (itemsRes?.success) setItems(itemsRes.data);
    } catch (err) {
      alert('Error fetching menu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCatId(categories[0]?.id || '');
    setItemPrice('');
    setItemDesc('');
    setItemVeg(1);
    setItemAvailable(1);
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCatId(item.category_id);
    setItemPrice(item.price);
    setItemDesc(item.description || '');
    setItemVeg(Number(item.is_veg));
    setItemAvailable(Number(item.is_available));
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingItem?.id,
        name: itemName,
        category_id: itemCatId,
        price: itemPrice,
        description: itemDesc,
        is_veg: itemVeg,
        is_available: itemAvailable,
      };

      const res = await api.post('/api/menu.php?action=save-item', payload);
      if (res?.success) {
        setShowItemModal(false);
        fetchMenuData();
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleToggleAvailability = async (item) => {
    const newStatus = Number(item.is_available) === 1 ? 0 : 1;
    try {
      const res = await api.post('/api/menu.php?action=toggle-availability', {
        id: item.id,
        is_available: newStatus,
      });
      if (res?.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_available: newStatus } : i))
        );
      }
    } catch (err) {
      alert('Failed to toggle availability: ' + err.message);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete dish "${item.name}"?`)) return;
    try {
      const res = await api.post('/api/menu.php?action=delete-item', { id: item.id });
      if (res?.success) {
        fetchMenuData();
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingCategory?.id,
        name: catName,
        display_order: catOrder,
      };
      const res = await api.post('/api/menu.php?action=categories', payload);
      if (res?.success) {
        setShowCategoryModal(false);
        fetchMenuData();
      }
    } catch (err) {
      alert('Category save failed: ' + err.message);
    }
  };

  // Filter items
  const filtered = items.filter((item) => {
    const matchesCat = selectedCategory === 0 || Number(item.category_id) === Number(selectedCategory);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Food Menu & Dishes</h1>
          <p className="text-xs text-slate-500">Configure categories, update dish prices, and toggle kitchen availability</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCatName('');
              setCatOrder(categories.length + 1);
              setShowCategoryModal(true);
            }}
            className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
          <button
            onClick={openAddItemModal}
            className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setSelectedCategory(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 0 ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === c.id ? 'bg-[#E99A24] text-slate-950 shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish in menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Dish Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Price (₹)</th>
                <th className="py-3 px-4 text-center">In Stock?</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading menu...</td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => {
                  const isAvailable = Number(item.is_available) === 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{item.category_name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          Number(item.is_veg) === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${Number(item.is_veg) === 1 ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          <span>{Number(item.is_veg) === 1 ? 'Veg' : 'Non-Veg'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        ₹{Number(item.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Click to toggle availability"
                        >
                          {isAvailable ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-500" />}
                          <span>{isAvailable ? 'Available' : 'Out of Stock'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditItemModal(item)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No dishes found. Click "Add New Dish" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Dish Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingItem ? 'Edit Dish Details' : 'Add New Menu Dish'}</h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Chicken Tikka Butter Masala"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={itemCatId}
                    onChange={(e) => setItemCatId(e.target.value)}
                    required
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="250"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Ingredients, preparation style..."
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dietary Type</label>
                  <select
                    value={itemVeg}
                    onChange={(e) => setItemVeg(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value={1}>Veg (Green)</option>
                    <option value={0}>Non-Veg (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kitchen Status</label>
                  <select
                    value={itemAvailable}
                    onChange={(e) => setItemAvailable(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value={1}>Available for Orders</option>
                    <option value={0}>Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="py-2 px-3 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-[#E99A24] text-slate-950 font-bold"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Desserts & Shakes"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="py-2 px-3 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-[#E99A24] text-slate-950 font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
