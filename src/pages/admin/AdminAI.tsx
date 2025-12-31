import { useEffect, useState } from 'react';
import { adminApi } from '../../services/admin-api.service';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * MODULE F - AI & AUTOMATION CONTROL
 * 
 * Problems to Solve:
 * - Wrong service recommendation
 * - Incorrect pricing
 * - Bad provider assignment
 * - Rule misfires
 * 
 * Features:
 * - View AI decision logs
 * - See which rule triggered decision
 * - Disable / adjust rule
 * - Manual override decision
 * - Mark AI issue as resolved
 */

interface AILog {
  id: string;
  decisionType: 'matching' | 'pricing' | 'trust_score' | 'intent' | 'escalation';
  input: any;
  output: any;
  confidence: number;
  ruleName?: string;
  userId?: string;
  orderId?: string;
  timestamp: string;
  hasError: boolean;
  errorMessage?: string;
  manualOverride?: boolean;
}

export default function AdminAI() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    decisionType: 'all',
    hasError: 'errors_only',
    date: 'today'
  });
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });
  const [aiStats, setAiStats] = useState<any>(null);

  useEffect(() => {
    loadAIData();
  }, [filters]);

  const loadAIData = async () => {
    try {
      setLoading(true);
      const [logsData, statsData] = await Promise.all([
        adminApi.getAIDecisionLogs(filters),
        adminApi.getAIStats()
      ]);
      setLogs(logsData.logs || []);
      setAiStats(statsData);
    } catch (err) {
      console.error('Failed to load AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideDecision = (log: AILog) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Override AI Decision',
      message: `Override AI decision from ${log.decisionType}? This will mark it for retraining.`,
      action: async () => {
        const newAction = prompt('Enter corrected action/output:');
        const reason = prompt('Reason for override:');
        if (newAction && reason) {
          try {
            await adminApi.overrideAIDecision(log.id, newAction, reason);
            await loadAIData();
            setSelectedLog(null);
            alert('AI decision overridden');
          } catch (err) {
            alert('Failed to override decision');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleDisableRule = async (ruleName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Disable AI Rule',
      message: `Disable rule "${ruleName}"? This will affect future AI decisions.`,
      action: async () => {
        const reason = prompt('Reason for disabling:');
        if (reason) {
          try {
            await adminApi.disableAIRule(ruleName, reason);
            alert('Rule disabled');
          } catch (err) {
            alert('Failed to disable rule');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleRetrainAI = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Retrain AI Model',
      message: 'This will retrain the AI model with recent overrides. It may take several minutes.',
      action: async () => {
        const language = prompt('Language to retrain (en, de, sv, etc):');
        if (language) {
          try {
            await adminApi.retrainAI(language);
            alert('AI retraining started. You will be notified when complete.');
          } catch (err) {
            alert('Failed to start retraining');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'matching': return '#3b82f6';
      case 'pricing': return '#10b981';
      case 'trust_score': return '#f59e0b';
      case 'intent': return '#8b5cf6';
      case 'escalation': return '#dc2626';
      default: return '#64748b';
    }
  };

  if (loading && logs.length === 0) {
    return <div className="admin-loading">Loading AI logs...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>AI System Control</h1>
          <p className="page-subtitle">Monitor AI decisions, override errors, manage rules</p>
        </div>
        <button onClick={handleRetrainAI} className="action-btn primary">
          Retrain AI Model
        </button>
      </div>

      {/* AI Stats Dashboard */}
      {aiStats && (
        <div className="ai-stats-grid">
          <div className="ai-stat-card">
            <div className="stat-label">Total Decisions (24h)</div>
            <div className="stat-value">{aiStats.decisions24h || 0}</div>
          </div>
          <div className="ai-stat-card">
            <div className="stat-label">Error Rate</div>
            <div className="stat-value" style={{ color: aiStats.errorRate > 5 ? '#dc2626' : '#10b981' }}>
              {aiStats.errorRate || 0}%
            </div>
          </div>
          <div className="ai-stat-card">
            <div className="stat-label">Manual Overrides</div>
            <div className="stat-value">{aiStats.overrides || 0}</div>
          </div>
          <div className="ai-stat-card">
            <div className="stat-label">Average Confidence</div>
            <div className="stat-value">{aiStats.avgConfidence || 0}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <select
          value={filters.decisionType}
          onChange={(e) => setFilters({ ...filters, decisionType: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Decision Types</option>
          <option value="matching">Provider Matching</option>
          <option value="pricing">Dynamic Pricing</option>
          <option value="trust_score">Trust Scoring</option>
          <option value="intent">Intent Detection</option>
          <option value="escalation">Escalation</option>
        </select>
        <select
          value={filters.hasError}
          onChange={(e) => setFilters({ ...filters, hasError: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Decisions</option>
          <option value="errors_only">Errors Only</option>
          <option value="overridden">Overridden</option>
        </select>
        <select
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="admin-select"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* AI Decision Logs */}
      <div className="ai-logs-container">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`ai-log-card ${log.hasError ? 'has-error' : ''}`}
            onClick={() => setSelectedLog(log)}
            style={{ borderLeft: `4px solid ${getDecisionTypeColor(log.decisionType)}` }}
          >
            <div className="ai-log-header">
              <div className="ai-log-type" style={{ color: getDecisionTypeColor(log.decisionType) }}>
                {log.decisionType.toUpperCase().replace('_', ' ')}
              </div>
              <div className="ai-log-confidence">
                Confidence: {log.confidence.toFixed(1)}%
              </div>
              {log.manualOverride && (
                <span className="override-badge">Overridden</span>
              )}
            </div>
            {log.ruleName && (
              <div className="ai-log-rule">Rule: {log.ruleName}</div>
            )}
            <div className="ai-log-time">{new Date(log.timestamp).toLocaleString()}</div>
            {log.hasError && (
              <div className="ai-log-error">
                Error: {log.errorMessage}
              </div>
            )}
            <div className="ai-log-actions" onClick={(e) => e.stopPropagation()}>
              {!log.manualOverride && (
                <button onClick={() => handleOverrideDecision(log)} className="action-btn-sm warning">
                  Override
                </button>
              )}
              {log.ruleName && (
                <button onClick={() => handleDisableRule(log.ruleName!)} className="action-btn-sm danger">
                  Disable Rule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Log Details Panel */}
      {selectedLog && (
        <div className="admin-panel-overlay" onClick={() => setSelectedLog(null)}>
          <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel-header">
              <h2>AI Decision Log</h2>
              <button onClick={() => setSelectedLog(null)} className="close-button">×</button>
            </div>
            <div className="admin-panel-content">
              <div className="detail-section">
                <h3>Decision Details</h3>
                <div className="detail-grid">
                  <div><strong>Type:</strong> {selectedLog.decisionType}</div>
                  <div><strong>Confidence:</strong> {selectedLog.confidence.toFixed(1)}%</div>
                  {selectedLog.ruleName && <div><strong>Rule:</strong> {selectedLog.ruleName}</div>}
                  <div><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</div>
                  {selectedLog.userId && <div><strong>User ID:</strong> {selectedLog.userId.slice(0, 8)}</div>}
                  {selectedLog.orderId && <div><strong>Order ID:</strong> {selectedLog.orderId.slice(0, 8)}</div>}
                  <div><strong>Manual Override:</strong> {selectedLog.manualOverride ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Input Data</h3>
                <pre className="code-block">{JSON.stringify(selectedLog.input, null, 2)}</pre>
              </div>

              <div className="detail-section">
                <h3>AI Output</h3>
                <pre className="code-block">{JSON.stringify(selectedLog.output, null, 2)}</pre>
              </div>

              {selectedLog.hasError && (
                <div className="detail-section error-section">
                  <h3>Error Details</h3>
                  <p className="error-message">{selectedLog.errorMessage}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Admin Actions</h3>
                <div className="action-buttons-vertical">
                  {!selectedLog.manualOverride && (
                    <button onClick={() => handleOverrideDecision(selectedLog)} className="action-btn-full warning">
                      Override This Decision
                    </button>
                  )}
                  {selectedLog.ruleName && (
                    <button onClick={() => handleDisableRule(selectedLog.ruleName!)} className="action-btn-full danger">
                      Disable Rule: {selectedLog.ruleName}
                    </button>
                  )}
                  {selectedLog.orderId && (
                    <button className="action-btn-full">View Related Order</button>
                  )}
                  {selectedLog.userId && (
                    <button className="action-btn-full">View User Profile</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDangerous={confirmDialog.isDangerous}
      />
    </div>
  );
}
