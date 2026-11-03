import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Award,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/analytics');
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError('Failed to fetch analytics dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px 0' }}>
        <RefreshCw size={32} className="spin-animation" style={{ color: '#2563EB', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748B' }}>Generating regression visualizations and correlation matrices...</p>
        <style>{`.spin-animation { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const distribution = analytics?.distribution || [];
  const attendanceScatter = analytics?.attendance_vs_predicted || [];
  const studyHoursScatter = analytics?.study_hours_vs_predicted || [];
  const previousScatter = analytics?.previous_vs_predicted || [];
  const featureImportance = analytics?.feature_importance || [];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Analytics & Academic Reports</h2>
          <p className="page-subtitle">
            Exploratory correlations between behavioural inputs and predicted examination marks.
          </p>
        </div>
        <button onClick={fetchAnalytics} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh Charts
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard
          title="Evaluations Analyzed"
          value={summary.total_evaluated || 0}
          subtitle="Total predictions evaluated"
          icon={Activity}
          color="#2563EB"
          bgColor="#EFF6FF"
        />
        <StatCard
          title="Average Predicted Marks"
          value={`${summary.average_predicted_marks || 0}%`}
          subtitle="Mean projected cohort mark"
          icon={TrendingUp}
          color="#0284C7"
          bgColor="#F0F9FF"
        />
        <StatCard
          title="Highest Predicted Mark"
          value={`${summary.highest_predicted_marks || 0}%`}
          subtitle="Peak cohort performance"
          icon={Award}
          color="#10B981"
          bgColor="#ECFDF5"
        />
        <StatCard
          title="Lowest Predicted Mark"
          value={`${summary.lowest_predicted_marks || 0}%`}
          subtitle="Intervention threshold"
          icon={AlertTriangle}
          color="#EF4444"
          bgColor="#FEF2F2"
        />
      </div>

      {/* Row 1: Distribution & Feature Importance */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Performance Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">1. Student Performance Category Split</h3>
              <p className="card-subtitle">Cohort frequency across the four performance tiers</p>
            </div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`${val} Students`, 'Total Count']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distribution.map((entry, idx) => (
                    <Cell key={`dist-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">2. Model Feature Importance</h3>
              <p className="card-subtitle">Relative mathematical contribution in the regression model (%)</p>
            </div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featureImportance}
                margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" unit="%" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="feature" type="category" width={110} tick={{ fill: '#334155', fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Relative Weight']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
                <Bar dataKey="importance" fill="#2563EB" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Correlation Scatters */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {/* Attendance vs Predicted */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">3. Attendance vs Predicted</h3>
              <p className="card-subtitle">Lecture attendance correlation with marks</p>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 15, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" domain={[30, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis type="number" dataKey="predicted_marks" name="Predicted Marks" unit="%" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(val, name) => [`${val}%`, name]}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
                <Scatter name="Students" data={attendanceScatter} fill="#2563EB" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study Hours vs Predicted */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">4. Study Hours vs Predicted</h3>
              <p className="card-subtitle">Daily revision hours impact</p>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 15, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" dataKey="study_hours" name="Daily Hours" unit="h" domain={[0, 12]} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis type="number" dataKey="predicted_marks" name="Predicted Marks" unit="%" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(val, name) => [name === 'Daily Hours' ? `${val} hrs` : `${val}%`, name]}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
                <Scatter name="Students" data={studyHoursScatter} fill="#0284C7" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Previous Marks vs Predicted */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">5. Previous Marks vs Predicted</h3>
              <p className="card-subtitle">Academic baseline vs Final exam</p>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 15, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" dataKey="previous_marks" name="Previous Marks" unit="%" domain={[20, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis type="number" dataKey="predicted_marks" name="Predicted Marks" unit="%" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(val, name) => [`${val}%`, name]}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
                <Scatter name="Students" data={previousScatter} fill="#10B981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Note about real data */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: '#475569',
        }}
      >
        <Info size={18} color="#2563EB" flexShrink={0} />
        <span>
          All scatter plot coordinates and cohort distributions are computed dynamically from actual MySQL prediction records via Flask REST APIs.
        </span>
      </div>
    </div>
  );
};

export default Analytics;
