import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Shield, Mail, Calendar } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-blue-600" />
          Manage Users
        </h1>
        <p className="text-gray-500">{users.length} registered users</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        ) : users.map(user => (
          <div key={user.id} className="glass-card p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {user.role === 'admin' ? '👑 Admin' : '👤 User'}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
