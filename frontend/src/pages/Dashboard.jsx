import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Package, Activity, Box, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_products: 0,
    low_stock_alerts: 0,
    active_suppliers: 0
  });
  
  const [isLive, setIsLive] = useState(false);
  
  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const fetchStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(async () => {
        try {
          await api.post('/simulate/generate-order');
          await fetchStats();
        } catch (error) {
          console.error("Simulation error:", error);
        }
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const statCards = [
    { 
      label: 'Total Revenue', 
      value: `$${stats.total_revenue.toLocaleString()}`, 
      change: '12% vs last month', 
      changeColor: 'text-green-500',
      icon: DollarSign, 
      iconColor: 'text-green-600', 
      iconBg: 'bg-green-100' 
    },
    { 
      label: 'Low Stock Items', 
      value: stats.low_stock_alerts, 
      change: '5 items vs last month', 
      changeColor: 'text-red-500',
      icon: AlertTriangle, 
      iconColor: 'text-orange-600', 
      iconBg: 'bg-orange-100' 
    },
    { 
      label: 'Active Orders', 
      value: '142', 
      change: '', 
      icon: Box, 
      iconColor: 'text-blue-600', 
      iconBg: 'bg-blue-100' 
    },
    { 
      label: 'Forecast Accuracy', 
      value: '94%',
      change: '', 
      icon: Activity, 
      iconColor: 'text-purple-600', 
      iconBg: 'bg-purple-100' 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <button 
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
            isLive 
              ? 'bg-green-50 border-green-500 text-green-600' 
              : 'bg-white border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-500'
          }`}
        >
          <Zap size={16} className={isLive ? 'fill-current' : ''} />
          {isLive ? 'Live Traffic On' : 'Simulate Live Traffic'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
           const Icon = stat.icon;
           
           return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                  {stat.change && (
                       <p className={`text-sm font-medium flex items-center ${
                         stat.changeColor ? stat.changeColor : 'text-gray-500'
                       }`}>
                         {stat.change}
                       </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.iconBg} ${stat.iconColor}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
           );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} barSize={40}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
             <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
               {stats.low_stock_alerts} Items
             </span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                   <th className="pb-3">Product Name</th>
                   <th className="pb-3">Stock</th>
                   <th className="pb-3">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {stats.low_stock_alerts > 0 ? (
                   [...Array(Math.min(stats.low_stock_alerts, 5))].map((_, i) => (
                     <tr key={i} className="group hover:bg-gray-50 transition-colors">
                       <td className="py-3 text-sm font-medium text-gray-900 group-hover:text-blue-600">Product #{i+1}</td>
                       <td className="py-3 text-sm text-gray-600">5</td>
                       <td className="py-3">
                         <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700">
                           Low
                         </span>
                       </td>
                     </tr>
                   ))
                 ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-400 py-8">
                        No low stock items
                      </td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
