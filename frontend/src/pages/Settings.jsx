import React, { useState } from 'react';
import { User, Bell, Lock, Globe, Moon, Sun, Save } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Globe },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4">
           <nav className="flex flex-col gap-1">
             {tabs.map((tab) => {
               const Icon = tab.icon;
               const isActive = activeTab === tab.id;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                     isActive 
                       ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                       : 'text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent'
                   }`}
                 >
                   <Icon size={20} />
                   {tab.label}
                 </button>
               );
             })}
           </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {activeTab === 'profile' && (
            <div className="max-w-xl flex flex-col gap-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Profile Information</h3>
              
              <div className="flex items-center gap-6 mb-2">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                  JS
                </div>
                <div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors text-sm bg-white">
                    Change Avatar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow sm:text-sm" defaultValue="John" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow sm:text-sm" defaultValue="Smith" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow sm:text-sm" defaultValue="john.smith@example.com" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm" defaultValue="Administrator" readOnly />
              </div>

              <div className="pt-4">
                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
             <div className="max-w-xl flex flex-col gap-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Notification Preferences</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive daily summaries and alerts via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Low Stock Alerts</h4>
                      <p className="text-sm text-gray-500">Get notified when inventory drops below reorder point.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
             </div>
          )}
          
           {activeTab === 'appearance' && (
             <div className="max-w-xl flex flex-col gap-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Appearance</h3>
                
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setDarkMode(false)} 
                     className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all cursor-pointer ${
                       !darkMode 
                         ? 'border-blue-600 bg-blue-50' 
                         : 'border-gray-200 bg-white hover:border-blue-300'
                     }`}
                   >
                     <Sun size={32} className={!darkMode ? 'text-blue-600' : 'text-gray-400'} />
                     <span className={`mt-3 font-medium ${!darkMode ? 'text-blue-700' : 'text-gray-600'}`}>Light Mode</span>
                   </button>
                   
                   <button 
                     onClick={() => setDarkMode(true)} 
                     className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all cursor-pointer ${
                       darkMode 
                         ? 'border-blue-600 bg-blue-50' 
                         : 'border-gray-200 bg-white hover:border-blue-300'
                     }`}
                   >
                     <Moon size={32} className={darkMode ? 'text-blue-600' : 'text-gray-400'} />
                     <span className={`mt-3 font-medium ${darkMode ? 'text-blue-700' : 'text-gray-600'}`}>Dark Mode</span>
                   </button>
                </div>
             </div>
          )}
          
          {activeTab === 'security' && (
             <div className="max-w-xl flex flex-col gap-6">
               <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Security Settings</h3>
               <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-100 text-sm">
                 Security settings are managed by your organization administrator.
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
