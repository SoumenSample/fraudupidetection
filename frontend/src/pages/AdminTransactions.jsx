import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [page, statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllTransactions({ page, limit: 10, status: statusFilter || undefined });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Sender', 'Receiver', 'Amount', 'Location', 'Device', 'Status', 'Fraud Score', 'Risk Level', 'Reasons', 'Date'];
    const rows = transactions.map(tx => [
      tx.id, tx.sender_name, tx.receiver_name, tx.amount, tx.location, tx.device,
      tx.status, tx.fraud_score, tx.risk_level, tx.reasons?.join('; '), tx.created_at
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin_transactions.csv';
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Transactions</h1>
          <p className="text-gray-500">{total} total transactions across all users</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'approved', 'blocked'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Sender</th>
                <th className="table-header">Receiver</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Location</th>
                <th className="table-header">Device</th>
                <th className="table-header">Status</th>
                <th className="table-header">Score</th>
                <th className="table-header">Risk</th>
                <th className="table-header">Reasons</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan="11" className="table-cell text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="11" className="table-cell text-center py-8 text-gray-500">No transactions found</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="table-cell font-mono text-xs text-gray-500">{tx.id.slice(0, 8)}...</td>
                  <td className="table-cell font-medium">{tx.sender_name}</td>
                  <td className="table-cell">{tx.receiver_name}</td>
                  <td className="table-cell font-semibold">₹{tx.amount.toLocaleString()}</td>
                  <td className="table-cell">{tx.location}</td>
                  <td className="table-cell text-sm">{tx.device}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`font-bold ${tx.fraud_score >= 70 ? 'text-red-600' : tx.fraud_score >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {tx.fraud_score}%
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      tx.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                      tx.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{tx.risk_level}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {tx.reasons?.slice(0, 2).map((r, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{r}</span>
                      ))}
                      {tx.reasons?.length > 2 && <span className="text-xs text-gray-400">+{tx.reasons.length - 2}</span>}
                    </div>
                  </td>
                  <td className="table-cell text-gray-500 text-xs whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
