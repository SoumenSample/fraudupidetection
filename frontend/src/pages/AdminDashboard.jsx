import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, AlertTriangle, Shield, Activity, MapPin, Cpu, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500' },
    { title: 'Total Transactions', value: stats?.total_transactions || 0, icon: Activity, color: 'bg-purple-500' },
    { title: 'Fraud Detected', value: stats?.fraud_count || 0, icon: AlertTriangle, color: 'bg-red-500' },
    { title: 'Fraud Rate', value: `${stats?.fraud_percentage || 0}%`, icon: Shield, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">System-wide fraud detection analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{card.title}</span>
                <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Daily Transaction Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.daily_stats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" dot={{r:3}} />
              <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} name="Fraud" dot={{r:3}} />
              <Line type="monotone" dataKey="genuine" stroke="#10b981" strokeWidth={2} name="Genuine" dot={{r:3}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Top Fraud Locations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.top_fraud_locations || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="location" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Most Common Fraud Reasons</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats?.top_fraud_reasons || []} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="reason" label={({reason, count}) => `${reason}: ${count}`}>
                {stats?.top_fraud_reasons?.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Suspicious Devices</h3>
          <div className="space-y-3">
            {stats?.suspicious_devices?.map((device, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{device.device}</span>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  {device.count} frauds
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Recent Fraud Alerts
        </h3>
        <div className="space-y-3">
          {stats?.recent_alerts?.map((alert, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Alert #{alert.id?.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{alert.reasons?.join(', ')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  alert.risk_level === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {alert.fraud_score}%
                </span>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
