import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../services/api';

const Analytics = () => {
  const [forecastData, setForecastData] = useState([]);
  const [abcData, setAbcData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/analytics/analyze-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysisResult(response.data);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze file. Please ensure it's a valid CSV/Excel file.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Forecast for a specific product (e.g., ID 1 - Laptop Pro X)
        // In a real app, you'd select the product.
        const forecastRes = await api.get('/analytics/forecast/1'); 
        if (forecastRes.data && forecastRes.data.dates) {
             const formattedForecast = forecastRes.data.dates.map((date, index) => ({
                 name: date,
                 demand: forecastRes.data.forecast[index]
             }));
             setForecastData(formattedForecast);
        }

        const abcRes = await api.get('/analytics/abc');
        setAbcData(abcRes.data.slice(0, 10)); // Top 10 for view

      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
         <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-500 mt-1">Deep dive into data analysis and forecasting.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Ad-hoc Data Analysis</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-gray-50 mb-6">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {uploading && <span className="text-sm text-blue-600 mt-2 block font-medium">Analyzing...</span>}
        </div>

        {analysisResult && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Rows</p>
                <p className="text-xl font-bold text-gray-900">{analysisResult.row_count}</p>
              </div>
               <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Columns</p>
                <p className="text-xl font-bold text-gray-900">{analysisResult.columns.length}</p>
              </div>
            </div>

            {analysisResult.chart_data && (
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Visual Analysis ({analysisResult.chart_config.type === 'line' ? 'Time Series' : 'Category Distribution'})
                </h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {analysisResult.chart_config.type === 'line' ? (
                       <LineChart data={analysisResult.chart_data}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                         <XAxis 
                            dataKey={analysisResult.chart_config.xKey} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#6b7280', fontSize: 12}} 
                            dy={10}
                         />
                         <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#6b7280', fontSize: 12}} 
                         />
                         <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                         <Legend />
                         <Line 
                            type="monotone" 
                            dataKey={analysisResult.chart_config.yKey} 
                            stroke="#8b5cf6" 
                            strokeWidth={3} 
                            dot={{r: 4, fill: '#8b5cf6', strokeWidth: 0}} 
                            activeDot={{r: 6}} 
                         />
                       </LineChart>
                    ) : (
                       <BarChart data={analysisResult.chart_data}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                         <XAxis 
                            dataKey={analysisResult.chart_config.xKey} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#6b7280', fontSize: 12}} 
                            dy={10}
                         />
                         <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#6b7280', fontSize: 12}} 
                         />
                         <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                         <Legend />
                         <Bar 
                            dataKey={analysisResult.chart_config.yKey} 
                            fill="#8b5cf6" 
                            radius={[4, 4, 0, 0]} 
                         />
                       </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}


            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 px-4 pt-4">Data Preview</h4>
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    {analysisResult.columns.map(col => (
                      <th key={col} className="px-6 py-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analysisResult.head.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      {analysisResult.columns.map(col => (
                        <td key={col} className="px-6 py-3 text-gray-600 whitespace-nowrap">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
               <h4 className="text-sm font-semibold text-gray-900 mb-2">Column Statistics</h4>
               <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                 {JSON.stringify(analysisResult.summary, null, 2)}
               </pre>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Demand Forecast (Product #1)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend wrapperStyle={{paddingTop: '20px'}} />
                <Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">ABC Analysis (Inventory Value)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abcData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#4b5563'}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Value ($)" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Analytics;
