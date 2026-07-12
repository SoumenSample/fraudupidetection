import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { ShieldAlert, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminFraudLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getFraudLogs({ page, limit: 15 });
      setLogs(res.data.logs);
      setTotalPages(res.data.pages);
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
          <ShieldAlert className="w-7 h-7 text-red-600" />
          Fraud Detection Logs
        </h1>
        <p className="text-gray-500">Complete log of all detected fraudulent transactions</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="table-header">Alert ID</th>
                <th className="table-header">Transaction ID</th>
                <th className="table-header">Fraud Score</th>
                <th className="table-header">Risk Level</th>
                <th className="table-header">Reasons</th>
                <th className="table-header">Status</th>
                <th className="table-header">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan="7" className="table-cell text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" className="table-cell text-center py-8 text-gray-500">No fraud logs found</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="table-cell font-mono text-xs font-bold text-red-600">#{log.id.slice(-6).toUpperCase()}</td>
                  <td className="table-cell font-mono text-xs text-gray-500">{log.transaction_id?.slice(0, 12)}...</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full ${log.fraud_score >= 70 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{width: `${log.fraud_score}%`}}></div>
                      </div>
                      <span className="font-bold text-sm">{log.fraud_score}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      log.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                      log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{log.risk_level?.toUpperCase()}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {log.reasons?.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">BLOCKED</span>
                  </td>
                  <td className="table-cell text-gray-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </td>
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
