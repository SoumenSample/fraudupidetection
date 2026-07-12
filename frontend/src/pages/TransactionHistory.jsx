import { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [page, statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionAPI.getAll({ page, limit: 10, status: statusFilter || undefined, search: search || undefined });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Sender', 'Receiver', 'Amount', 'Status', 'Fraud Score', 'Risk Level', 'Date'];
    const rows = transactions.map(tx => [
      tx.id, tx.sender_name, tx.receiver_name, tx.amount,
      tx.status, tx.fraud_score, tx.risk_level, tx.created_at
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-gray-500">{total} total transactions</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, UPI ID..." className="input-field pl-10 text-sm" />
            </div>
            <button type="submit" className="btn-primary text-sm px-4">Search</button>
          </form>
          <div className="flex gap-2">
            {['', 'approved', 'blocked'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="table-header">Transaction ID</th>
                <th className="table-header">Sender</th>
                <th className="table-header">Receiver</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Fraud Score</th>
                <th className="table-header">Risk Level</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan="8" className="table-cell text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="8" className="table-cell text-center py-8 text-gray-500">No transactions found</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="table-cell font-mono text-xs text-gray-500">{tx.id.slice(0, 12)}...</td>
                  <td className="table-cell font-medium">{tx.sender_name}</td>
                  <td className="table-cell">{tx.receiver_name}</td>
                  <td className="table-cell font-semibold">₹{tx.amount.toLocaleString()}</td>
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
                    }`}>
                      {tx.risk_level}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500 text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
