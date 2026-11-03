import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileDown,
  Info,
  Clock,
  BookOpen,
  UserCheck,
  TrendingUp,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import CategoryBadge from '../components/CategoryBadge';

const MarksPrediction = () => {
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id');

  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');

  // 7 Core ML Features
  const [formData, setFormData] = useState({
    attendance: 80.0,
    previous_marks: 75.0,
    assignment_marks: 78.0,
    study_hours: 4.0,
    class_participation: 7.5,
    internal_marks: 76.0,
    completed_assignments: 10,
  });

  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  // Fetch student cohort list for dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/students');
        if (res.data.success) {
          setStudentsList(res.data.students || []);
          if (preselectedStudentId) {
            const found = res.data.students.find((s) => s.id === parseInt(preselectedStudentId));
            if (found) {
              setSelectedStudentId(found.id);
              setStudentName(found.full_name);
              setStudentCode(found.student_id);
              setFormData((prev) => ({
                ...prev,
                attendance: found.attendance,
                previous_marks: found.previous_marks,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load students for dropdown:', err);
      }
    };

    fetchStudents();
  }, [preselectedStudentId]);

  // Handle student dropdown selection
  const handleStudentSelect = (e) => {
    const val = e.target.value;
    setSelectedStudentId(val);
    if (val) {
      const found = studentsList.find((s) => s.id === parseInt(val));
      if (found) {
        setStudentName(found.full_name);
        setStudentCode(found.student_id);
        setFormData((prev) => ({
          ...prev,
          attendance: found.attendance,
          previous_marks: found.previous_marks,
        }));
      }
    } else {
      setStudentName('');
      setStudentCode('');
    }
  };

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  const validateInputs = () => {
    if (formData.attendance < 0 || formData.attendance > 100) return 'Attendance must be between 0% and 100%';
    if (formData.previous_marks < 0 || formData.previous_marks > 100) return 'Previous marks must be between 0 and 100';
    if (formData.assignment_marks < 0 || formData.assignment_marks > 100) return 'Assignment marks must be between 0 and 100';
    if (formData.study_hours < 0 || formData.study_hours > 16) return 'Daily study hours must be between 0 and 16 hours';
    if (formData.class_participation < 0 || formData.class_participation > 10) return 'Participation score must be between 0 and 10';
    if (formData.internal_marks < 0 || formData.internal_marks > 100) return 'Internal assessment marks must be between 0 and 100';
    if (formData.completed_assignments < 0 || formData.completed_assignments > 20) return 'Completed assignments must be between 0 and 20';
    return null;
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setValidationError('');
    const errorMsg = validateInputs();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        student_id: selectedStudentId ? parseInt(selectedStudentId) : null,
        student_name: studentName,
        student_code: studentCode,
      };

      const res = await api.post('/predictions', payload);
      if (res.data.success) {
        setPredictionResult(res.data);
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Failed to generate prediction. Check server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (predictionResult?.prediction?.id) {
      window.open(`/api/predictions/${predictionResult.prediction.id}/pdf`, '_blank');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Marks Prediction System</h2>
          <p className="page-subtitle">
            Evaluate multidimensional student metrics through regression-based Machine Learning.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left Column: Input Form */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Student Academic Parameters</h3>
              <p className="card-subtitle">7 feature inputs required by the trained model</p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              ML Features
            </span>
          </div>

          {validationError && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                color: '#991B1B',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handlePredict}>
            {/* Student Dropdown / Association */}
            <div className="form-group">
              <label className="form-label">Associate With Student (Optional)</label>
              <select
                className="form-select"
                value={selectedStudentId}
                onChange={handleStudentSelect}
              >
                <option value="">— Select an existing student or predict standalone —</option>
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_id} &bull; {s.full_name} ({s.course} Sem {s.semester})
                  </option>
                ))}
              </select>
            </div>

            {/* If standalone student */}
            {!selectedStudentId && (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Student Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aarav Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Student Roll No</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BCA-2024-001"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '16px 0 20px' }} />

            {/* Feature 1 & 2 */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">1. Attendance Percentage (0-100%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="form-input"
                  required
                  value={formData.attendance}
                  onChange={(e) => handleInputChange('attendance', e.target.value)}
                />
                <span className="form-helper">Official lecture attendance record</span>
              </div>
              <div className="form-group">
                <label className="form-label">2. Previous Exam Marks (0-100)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="form-input"
                  required
                  value={formData.previous_marks}
                  onChange={(e) => handleInputChange('previous_marks', e.target.value)}
                />
                <span className="form-helper">Prior semester examination baseline</span>
              </div>
            </div>

            {/* Feature 3 & 4 */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">3. Assignment Marks (0-100)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="form-input"
                  required
                  value={formData.assignment_marks}
                  onChange={(e) => handleInputChange('assignment_marks', e.target.value)}
                />
                <span className="form-helper">Continuous evaluation & lab assignments</span>
              </div>
              <div className="form-group">
                <label className="form-label">4. Daily Study Hours (0-16 hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  className="form-input"
                  required
                  value={formData.study_hours}
                  onChange={(e) => handleInputChange('study_hours', e.target.value)}
                />
                <span className="form-helper">Self-directed revision hours outside class</span>
              </div>
            </div>

            {/* Feature 5 & 6 */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">5. Class Participation (1-10)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  className="form-input"
                  required
                  value={formData.class_participation}
                  onChange={(e) => handleInputChange('class_participation', e.target.value)}
                />
                <span className="form-helper">Active engagement in classroom discussions</span>
              </div>
              <div className="form-group">
                <label className="form-label">6. Internal Assessment Marks (0-100)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="form-input"
                  required
                  value={formData.internal_marks}
                  onChange={(e) => handleInputChange('internal_marks', e.target.value)}
                />
                <span className="form-helper">Mid-term unit exams score</span>
              </div>
            </div>

            {/* Feature 7 */}
            <div className="form-group">
              <label className="form-label">7. Completed Assignments Count (0-20)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="20"
                className="form-input"
                required
                value={formData.completed_assignments}
                onChange={(e) => handleInputChange('completed_assignments', e.target.value)}
              />
              <span className="form-helper">Number of verified completed submissions</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '46px', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Computing Regression Prediction...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Predict Expected Examination Marks</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Prediction Output */}
        <div>
          {!predictionResult ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 32px',
                backgroundColor: '#FFFFFF',
                border: '1px dashed #CBD5E1',
              }}
            >
              <BrainCircuit size={48} style={{ color: '#2563EB', opacity: 0.6, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#172554' }}>
                Prediction Engine Standby
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '380px', margin: '8px auto 0', lineHeight: 1.6 }}>
                Adjust the 7 academic parameters on the left and click <b>Predict Expected Examination Marks</b> to view predicted marks, risk tier, and improvement suggestions.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Output Score Card */}
              <div className="card" style={{ border: '2px solid #2563EB', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Prediction Outcome
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#172554', marginTop: '2px' }}>
                      {predictionResult.prediction.student_name} ({predictionResult.prediction.student_code})
                    </h3>
                  </div>
                  <CategoryBadge category={predictionResult.analysis.performance_category} />
                </div>

                {/* Score Big Display */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                    padding: '20px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>PREDICTED EXAMINATION MARKS</div>
                    <div style={{ fontSize: '42px', fontWeight: 900, color: '#2563EB', lineHeight: 1.1, marginTop: '4px' }}>
                      {predictionResult.analysis.predicted_marks.toFixed(1)}
                      <span style={{ fontSize: '20px', color: '#64748B', fontWeight: 500 }}> / 100</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                      Risk Status: <b>{predictionResult.analysis.risk_status}</b>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div style={{ width: '88px', height: '88px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="88" height="88" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3.5"
                        strokeDasharray={`${predictionResult.analysis.predicted_marks}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ position: 'absolute', fontSize: '15px', fontWeight: 800, color: '#172554' }}>
                      {Math.round(predictionResult.analysis.predicted_marks)}%
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    <FileDown size={14} />
                    <span>Download Official PDF Report</span>
                  </button>
                  <Link to="/history" className="btn btn-outline btn-sm">
                    View History
                  </Link>
                </div>
              </div>

              {/* Personalized Improvement Recommendations */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '14px' }}>
                  <div>
                    <h3 className="card-title">Personalized Improvement Recommendations</h3>
                    <p className="card-subtitle">Data-driven actions based on submitted inputs</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {predictionResult.analysis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${
                          rec.severity === 'high' ? '#EF4444' : rec.severity === 'medium' ? '#F59E0B' : '#10B981'
                        }`,
                        backgroundColor: '#F8FAFC',
                        borderTop: '1px solid #E2E8F0',
                        borderRight: '1px solid #E2E8F0',
                        borderBottom: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#172554' }}>
                        {rec.category}
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px', lineHeight: 1.5 }}>
                        {rec.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Associations / Feature Contributions */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div>
                    <h3 className="card-title">Model Feature Importances</h3>
                    <p className="card-subtitle">Global feature predictive associations ({predictionResult.analysis.model_used})</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(predictionResult.analysis.feature_importance).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span style={{ color: '#334155', fontWeight: 500, textTransform: 'capitalize' }}>
                          {key.replace('_', ' ')}
                        </span>
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>{val}%</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${val}%`, backgroundColor: '#2563EB', height: '100%', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strict Academic Disclaimer */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#92400E',
                  display: 'flex',
                  gap: '10px',
                  lineHeight: 1.5,
                }}
              >
                <Info size={16} flexShrink={0} color="#D97706" />
                <span>
                  <b>Disclaimer:</b> {predictionResult.analysis.disclaimer}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksPrediction;
