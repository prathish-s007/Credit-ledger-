import React, { useState, useEffect } from 'react';
import ProductForm from '../components/ProductForm';
import API from '../services/api';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  Coins,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Aggregated stock metrics
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    totalValuation: 0,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await API.get('/products', {
        params: {
          search,
          sortBy,
          order,
          page,
          limit,
        },
      });
      setProducts(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalRecords(response.data.pagination.totalRecords);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error fetching products list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [sortBy, order, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    setTimeout(fetchProducts, 0);
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete product "${productName}"?`)) {
      try {
        await API.delete(`/products/${productId}`);
        fetchProducts();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  const openAddModal = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* 1. Metrics summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Products</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{metrics.totalProducts}</h3>
            </div>
          </div>
        </div>

        {/* Total Stock Valuation */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">₹{metrics.totalValuation.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low Stock Items</p>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{metrics.lowStockCount}</h3>
            </div>
          </div>
        </div>

        {/* Out of Stock count */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-450">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Out of Stock</p>
              <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{metrics.outOfStockCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Controls and Sort bar */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
            <Search className="text-slate-500 mr-2 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search by Name or Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none border-none text-sm text-slate-200 placeholder-slate-650"
            />
            {search && (
              <button type="button" onClick={handleClearSearch} className="text-slate-500 hover:text-white text-xs px-2">
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-4 shrink-0">
            {/* Sort selectors */}
            <div className="flex items-center space-x-2 text-xs bg-slate-950/60 border border-slate-800 rounded-2xl px-3 py-2">
              <SlidersHorizontal size={14} className="text-slate-500" />
              <select
                value={`${sortBy}-${order}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setSortBy(field);
                  setOrder(dir);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none text-slate-350 cursor-pointer font-semibold"
              >
                <option value="createdAt-desc" className="bg-slate-900 text-slate-200">Newest Created</option>
                <option value="name-asc" className="bg-slate-900 text-slate-200">Name (A-Z)</option>
                <option value="name-desc" className="bg-slate-900 text-slate-200">Name (Z-A)</option>
                <option value="price-desc" className="bg-slate-900 text-slate-200">Price (High-Low)</option>
                <option value="price-asc" className="bg-slate-900 text-slate-200">Price (Low-High)</option>
                <option value="stockQuantity-asc" className="bg-slate-900 text-slate-200">Stock (Low-High)</option>
                <option value="stockQuantity-desc" className="bg-slate-900 text-slate-200">Stock (High-Low)</option>
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-650/15"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* 3. Product table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                <th className="py-4 px-4">Product Details</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Stock Qty</th>
                <th className="py-4 px-4">Unit</th>
                <th className="py-4 px-4">Stock Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {loading ? (
                // Skeletons loader
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="space-y-2">
                        <div className="w-32 h-3.5 bg-slate-800 rounded"></div>
                        <div className="w-16 h-2.5 bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="w-12 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-12 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-8 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-20 h-5 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4 text-right"><div className="w-16 h-8 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                // Empty Table
                <tr>
                  <td colSpan="6" className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-sm font-semibold text-slate-400">No products found</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        There are no matching entries. Click "Add Product" above to catalog a new store item.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Table Rows
                products.map((prod) => {
                  const stock = prod.stockQuantity || 0;
                  
                  // Status badge rules
                  let statusText = 'In Stock';
                  let statusClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                  
                  if (stock === 0) {
                    statusText = 'Out of Stock';
                    statusClass = 'bg-rose-500/10 border-rose-500/20 text-rose-450';
                  } else if (stock < 10) {
                    statusText = 'Low Stock';
                    statusClass = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                  }

                  return (
                    <tr key={prod._id} className="hover:bg-slate-850/20 transition-colors text-slate-350">
                      <td className="py-4 px-4">
                        <div>
                          <h4 className="text-xs font-bold text-white">{prod.name}</h4>
                          <span className="inline-block text-[9px] font-bold text-indigo-400 bg-indigo-950/30 px-1.5 py-0.5 rounded-md mt-1 border border-indigo-550/10">
                            {prod.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-200">₹{(prod.price || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-400">{stock}</td>
                      <td className="py-4 px-4 text-xs text-slate-450 uppercase">{prod.unit || 'pcs'}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod._id, prod.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination panel */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-850">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              Showing page {page} of {totalPages} ({totalRecords} records total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productData={selectedProduct}
        onSaveSuccess={fetchProducts}
      />
    </div>
  );
};

export default Products;
