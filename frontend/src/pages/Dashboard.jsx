import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import CategoryBadge from '../components/CategoryBadge';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError('Unable to load dashboard metrics. Check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px 0' }}>
        <RefreshCw size={32} className="spin-animation" style={{ color: '#2563EB', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748B' }}>Aggregating live student records and prediction statistics...</p>
        <style>{`.spin-animation { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  const stats = data?.statistics || {
    total_students: 0,
    total_predictions: 0,
    avg_predicted_marks: 0,
    students_at_risk: 0,
  };

  const distribution = data?.distribution || [];
  const recentPredictions = data?.recent_predictions || [];
  const lowAlerts = data?.low_performance_alerts || [];

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Academic Performance Dashboard</h2>
          <p className="page-subtitle">
            Real-time ML insights, cohort distributions, and student risk assessments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchDashboard} className="btn btn-outline btn-sm">
            <RefreshCw size={14} />
            <span>Refresh Metrics</span>
          </button>
          <Link to="/predict" className="btn btn-primary btn-sm">
            <Sparkles size={14} />
            <span>New Prediction</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* 1. Statistics Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard
          title="Total Students"
          value={stats.total_students}
          subtitle="Enrolled cohort members"
          icon={Users}
          color="#2563EB"
          bgColor="#EFF6FF"
        />
        <StatCard
          title="Total Predictions"
          value={stats.total_predictions}
          subtitle="Evaluations generated"
          icon={BrainCircuit}
          color="#0284C7"
          bgColor="#F0F9FF"
        />
        <StatCard
          title="Avg. Predicted Marks"
          value={`${stats.avg_predicted_marks}%`}
          subtitle="Projected cohort mean"
          icon={TrendingUp}
          color="#10B981"
          bgColor="#ECFDF5"
        />
        <StatCard
          title="Students At Risk"
          value={stats.students_at_risk}
          subtitle="Predicted < 40% (Urgent Action)"
          icon={AlertTriangle}
          color="#EF4444"
          bgColor="#FEF2F2"
        />
      </div>

      {/* 2. Charts Section */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Academic Performance Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Marks Performance Distribution</h3>
              <p className="card-subtitle">Students categorized by ML predicted examination score</p>
            </div>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`${val} Students`, 'Total Count']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#2563EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cohort Category Share */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Cohort Proportional Split</h3>
              <p className="card-subtitle">Proportion of Excellent, Good, Average & Risk</p>
            </div>
          </div>
          <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution.filter(d => d.count > 0)}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color || '#2563EB'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} students`, name]}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Lower Row: Recent Predictions + Low Performance Alerts */}
      <div className="grid-2">
        {/* Recent Predictions */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Predictions</h3>
              <p className="card-subtitle">Latest student evaluations processed</p>
            </div>
            <Link to="/history" style={{ fontSize: '13px', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentPredictions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#94A3B8' }}>
              <BrainCircuit size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>No predictions recorded yet. Run a prediction to see records.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPredictions.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#172554' }}>
                      {p.student_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span>{p.student_code}</span>
                      <span>&bull;</span>
                      <span>{p.course} Sem {p.semester}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#2563EB' }}>
                      {p.predicted_marks.toFixed(1)}%
                    </div>
                    <CategoryBadge category={p.performance_category} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Performance Risk Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Low Performance & Attendance Alerts</h3>
              <p className="card-subtitle">Students flagged for immediate educational intervention</p>
            </div>
          </div>

          {lowAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#10B981' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontWeight: 600 }}>All active students are meeting safety thresholds!</p>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>No students with critical attendance or risk status.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lowAlerts.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#FEF2F2',
                    borderRadius: '8px',
                    border: '1px solid #FECACA',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={20} color="#DC2626" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B' }}>
                        {s.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>
                        Attendance: <b>{s.attendance}%</b> &bull; Prev: <b>{s.previous_marks}%</b>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/predict?student_id=${s.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ backgroundColor: 'white', borderColor: '#FCA5A5', color: '#B91C1C' }}
                  >
                    Evaluate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
