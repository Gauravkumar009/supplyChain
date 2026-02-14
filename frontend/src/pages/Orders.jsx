import React, { useState, useEffect } from 'react';
import api, { downloadReport } from '../services/api';
import { Plus, Search, Filter, ShoppingCart, FileText, Table } from 'lucide-react';
import CreateOrderModal from '../components/CreateOrderModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDownload = async (format) => {
    setDownloading(true);
    await downloadReport(`/reports/orders/export/${format}`, `orders_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
    setDownloading(false);
  };

  const handleCreateOrder = async (orderData) => {
    try {
      await api.post('/orders', orderData);
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const filteredOrders = orders.filter(order => {
     const matchesSearch = 
       (order.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (order.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       order.id.toString().includes(searchTerm);
     
     const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
     
     return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-500 mt-1">Manage purchase orders and track shipments.</p>
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
            <Table size={20} className="mr-2" />
            Excel
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Create Order
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search orders by ID, product, or supplier..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            {['All', 'Pending', 'Received', 'Cancelled'].map(status => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        statusFilter === status 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Quantity</th>
                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {loading ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading orders...</td></tr>
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{order.id}
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Package size={16} />
                                </div>
                                <span className="font-medium text-gray-900">{order.product?.name || 'Unknown Product'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                             {order.supplier?.name || 'Unknown Supplier'}
                        </td>
                         <td className="px-6 py-4 text-sm font-medium text-gray-600">
                            {order.quantity} Units
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                           {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'Received' ? 'bg-green-100 text-green-800' :
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {order.status}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                        <button className="text-gray-400 hover:text-gray-600">
                            ...
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No orders found.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      <CreateOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOrder}
      />
    </div>
  );
};

export default Orders;
