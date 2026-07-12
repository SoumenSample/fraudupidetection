import { useState } from 'react';
import { transactionAPI } from '../services/api';
import { ShieldCheck, ShieldAlert, Loader2, MapPin, Smartphone, CreditCard, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const DEVICES = ['iPhone 15', 'Samsung Galaxy S24', 'OnePlus 12', 'Pixel 8', 'Unknown Device'];
const LOCATIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Unknown Location'];
const PAYMENT_METHODS = ['UPI', 'Bank Transfer', 'Wallet', 'Credit Card'];

export default function TransactionSimulator() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    sender_name: '', receiver_name: '', upi_id: '', amount: '',
    device: DEVICES[0], location: LOCATIONS[0], ip_address: '192.168.1.1',
    payment_method: PAYMENT_METHODS[0], transaction_time: '', purpose: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnalyzing(true);
    setResult(null);

    // Simulate analysis delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      const res = await transactionAPI.create({
        ...form,
        amount: parseFloat(form.amount),
        transaction_time: form.transaction_time || new Date().toISOString()
      });
      setResult(res.data);
      if (res.data.status === 'blocked') {
        toast.error('Fraud Detected - Transaction Blocked!');
      } else {
        toast.success('Transaction Approved!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Transaction failed');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Transaction Simulator</h1>
        <p className="text-gray-500">Simulate a UPI transaction and see real-time fraud detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Transaction Details
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sender Name</label>
                <input name="sender_name" required value={form.sender_name} onChange={handleChange} className="input-field" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receiver Name</label>
                <input name="receiver_name" required value={form.receiver_name} onChange={handleChange} className="input-field" placeholder="Jane Smith" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <input name="upi_id" required value={form.upi_id} onChange={handleChange} className="input-field" placeholder="user@upi" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount (₹)</label>
              <input name="amount" type="number" step="0.01" required value={form.amount} onChange={handleChange} className="input-field text-2xl font-bold" placeholder="0.00" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device</label>
                <select name="device" value={form.device} onChange={handleChange} className="input-field">
                  {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select name="location" value={form.location} onChange={handleChange} className="input-field">
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">IP Address</label>
                <input name="ip_address" value={form.ip_address} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select name="payment_method" value={form.payment_method} onChange={handleChange} className="input-field">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Purpose (Optional)</label>
              <input name="purpose" value={form.purpose} onChange={handleChange} className="input-field" placeholder="Payment for services" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Transaction...
                </>
              ) : (
                'Submit Transaction'
              )}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="space-y-6">
          {/* Analyzing Animation */}
          {analyzing && (
            <div className="glass-card p-8 text-center animate-fade-in">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <ShieldCheck className="absolute inset-0 m-auto w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Analyzing Transaction...</h3>
              <p className="text-gray-500">Running rule engine and ML model</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full analyzing-bar"></div>
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && !analyzing && (
            <div className={`glass-card p-8 animate-slide-in ${result.status === 'blocked' ? 'border-red-300 bg-red-50/50 dark:bg-red-900/20' : 'border-green-300 bg-green-50/50 dark:bg-green-900/20'}`}>
              <div className="text-center mb-6">
                {result.status === 'blocked' ? (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-9 h-9 text-red-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-9 h-9 text-green-600" />
                  </div>
                )}
                <h3 className={`text-2xl font-bold ${result.status === 'blocked' ? 'text-red-600' : 'text-green-600'}`}>
                  {result.status === 'blocked' ? 'Fraud Detected' : 'Transaction Approved'}
                </h3>
                <p className="text-gray-500 mt-1">
                  {result.status === 'blocked' ? 'Transaction Blocked' : 'Payment Successful'}
                </p>
              </div>

              {/* Fraud Score Meter */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Fraud Score</span>
                  <span className={`text-sm font-bold ${result.fraud_score >= 70 ? 'text-red-600' : result.fraud_score >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {result.fraud_score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${result.fraud_score >= 70 ? 'bg-red-500' : result.fraud_score >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${result.fraud_score}%` }}
                  />
                </div>
              </div>

              {/* Risk Level */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-500">Risk Level:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  result.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                  result.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {result.risk_level?.toUpperCase()}
                </span>
              </div>

              {/* Reasons */}
              {result.reasons?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Detection Reasons:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.reasons.map((reason, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Tips */}
          {!result && !analyzing && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3">Tips for Testing</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Try amount &gt; ₹50,000 for high-risk
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Select "Unknown Device" for device risk
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Choose "Unknown Location" for location risk
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Small amounts with known devices pass easily
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
