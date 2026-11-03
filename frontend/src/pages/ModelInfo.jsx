import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  BarChart2,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

const ModelInfo = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await api.get('/model-info');
        if (res.data.success) {
          setModelInfo(res.data.model_info);
        }
      } catch (err) {
        console.error('Failed to load model info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  if (loading || !modelInfo) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: '#64748B' }}>Loading Machine Learning architecture details...</p>
      </div>
    );
  }

  const lr = modelInfo.algorithms?.linear_regression || {};
  const rf = modelInfo.algorithms?.random_forest || {};
  const dataset = modelInfo.dataset || {};
  const selected = modelInfo.selected_model || {};

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Machine Learning Model Architecture</h2>
          <p className="page-subtitle">
            Comprehensive technical breakdown of algorithms, regression metrics, and dataset synthesis for academic evaluation.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
          <Sparkles size={16} color="#2563EB" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E40AF' }}>
            Production Model: {selected.name}
          </span>
        </div>
      </div>

      {/* Grid: Dataset specs & Preprocessing */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Dataset Details */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Dataset Characteristics</h3>
              <p className="card-subtitle">Documented synthetic academic dataset (Seed: 42)</p>
            </div>
            <Database size={20} color="#2563EB" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ color: '#64748B' }}>Total Records Synthesized:</span>
              <span style={{ fontWeight: 700, color: '#172554' }}>{dataset.total_records} rows</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ color: '#64748B' }}>Train / Test Split:</span>
              <span style={{ fontWeight: 700, color: '#172554' }}>80% Training ({dataset.train_records}) &bull; 20% Testing ({dataset.test_records})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ color: '#64748B' }}>Input Features (X):</span>
              <span style={{ fontWeight: 700, color: '#172554' }}>7 Academic & Behavioural Variables</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ color: '#64748B' }}>Target Variable (y):</span>
              <span style={{ fontWeight: 700, color: '#2563EB' }}>Final Examination Marks (0–100)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ color: '#64748B' }}>Reproducibility:</span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>Random State = 42</span>
            </div>
          </div>
        </div>

        {/* Preprocessing Methodology */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Preprocessing Methodology</h3>
              <p className="card-subtitle">Pipeline steps executed before model fitting</p>
            </div>
            <Layers size={20} color="#0284C7" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ fontSize: '13px', color: '#172554' }}>Missing Value Imputation:</b>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Dataset is strictly verified for null/NaN entries. All features verified complete.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ fontSize: '13px', color: '#172554' }}>Duplicate Detection:</b>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Zero duplicate rows confirmed to preserve variance and independence.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ fontSize: '13px', color: '#172554' }}>Target Leakage Guard:</b>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Final Examination Marks is strictly isolated as target variable 'y' and never included in feature matrix 'X'.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ fontSize: '13px', color: '#172554' }}>Feature Alignment:</b>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Strict feature ordering enforced between model training and real-time inference.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Algorithm Performance Comparison</h3>
            <p className="card-subtitle">
              Evaluated on the 20% independent test split ({dataset.test_records} unseen student records)
            </p>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Algorithm Tested</th>
                <th>Mean Absolute Error (MAE)</th>
                <th>Root Mean Squared Error (RMSE)</th>
                <th>R² Score (Coefficient of Determination)</th>
                <th>Model Decision</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: selected.name === 'Linear Regression' ? '#EFF6FF' : 'transparent' }}>
                <td>
                  <div style={{ fontWeight: 700, color: '#172554' }}>{lr.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Parametric baseline regression</div>
                </td>
                <td style={{ fontWeight: 600 }}>{lr.mae} marks</td>
                <td style={{ fontWeight: 600 }}>{lr.rmse} marks</td>
                <td style={{ fontWeight: 700, color: '#2563EB', fontSize: '15px' }}>{lr.r2_score}</td>
                <td>
                  {selected.name === 'Linear Regression' ? (
                    <span className="badge badge-emerald">Selected (Higher R²)</span>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Benchmark</span>
                  )}
                </td>
              </tr>
              <tr style={{ backgroundColor: selected.name === 'Random Forest Regressor' ? '#EFF6FF' : 'transparent' }}>
                <td>
                  <div style={{ fontWeight: 700, color: '#172554' }}>{rf.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Ensemble: 120 decision trees, max_depth: 8</div>
                </td>
                <td style={{ fontWeight: 600 }}>{rf.mae} marks</td>
                <td style={{ fontWeight: 600 }}>{rf.rmse} marks</td>
                <td style={{ fontWeight: 700, color: '#2563EB', fontSize: '15px' }}>{rf.r2_score}</td>
                <td>
                  {selected.name === 'Random Forest Regressor' ? (
                    <span className="badge badge-emerald">Selected (Higher R²)</span>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Benchmark</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Note on Regression vs Classification */}
        <div
          style={{
            marginTop: '16px',
            padding: '14px',
            backgroundColor: '#EFF6FF',
            borderRadius: '8px',
            border: '1px solid #BFDBFE',
            fontSize: '13px',
            color: '#1E40AF',
            lineHeight: 1.5,
          }}
        >
          <b>Important Evaluation Note:</b> In this project, examination marks are numeric and continuous (0–100). Therefore, the evaluation uses genuine regression metrics (MAE, RMSE, and R² score). Regression models estimate continuous numeric values, whereas classification predicts discrete classes; reporting regression metrics as "percentage accuracy" is scientifically inaccurate.
        </div>
      </div>

      {/* BCA Project Viva Guide */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">BCA Final-Year Viva Voce Q&A Cheat-Sheet</h3>
            <p className="card-subtitle">Essential questions college external examiners ask about this project</p>
          </div>
          <HelpCircle size={20} color="#2563EB" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#172554', marginBottom: '6px' }}>
              Q1. Why did you use Regression instead of Classification?
            </h4>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              <b>Answer:</b> Examination marks are continuous numerical quantities ranging from 0 to 100. Classification algorithms output discrete labels (e.g., Pass/Fail or Grade A/B/C), which lose exact numerical precision. Regression estimates the continuous mark (e.g., 78.4%), which we then map into educational categories (Excellent, Good, Average, Needs Improvement) for actionable reporting.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#172554', marginBottom: '6px' }}>
              Q2. What is R² (R-squared) and what does a score of ~0.84 mean?
            </h4>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              <b>Answer:</b> R² is the Coefficient of Determination. It measures the proportion of variance in final examination marks explained by our 7 academic features (attendance, study hours, internal marks, etc.). An R² of 0.84 means 84% of the variability in marks is accounted for by the trained model, with remaining variance representing unmeasured factors like exam health or individual paper difficulty.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#172554', marginBottom: '6px' }}>
              Q3. What is the difference between MAE and RMSE?
            </h4>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              <b>Answer:</b> MAE (Mean Absolute Error) is the average absolute difference between predicted marks and actual marks. RMSE (Root Mean Squared Error) squares the errors before taking the root, which penalizes larger outlier errors much more heavily. If RMSE is significantly larger than MAE, it indicates occasional large prediction errors.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#172554', marginBottom: '6px' }}>
              Q4. How did you prevent Target Data Leakage?
            </h4>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              <b>Answer:</b> Target leakage occurs when information about the target variable is accidentally included in the training inputs. In Gradelytics, the final examination marks variable exists exclusively as the ground-truth target vector 'y' during training. Only preceding factors (attendance, continuous assignments, study hours, internal exams) are in feature matrix 'X'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelInfo;
