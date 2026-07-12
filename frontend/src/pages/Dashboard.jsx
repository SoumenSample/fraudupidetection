import { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await transactionAPI.getStats();
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
    { title: 'Total Transactions', value: stats?.total_transactions || 0, icon: Activity, color: 'blue', trend: '+12%' },
    { title: 'Fraud Detected', value: stats?.fraud_count || 0, icon: AlertTriangle, color: 'red', trend: '+5%' },
    { title: 'Genuine', value: stats?.genuine_count || 0, icon: CheckCircle, color: 'green', trend: '+8%' },
    { title: 'Fraud Rate', value: `${stats?.fraud_rate || 0}%`, icon: TrendingUp, color: 'yellow', trend: '-2%' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-gray-500">Here's your transaction overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const colorMap = { blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500', yellow: 'bg-yellow-500' };
          return (
            <div key={idx} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{card.title}</span>
                <div className={`w-10 h-10 ${colorMap[card.color]} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <span className="text-xs text-green-600 font-medium">{card.trend}</span>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Transactions */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Daily Transactions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.daily_stats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="genuine" fill="#10b981" name="Genuine" radius={[4,4,0,0]} />
              <Bar dataKey="fraud" fill="#ef4444" name="Fraud" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud vs Genuine Pie */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Fraud vs Genuine</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={[
                {name: 'Genuine', value: stats?.genuine_count || 0},
                {name: 'Fraud', value: stats?.fraud_count || 0}
              ]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Amount Distribution */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Transaction Amount Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.amount_stats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Fraud Reasons */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Top Fraud Reasons</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.fraud_reasons || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{fontSize: 12}} />
              <YAxis type="category" dataKey="reason" tick={{fontSize: 11}} width={130} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
