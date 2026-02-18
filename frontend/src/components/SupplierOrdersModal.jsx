import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import api from '../services/api';

const SupplierOrdersModal = ({ isOpen, onClose, supplier }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && supplier) {
      const fetchOrders = async () => {
        try {
          const response = await api.get('/orders');
          const supplierOrders = response.data.filter(o => o.supplier_id === supplier.id);
          setOrders(supplierOrders);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [isOpen, supplier]);

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Orders from {supplier.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : orders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                       <Package size={20} />
                     </div>
                     <div>
                       <p className="font-medium text-gray-900">Order #{order.id}</p>
                       <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-medium text-gray-900">{order.quantity} Units</p>
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                       order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                       order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                       'bg-gray-100 text-gray-800'
                     }`}>
                       {order.status}
                     </span>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package size={48} className="text-gray-200 mb-2" />
              <p className="text-gray-500">No orders found for this supplier.</p>
              <button 
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline bg-transparent border-none cursor-pointer"
              >
                Create Purchase Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierOrdersModal;
