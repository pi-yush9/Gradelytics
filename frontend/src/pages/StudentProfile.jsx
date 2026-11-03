import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Mail,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  BrainCircuit,
  FileDown,
  CheckCircle,
  AlertTriangle,
  History
} from 'lucide-react';
import api from '../services/api';
import CategoryBadge from '../components/CategoryBadge';

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/students/${id}`);
        if (res.data.success) {
          setStudent(res.data.student);
          setPredictions(res.data.predictions || []);
        }
      } catch (err) {
        setError('Failed to load student profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [id]);

  const handleDownloadPdf = (predId) => {
    window.open(`/api/predictions/${predId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: '#64748B' }}>Loading student academic profile...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: '20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B' }}>
          {error || 'Student not found.'}
        </div>
        <Link to="/students" className="btn btn-outline btn-sm" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back to Students
        </Link>
      </div>
    );
  }

  const isLowAttendance = student.attendance < 75;

  return (
    <div className="page-wrapper">
      {/* Back button */}
      <div style={{ marginBottom: '16px' }}>
        <Link to="/students" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
          <ArrowLeft size={16} />
          <span>Back to Students Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="card" style={{ marginBottom: '28px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              {student.full_name[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#172554' }}>
                  {student.full_name}
                </h2>
                <span
                  style={{
                    backgroundColor: '#F1F5F9',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                  }}
                >
                  {student.student_id}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: '#64748B', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} /> {student.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <BookOpen size={14} /> {student.course} &bull; Semester {student.semester}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Link to={`/predict?student_id=${student.id}`} className="btn btn-primary">
              <BrainCircuit size={16} />
              <span>Predict Final Examination Marks</span>
            </Link>
          </div>
        </div>

        {/* Academic Baseline Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>ATTENDANCE RATE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: isLowAttendance ? '#EF4444' : '#10B981', marginTop: '2px' }}>
              {student.attendance}%
            </div>
            <div style={{ fontSize: '11px', color: isLowAttendance ? '#DC2626' : '#64748B', marginTop: '2px' }}>
              {isLowAttendance ? 'Below 75% Requirement' : 'Meets Academic Threshold'}
            </div>
          </div>

          <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>PREVIOUS EXAM MARKS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#172554', marginTop: '2px' }}>
              {student.previous_marks}%
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Baseline Performance
            </div>
          </div>

          <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>TOTAL EVALUATIONS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
              {predictions.length}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              ML Prediction Runs
            </div>
          </div>
        </div>
      </div>

      {/* Prediction History Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Prediction Trajectory History</h3>
            <p className="card-subtitle">All Machine Learning evaluations recorded for this student</p>
          </div>
        </div>

        {predictions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
            <History size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, color: '#475569' }}>No prediction runs yet</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Click "Predict Final Examination Marks" to generate an ML assessment.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Prediction Date</th>
                  <th>Attendance</th>
                  <th>Study Hrs</th>
                  <th>Internal Marks</th>
                  <th>Predicted Marks</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>{p.attendance}%</td>
                    <td>{p.study_hours} hrs/day</td>
                    <td>{p.internal_marks}</td>
                    <td style={{ fontWeight: 700, color: '#2563EB', fontSize: '15px' }}>
                      {p.predicted_marks.toFixed(1)}%
                    </td>
                    <td>
                      <CategoryBadge category={p.performance_category} size="sm" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDownloadPdf(p.id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#2563EB', borderColor: '#BFDBFE' }}
                      >
                        <FileDown size={13} />
                        <span>PDF Report</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
