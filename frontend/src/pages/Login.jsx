import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { ShieldAlert, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await authAPI.login({ email: form.email, password: form.password });
      } else {
        res = await authAPI.register(form);
      }
      loginUser(res.data.user, res.data.access_token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldAlert className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FraudGuard</h1>
          <p className="text-gray-500 mt-2">UPI Fraud Detection System</p>
        </div>

        <div className="glass-card p-8">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Full Name" required className="input-field pl-11" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input type="email" placeholder="Email" required className="input-field pl-11" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" required className="input-field pl-11 pr-11" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input-field">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold hover:underline">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Educational prototype only. Not connected to real UPI servers.
        </p>
      </div>
    </div>
  );
}
