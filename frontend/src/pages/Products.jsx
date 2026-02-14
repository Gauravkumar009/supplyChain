import React, { useState, useEffect } from 'react';
import api, { downloadReport } from '../services/api';
import { Plus, Search, Filter, Package, FileText, Table as TableIcon } from 'lucide-react';
import ProductModal from '../components/ProductModal';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDownload = async (format) => {
    setDownloading(true);
    await downloadReport(`/reports/inventory/export/${format}`, `inventory_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
    setDownloading(false);
  };

  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
      } else {
        await api.post('/products', productData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const [showLowStock, setShowLowStock] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = showLowStock ? product.stock_level <= product.reorder_point : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-500 mt-1">Manage your inventory and product catalog.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => handleDownload('pdf')}
             disabled={downloading}
             className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileText size={20} className="mr-2" />
            PDF
          </button>
          <button 
             onClick={() => handleDownload('excel')}
             disabled={downloading}
             className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <TableIcon size={20} className="mr-2" />
            Excel
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowLowStock(!showLowStock)}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border ${
            showLowStock 
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} className="mr-2" />
          {showLowStock ? 'Show All' : 'Low Stock Only'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
             {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
             ) : filteredProducts.length > 0 ? (
               filteredProducts.map((product) => (
               <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                 <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                 <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                 <td className="px-6 py-4 text-sm text-gray-600">${product.price}</td>
                 <td className="px-6 py-4 text-sm text-gray-600">{product.stock_level}</td>
                 <td className="px-6 py-4 text-sm">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                     product.stock_level <= product.reorder_point 
                     ? 'bg-red-100 text-red-800' 
                     : 'bg-green-100 text-green-800'
                   }`}>
                     {product.stock_level <= product.reorder_point ? 'Low Stock' : 'In Stock'}
                   </span>
                 </td>
                 <td className="px-6 py-4 text-sm">
                   <button 
                     onClick={() => handleEdit(product)}
                     className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                   >
                     Edit
                   </button>
                 </td>
               </tr>
             ))
             ) : (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No products found.</td></tr>
             )}
          </tbody>
        </table>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct} 
        onSave={handleSave} 
      />
    </div>
  );
};

export default Products;
