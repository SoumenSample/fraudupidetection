import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadAlerts();
  }, [page]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getFraudLogs({ page, limit: 10 });
      setAlerts(res.data.logs);
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
          Fraud Alerts
        </h1>
        <p className="text-gray-500">Real-time fraud detection alerts and blocked transactions</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No Fraud Alerts</h3>
          <p className="text-gray-400 mt-1">No suspicious transactions detected yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className={`glass-card p-6 border-l-4 ${alert.risk_level === 'high' ? 'border-l-red-500' : alert.risk_level === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'} animate-slide-in`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${alert.risk_level === 'high' ? 'text-red-500' : alert.risk_level === 'medium' ? 'text-yellow-500' : 'text-green-500'}`} />
                    <h3 className="font-semibold">Alert #{alert.id.slice(-6).toUpperCase()}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      alert.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                      alert.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {alert.risk_level?.toUpperCase()} RISK
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      BLOCKED
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {alert.reasons?.map((reason, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    <span>Score: <strong className="text-red-600">{alert.fraud_score}%</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
