import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  FileDown,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import CategoryBadge from '../components/CategoryBadge';

const PredictionHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recordDetails, setRecordDetails] = useState(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.q = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/predictions', { params });
      if (res.data.success) {
        let list = res.data.predictions || [];
        if (sortOrder === 'asc') {
          list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else {
          list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        setPredictions(list);
      }
    } catch (err) {
      console.error('Failed to load predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchPredictions();
    }, 250);
    return () => clearTimeout(delay);
  }, [searchTerm, categoryFilter, sortOrder]);

  const handleOpenDetails = async (pred) => {
    setSelectedRecord(pred);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/predictions/${pred.id}`);
      if (res.data.success) {
        setRecordDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to load details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadPdf = (predId) => {
    window.open(`/api/predictions/${predId}/pdf`, '_blank');
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      await api.delete(`/predictions/${recordToDelete.id}`);
      setDeleteModalOpen(false);
      setRecordToDelete(null);
      fetchPredictions();
    } catch (err) {
      console.error('Delete prediction failed:', err);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Prediction History Archive</h2>
          <p className="page-subtitle">
            Audit log of all machine learning examination mark estimates stored in MySQL.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '40px' }}
              placeholder="Search by student name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: '170px', height: '40px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Excellent">Excellent (80-100)</option>
              <option value="Good">Good (60-79)</option>
              <option value="Average">Average (40-59)</option>
              <option value="Needs Improvement">Needs Improvement (&lt;40)</option>
            </select>

            <select
              className="form-select"
              style={{ width: '150px', height: '40px' }}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Prediction Date</th>
              <th>Student Roll No</th>
              <th>Student Name</th>
              <th>Course / Sem</th>
              <th>Predicted Marks</th>
              <th>Performance Band</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                  Loading prediction archive...
                </td>
              </tr>
            ) : predictions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                  <History size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, color: '#475569' }}>No prediction records found</p>
                  <p style={{ fontSize: '13px' }}>Try clearing filters or run a prediction from the Predict Marks page.</p>
                </td>
              </tr>
            ) : (
              predictions.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                      <Calendar size={13} color="#64748B" />
                      <span>{new Date(p.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#172554' }}>
                    {p.student_code}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.student_name}</div>
                  </td>
                  <td>
                    {p.course} &bull; Sem {p.semester}
                  </td>
                  <td>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB' }}>
                      {Number(p.predicted_marks).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <CategoryBadge category={p.performance_category} size="sm" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenDetails(p)}
                        className="btn btn-outline btn-sm"
                        title="View Full Evaluation"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(p.id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#2563EB', borderColor: '#BFDBFE' }}
                        title="Download PDF Report"
                      >
                        <FileDown size={13} />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => { setRecordToDelete(p); setDeleteModalOpen(true); }}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#EF4444' }}
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Prediction Evaluation Details"
        maxWidth="680px"
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => handleDownloadPdf(selectedRecord?.id)}
            >
              <FileDown size={14} /> Download PDF
            </button>
            <button className="btn btn-primary" onClick={() => setDetailModalOpen(false)}>
              Close
            </button>
          </>
        }
      >
        {detailLoading || !recordDetails ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>Loading record analysis...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header Result */}
            <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>PREDICTED EXAMINATION MARKS</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#1D4ED8' }}>
                  {recordDetails.prediction.predicted_marks.toFixed(1)} / 100
                </div>
              </div>
              <CategoryBadge category={recordDetails.prediction.performance_category} />
            </div>

            {/* Input Attributes */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#172554', marginBottom: '8px' }}>
                Evaluated Input Parameters
              </div>
              <div className="grid-2" style={{ gap: '10px', fontSize: '13px' }}>
                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                  Attendance: <b>{recordDetails.prediction.attendance}%</b>
                </div>
                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                  Previous Marks: <b>{recordDetails.prediction.previous_marks}%</b>
                </div>
                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                  Assignment Marks: <b>{recordDetails.prediction.assignment_marks}%</b>
                </div>
                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                  Daily Study Hours: <b>{recordDetails.prediction.study_hours} hrs</b>
                </div>
                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                  Class Participation: <b>{recordDetails.prediction.class_participation}/10</b>
                </div>
                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                  Internal Assessment: <b>{recordDetails.prediction.internal_marks}/100</b>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#172554', marginBottom: '8px' }}>
                Personalized Improvement Suggestions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recordDetails.analysis?.recommendations?.map((r, i) => (
                  <div key={i} style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', borderLeft: '3px solid #2563EB', fontSize: '13px', color: '#334155' }}>
                    <b>{r.category}:</b> {r.recommendation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Prediction Deletion"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
              Delete Record
            </button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: '#334155' }}>
          Are you sure you want to delete the prediction record for <b>{recordToDelete?.student_name}</b> ({recordToDelete?.student_code})?
        </p>
      </Modal>
    </div>
  );
};

export default PredictionHistory;
