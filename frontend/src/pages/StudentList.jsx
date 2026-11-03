import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  FileSpreadsheet,
  Edit,
  Trash2,
  ExternalLink,
  BrainCircuit,
  Upload,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import CategoryBadge from '../components/CategoryBadge';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    email: '',
    course: 'BCA',
    semester: 5,
    attendance: 75.0,
    previous_marks: 70.0,
  });
  const [formError, setFormError] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.q = searchTerm;
      if (selectedSemester) params.semester = selectedSemester;
      const res = await api.get('/students', { params });
      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedSemester]);

  const handleOpenAdd = () => {
    setFormData({
      student_id: `BCA-2024-${String(Math.floor(Math.random() * 900) + 100)}`,
      full_name: '',
      email: '',
      course: 'BCA',
      semester: 5,
      attendance: 75.0,
      previous_marks: 70.0,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setCurrentStudent(student);
    setFormData({
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      course: student.course,
      semester: student.semester,
      attendance: student.attendance,
      previous_marks: student.previous_marks,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (student) => {
    setCurrentStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (isAddModalOpen) {
        await api.post('/students', formData);
      } else if (isEditModalOpen && currentStudent) {
        await api.put(`/students/${currentStudent.id}`, formData);
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save student details.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentStudent) return;
    try {
      await api.delete(`/students/${currentStudent.id}`);
      setIsDeleteModalOpen(false);
      fetchStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    const data = new FormData();
    data.append('file', csvFile);

    try {
      setImportStatus({ loading: true });
      const res = await api.post('/students/import-csv', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportStatus({
        success: true,
        message: res.data.message,
        imported: res.data.imported_count,
        failed: res.data.failed_count,
      });
      fetchStudents();
    } catch (err) {
      setImportStatus({
        success: false,
        message: err.response?.data?.message || 'CSV upload failed.',
      });
    }
  };

  // Sample import template loader
  const handleLoadSampleDataset = async () => {
    try {
      setImportStatus({ loading: true });
      const sampleStudents = [
        { student_id: 'BCA-2024-501', full_name: 'Tanya Mehra', email: 'tanya.m@gradelytics.edu', course: 'BCA', semester: 6, attendance: 91.0, previous_marks: 86.0 },
        { student_id: 'BCA-2024-502', full_name: 'Kartik Singhal', email: 'kartik.s@gradelytics.edu', course: 'BCA', semester: 6, attendance: 64.0, previous_marks: 52.0 },
        { student_id: 'BCA-2024-503', full_name: 'Ritu Sen', email: 'ritu.sen@gradelytics.edu', course: 'BCA', semester: 6, attendance: 82.5, previous_marks: 78.0 },
        { student_id: 'BCA-2024-504', full_name: 'Manish Joshi', email: 'manish.j@gradelytics.edu', course: 'BCA', semester: 6, attendance: 41.0, previous_marks: 37.0 },
        { student_id: 'BCA-2024-505', full_name: 'Divya Nair', email: 'divya.n@gradelytics.edu', course: 'BCA', semester: 6, attendance: 95.0, previous_marks: 92.5 }
      ];

      const res = await api.post('/students/import-csv', { rows: sampleStudents });
      setImportStatus({
        success: true,
        message: res.data.message,
        imported: res.data.imported_count,
        failed: res.data.failed_count,
      });
      fetchStudents();
    } catch (err) {
      setImportStatus({ success: false, message: 'Sample load failed.' });
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Student Cohort Management</h2>
          <p className="page-subtitle">
            Manage academic profiles, attendance records, and individual prediction trajectories.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setIsImportModalOpen(true); setImportStatus(null); }} className="btn btn-outline btn-sm">
            <FileSpreadsheet size={14} />
            <span>Import CSV / Sample</span>
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <UserPlus size={14} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '40px' }}
              placeholder="Search by student name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#64748B" />
            <select
              className="form-select"
              style={{ width: '160px', height: '40px' }}
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Course / Sem</th>
              <th>Attendance</th>
              <th>Previous Marks</th>
              <th>Latest Prediction</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                  Loading student cohort records...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                  <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, color: '#475569' }}>No students found</p>
                  <p style={{ fontSize: '13px' }}>Try adjusting your search filter or click "Add Student" above.</p>
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: '#172554' }}>
                    <Link to={`/students/${s.id}`} style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{s.student_id}</span>
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{s.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{s.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{s.course}</span> &bull; Sem {s.semester}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: s.attendance < 75 ? '#DC2626' : '#16A34A' }}>
                      {s.attendance}%
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.previous_marks}%</span>
                  </td>
                  <td>
                    {s.latest_predicted_marks !== null && s.latest_predicted_marks !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#2563EB' }}>
                          {Number(s.latest_predicted_marks).toFixed(1)}%
                        </span>
                        <CategoryBadge category={s.latest_category} size="sm" />
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>Not evaluated yet</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link
                        to={`/predict?student_id=${s.id}`}
                        className="btn btn-outline btn-sm"
                        title="Predict Final Marks"
                        style={{ color: '#2563EB', borderColor: '#BFDBFE' }}
                      >
                        <BrainCircuit size={13} />
                        <span>Predict</span>
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="btn btn-outline btn-sm"
                        title="Edit Details"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(s)}
                        className="btn btn-outline btn-sm"
                        title="Delete Student"
                        style={{ color: '#EF4444' }}
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

      {/* Modal: Add/Edit Student */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isAddModalOpen ? "Register New Student" : "Edit Student Information"}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveStudent}
            >
              {isAddModalOpen ? "Register Student" : "Update Student"}
            </button>
          </>
        }
      >
        {formError && (
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#991B1B', fontSize: '13px', marginBottom: '16px' }}>
            {formError}
          </div>
        )}
        <form onSubmit={handleSaveStudent}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Student ID (Roll No)</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="e.g. BCA-2024-001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Aarav Sharma"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@university.edu"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Course</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select
                className="form-select"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Attendance (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="form-input"
                required
                value={formData.attendance}
                onChange={(e) => setFormData({ ...formData, attendance: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Previous Exam Marks (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="form-input"
                required
                value={formData.previous_marks}
                onChange={(e) => setFormData({ ...formData, previous_marks: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Student Deletion"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
              Delete Record
            </button>
          </>
        }
      >
        <p style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete <b>{currentStudent?.full_name}</b> ({currentStudent?.student_id})?
        </p>
        <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '10px' }}>
          This will also remove all associated examination prediction history from the MySQL database.
        </p>
      </Modal>

      {/* Modal: CSV Import */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Student Records (CSV)"
        footer={
          <button className="btn btn-outline" onClick={() => setIsImportModalOpen(false)}>
            Close
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: '#475569' }}>
            Upload a CSV containing student records or automatically load the built-in sample cohort dataset.
          </p>

          {importStatus && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                backgroundColor: importStatus.success ? '#ECFDF5' : '#FEF2F2',
                border: importStatus.success ? '1px solid #A7F3D0' : '1px solid #FECACA',
                color: importStatus.success ? '#065F46' : '#991B1B',
              }}
            >
              {importStatus.message}
            </div>
          )}

          <div style={{ border: '2px dashed #CBD5E1', borderRadius: '10px', padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
            <Upload size={32} style={{ color: '#2563EB', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#172554' }}>Upload CSV File</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', marginBottom: '12px' }}>
              Required headers: student_id, full_name, email, course, semester, attendance, previous_marks
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              style={{ fontSize: '13px', marginBottom: '12px' }}
            />
            {csvFile && (
              <button onClick={handleImportCsv} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                Process and Import CSV
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', margin: '6px 0', fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
            — OR QUICK TEST —
          </div>

          <button
            type="button"
            onClick={handleLoadSampleDataset}
            className="btn btn-outline"
            style={{ width: '100%', borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
          >
            <Download size={14} />
            <span>Load 5 Pre-Built Sample BCA Students</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default StudentList;
