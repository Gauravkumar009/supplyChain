import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import SupplierModal from '../components/SupplierModal';
import SupplierOrdersModal from '../components/SupplierOrdersModal';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedSupplierForOrders, setSelectedSupplierForOrders] = useState(null);
  const [showEmailOnly, setShowEmailOnly] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSave = async (supplierData) => {
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, supplierData);
      } else {
        await api.post('/suppliers', supplierData);
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error("Failed to save supplier:", error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
      } catch (error) {
        console.error("Failed to delete supplier:", error);
      }
    }
  };

  const handleViewOrders = (supplier) => {
    setSelectedSupplierForOrders(supplier);
    setIsOrdersModalOpen(true);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      supplier.name.toLowerCase().includes(term) ||
      (supplier.contact_name && supplier.contact_name.toLowerCase().includes(term)) ||
      (supplier.email && supplier.email.toLowerCase().includes(term)) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(term));
    
    const matchesFilter = showEmailOnly ? !!supplier.email : true;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
          <p className="text-gray-500 mt-1">Manage your supplier relationships and contacts.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, contact, email..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowEmailOnly(!showEmailOnly)}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border ${
            showEmailOnly 
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} className="mr-2" />
          {showEmailOnly ? 'Has Email' : 'Filter'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full text-center py-12 text-gray-500">Loading suppliers...</div>
        ) : filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => handleEdit(supplier)} 
                   className="p-2 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-blue-600"
                   title="Edit"
                 >
                   <Edit size={16} />
                 </button>
                 <button 
                   onClick={() => handleDelete(supplier.id)} 
                   className="p-2 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-red-600"
                   title="Delete"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>

              <div className="p-6 flex items-start justify-between border-b border-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">ID: #{supplier.id}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                  {supplier.name.charAt(0)}
                </div>
              </div>
              
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-900 min-w-[80px]">Contact:</span>
                  <span>{supplier.contact_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{supplier.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <span className="truncate">{supplier.email || 'N/A'}</span>
                </div>
                 <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="truncate">{supplier.address || 'San Francisco, CA'}</span> 
                </div>
                
                <div className="mt-4 h-32 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    title={supplier.name}
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(supplier.address || 'San Francisco, CA')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => handleViewOrders(supplier)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white font-medium transition-colors text-sm bg-white"
                >
                  View Orders
                </button>
                <a 
                  href={supplier.email ? `mailto:${supplier.email}` : '#'}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center ${
                    supplier.email 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={(e) => !supplier.email && e.preventDefault()}
                >
                  Contact
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">No suppliers found.</div>
        )}
      </div>

      <SupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        supplier={editingSupplier} 
        onSave={handleSave} 
      />
      
      <SupplierOrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        supplier={selectedSupplierForOrders}
      />
    </div>
  );
};


export default Suppliers;
