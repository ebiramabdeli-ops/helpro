import { useEffect, useState } from 'react';
import { adminApi } from '../../services/admin-api.service';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * MODULE E - COMPLAINTS & CONFLICTS
 * 
 * Problems to Solve:
 * - Customer vs provider conflicts
 * - Emotional escalations
 * - Trust damage risk
 * 
 * Features:
 * - Complaint list with priority
 * - Full case timeline view
 * - Admin decision log
 * - Resolution status (open / resolved / escalated)
 * - Optional goodwill compensation flag
 */

interface Complaint {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  customerId: string;
  customerName: string;
  providerId?: string;
  providerName?: string;
  orderId?: string;
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'open',
    priority: 'all'
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  useEffect(() => {
    loadComplaints();
  }, [filters]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllComplaints(filters);
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (complaint: Complaint) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Resolve Complaint',
      message: `Mark complaint "${complaint.subject}" as resolved?`,
      action: async () => {
        const resolution = prompt('Resolution summary:');
        if (resolution) {
          try {
            await adminApi.resolveComplaint(complaint.id, resolution);
            await loadComplaints();
            setSelectedComplaint(null);
            alert('Complaint resolved');
          } catch (err) {
            alert('Failed to resolve complaint');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleEscalate = (complaint: Complaint) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Escalate Complaint',
      message: `Escalate complaint "${complaint.subject}" to senior management?`,
      action: async () => {
        const reason = prompt('Escalation reason:');
        if (reason) {
          try {
            await adminApi.escalateComplaint(complaint.id, reason);
            await loadComplaints();
            setSelectedComplaint(null);
            alert('Complaint escalated');
          } catch (err) {
            alert('Failed to escalate');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleCompensation = async (complaint: Complaint) => {
    const amount = prompt('Goodwill compensation amount (EUR):');
    const reason = prompt('Compensation reason:');
    if (amount && reason) {
      try {
        await adminApi.offerCompensation(complaint.id, parseFloat(amount), reason);
        alert('Compensation offer created');
      } catch (err) {
        alert('Failed to create compensation');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#64748b';
      default: return '#9ca3af';
    }
  };

  if (loading && complaints.length === 0) {
    return <div className="admin-loading">Loading complaints...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Complaint Management</h1>
          <p className="page-subtitle">Resolve conflicts, handle escalations, protect trust</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search complaints..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="admin-search"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="escalated">Escalated</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Complaints List */}
      <div className="complaints-grid">
        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className="complaint-card"
            onClick={() => setSelectedComplaint(complaint)}
            style={{ borderLeft: `4px solid ${getPriorityColor(complaint.priority)}` }}
          >
            <div className="complaint-header">
              <div className="complaint-priority" style={{ color: getPriorityColor(complaint.priority) }}>
                {complaint.priority.toUpperCase()}
              </div>
              <div className={`status-badge status-${complaint.status}`}>
                {complaint.status.replace('_', ' ')}
              </div>
            </div>
            <h3 className="complaint-title">{complaint.subject}</h3>
            <p className="complaint-description">{complaint.description}</p>
            <div className="complaint-meta">
              <div><strong>Customer:</strong> {complaint.customerName}</div>
              {complaint.providerName && <div><strong>Provider:</strong> {complaint.providerName}</div>}
              <div className="complaint-date">{new Date(complaint.createdAt).toLocaleString()}</div>
            </div>
            <div className="complaint-actions" onClick={(e) => e.stopPropagation()}>
              {complaint.status === 'open' && (
                <>
                  <button onClick={() => handleResolve(complaint)} className="action-btn-sm success">
                    Resolve
                  </button>
                  <button onClick={() => handleEscalate(complaint)} className="action-btn-sm warning">
                    Escalate
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Complaint Details Panel */}
      {selectedComplaint && (
        <div className="admin-panel-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel-header">
              <h2>Complaint: {selectedComplaint.subject}</h2>
              <button onClick={() => setSelectedComplaint(null)} className="close-button">×</button>
            </div>
            <div className="admin-panel-content">
              <div className="detail-section" style={{ borderLeft: `4px solid ${getPriorityColor(selectedComplaint.priority)}` }}>
                <div className="priority-indicator" style={{ color: getPriorityColor(selectedComplaint.priority) }}>
                  {selectedComplaint.priority.toUpperCase()} PRIORITY
                </div>
                <div className={`status-badge status-${selectedComplaint.status}`}>
                  {selectedComplaint.status.replace('_', ' ')}
                </div>
              </div>

              <div className="detail-section">
                <h3>Complaint Details</h3>
                <div className="detail-grid">
                  <div><strong>Subject:</strong> {selectedComplaint.subject}</div>
                  <div><strong>Status:</strong> {selectedComplaint.status}</div>
                  <div><strong>Priority:</strong> {selectedComplaint.priority}</div>
                  <div><strong>Filed:</strong> {new Date(selectedComplaint.createdAt).toLocaleString()}</div>
                  {selectedComplaint.resolvedAt && (
                    <div><strong>Resolved:</strong> {new Date(selectedComplaint.resolvedAt).toLocaleString()}</div>
                  )}
                </div>
                <div className="full-description">
                  <strong>Description:</strong>
                  <p>{selectedComplaint.description}</p>
                </div>
              </div>

              <div className="detail-section">
                <h3>Parties Involved</h3>
                <div className="detail-grid">
                  <div><strong>Customer:</strong> {selectedComplaint.customerName} (ID: {selectedComplaint.customerId.slice(0, 8)})</div>
                  {selectedComplaint.providerName && (
                    <div><strong>Provider:</strong> {selectedComplaint.providerName} (ID: {selectedComplaint.providerId?.slice(0, 8)})</div>
                  )}
                  {selectedComplaint.orderId && (
                    <div><strong>Order ID:</strong> #{selectedComplaint.orderId.slice(0, 8)}</div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Admin Actions</h3>
                <div className="action-buttons-vertical">
                  <button className="action-btn-full">View Full Case Timeline</button>
                  <button className="action-btn-full">View Related Order</button>
                  <button onClick={() => handleCompensation(selectedComplaint)} className="action-btn-full">
                    Offer Goodwill Compensation
                  </button>
                  {selectedComplaint.status === 'open' && (
                    <>
                      <button onClick={() => handleResolve(selectedComplaint)} className="action-btn-full success">
                        Resolve Complaint
                      </button>
                      <button onClick={() => handleEscalate(selectedComplaint)} className="action-btn-full warning">
                        Escalate to Management
                      </button>
                    </>
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
