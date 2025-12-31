import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../../services/admin-api.service';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * MODULE B - HELPERS / PROVIDERS
 * 
 * Problems to Solve:
 * - No-shows
 * - Bad behavior
 * - Missing or invalid verification
 * - Repeated low ratings
 * 
 * Features:
 * - View provider profile & documents
 * - Approve / reject / suspend provider
 * - View rating history
 * - Temporary or permanent ban
 * - Internal warning flags
 */

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  verified: boolean;
  services: string[];
  rating: number;
  totalJobs: number;
  completionRate: number;
  noShows: number;
  complaints: number;
  earnings: number;
  joinedAt: string;
  lastActive: string;
  warningFlags: string[];
}

export default function AdminProviders() {
  const location = useLocation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    verified: 'all',
    sortBy: 'rating'
  });
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  useEffect(() => {
    loadProviders();
    if (location.state?.providerId) {
      loadProviderDetails(location.state.providerId);
    }
  }, [filters]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllProviders(filters);
      setProviders(data.providers || []);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderDetails = async (providerId: string) => {
    try {
      const provider = await adminApi.getProviderDetails(providerId);
      setSelectedProvider(provider);
    } catch (err) {
      console.error('Failed to load provider details:', err);
    }
  };

  const handleApprove = (provider: Provider) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Provider',
      message: `Approve ${provider.firstName} ${provider.lastName} to start accepting jobs?`,
      action: async () => {
        try {
          await adminApi.approveProvider(provider.id);
          await loadProviders();
          setSelectedProvider(null);
        } catch (err) {
          alert('Failed to approve provider');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleReject = (provider: Provider) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Provider',
      message: `Reject ${provider.firstName} ${provider.lastName}'s application?`,
      action: async () => {
        const reason = prompt('Reason for rejection:');
        if (reason) {
          try {
            await adminApi.rejectProvider(provider.id, reason);
            await loadProviders();
            setSelectedProvider(null);
          } catch (err) {
            alert('Failed to reject provider');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleSuspend = (provider: Provider) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Suspend Provider',
      message: `Suspend ${provider.firstName} ${provider.lastName}? They will not be able to accept new jobs.`,
      action: async () => {
        const reason = prompt('Reason for suspension:');
        const duration = prompt('Duration in days (leave empty for indefinite):');
        if (reason) {
          try {
            await adminApi.suspendProvider(provider.id, reason, duration ? parseInt(duration) : undefined);
            await loadProviders();
            setSelectedProvider(null);
          } catch (err) {
            alert('Failed to suspend provider');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleBan = (provider: Provider) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Ban Provider Permanently',
      message: `Permanently ban ${provider.firstName} ${provider.lastName}? This action cannot be easily reversed.`,
      action: async () => {
        const reason = prompt('Reason for permanent ban:');
        if (reason) {
          try {
            await adminApi.banProvider(provider.id, reason);
            await loadProviders();
            setSelectedProvider(null);
          } catch (err) {
            alert('Failed to ban provider');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleAddWarning = async (provider: Provider) => {
    const warning = prompt(`Add warning flag for ${provider.firstName} ${provider.lastName}:`);
    if (warning) {
      try {
        await adminApi.addProviderWarning(provider.id, warning);
        await loadProviders();
        if (selectedProvider?.id === provider.id) {
          await loadProviderDetails(provider.id);
        }
      } catch (err) {
        alert('Failed to add warning');
      }
    }
  };

  if (loading && providers.length === 0) {
    return <div className="admin-loading">Loading providers...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Provider Management</h1>
          <p className="page-subtitle">Manage service providers, handle verification, resolve issues</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search by name, email, or ID..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="admin-search"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Providers</option>
          <option value="pending">Pending Approval</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select
          value={filters.verified}
          onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
          className="admin-select"
        >
          <option value="all">All</option>
          <option value="verified">Verified</option>
          <option value="unverified">Not Verified</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="admin-select"
        >
          <option value="rating">Rating</option>
          <option value="jobs">Most Jobs</option>
          <option value="complaints">Most Complaints</option>
          <option value="recent">Recently Joined</option>
        </select>
      </div>

      {/* Providers Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Services</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Jobs</th>
              <th>No-Shows</th>
              <th>Warnings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id} onClick={() => setSelectedProvider(provider)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="user-cell">
                    <strong>{provider.firstName} {provider.lastName}</strong>
                    {provider.verified && <span className="verified-badge">✓ Verified</span>}
                    <span className="user-id">ID: {provider.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td>
                  <div className="services-cell">
                    {provider.services.slice(0, 2).map(s => (
                      <span key={s} className="service-tag">{s}</span>
                    ))}
                    {provider.services.length > 2 && <span className="service-tag">+{provider.services.length - 2}</span>}
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-${provider.status}`}>
                    {provider.status}
                  </span>
                </td>
                <td>
                  <div className="rating-cell">
                    <span className={`rating ${provider.rating < 3 ? 'low' : provider.rating > 4.5 ? 'high' : ''}`}>
                      ★ {provider.rating.toFixed(1)}
                    </span>
                    <span className="rating-count">({provider.totalJobs})</span>
                  </div>
                </td>
                <td>
                  <div>
                    {provider.totalJobs} jobs
                    <div className="text-secondary">{provider.completionRate}% completed</div>
                  </div>
                </td>
                <td>
                  {provider.noShows > 0 ? (
                    <span className="warning-badge">{provider.noShows}</span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
                <td>
                  {provider.warningFlags.length > 0 ? (
                    <span className="warning-badge">{provider.warningFlags.length}</span>
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    {provider.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(provider)} className="action-btn success">
                          Approve
                        </button>
                        <button onClick={() => handleReject(provider)} className="action-btn danger">
                          Reject
                        </button>
                      </>
                    )}
                    {provider.status === 'active' && (
                      <>
                        <button onClick={() => handleSuspend(provider)} className="action-btn warning">
                          Suspend
                        </button>
                        <button onClick={() => handleBan(provider)} className="action-btn danger">
                          Ban
                        </button>
                      </>
                    )}
                    {provider.status === 'suspended' && (
                      <button onClick={() => adminApi.activateProvider(provider.id).then(loadProviders)} className="action-btn success">
                        Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provider Details Panel */}
      {selectedProvider && (
        <div className="admin-panel-overlay" onClick={() => setSelectedProvider(null)}>
          <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel-header">
              <h2>{selectedProvider.firstName} {selectedProvider.lastName}</h2>
              <button onClick={() => setSelectedProvider(null)} className="close-button">×</button>
            </div>
            <div className="admin-panel-content">
              <div className="detail-section">
                <h3>Provider Information</h3>
                <div className="detail-grid">
                  <div><strong>Email:</strong> {selectedProvider.email}</div>
                  <div><strong>Phone:</strong> {selectedProvider.phone}</div>
                  <div><strong>Status:</strong> <span className={`status-badge status-${selectedProvider.status}`}>{selectedProvider.status}</span></div>
                  <div><strong>Verified:</strong> {selectedProvider.verified ? 'Yes' : 'No'}</div>
                  <div><strong>Rating:</strong> ★ {selectedProvider.rating.toFixed(1)} ({selectedProvider.totalJobs} jobs)</div>
                  <div><strong>Completion Rate:</strong> {selectedProvider.completionRate}%</div>
                  <div><strong>Total Earnings:</strong> €{selectedProvider.earnings.toFixed(2)}</div>
                  <div><strong>No-Shows:</strong> {selectedProvider.noShows}</div>
                  <div><strong>Complaints:</strong> {selectedProvider.complaints}</div>
                  <div><strong>Last Active:</strong> {new Date(selectedProvider.lastActive).toLocaleString()}</div>
                </div>
              </div>

              {selectedProvider.warningFlags.length > 0 && (
                <div className="detail-section warning-section">
                  <h3>Warning Flags</h3>
                  <ul>
                    {selectedProvider.warningFlags.map((flag, idx) => (
                      <li key={idx} className="warning-item">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-section">
                <h3>Services Offered</h3>
                <div className="services-list">
                  {selectedProvider.services.map(service => (
                    <span key={service} className="service-badge">{service}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Admin Actions</h3>
                <div className="action-buttons-vertical">
                  <button onClick={() => handleAddWarning(selectedProvider)} className="action-btn-full">
                    Add Warning Flag
                  </button>
                  <button className="action-btn-full">
                    View All Jobs
                  </button>
                  <button className="action-btn-full">
                    View Complaints
                  </button>
                  <button className="action-btn-full">
                    View Documents
                  </button>
                  {selectedProvider.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(selectedProvider)} className="action-btn-full success">
                        Approve Provider
                      </button>
                      <button onClick={() => handleReject(selectedProvider)} className="action-btn-full danger">
                        Reject Application
                      </button>
                    </>
                  )}
                  {selectedProvider.status === 'active' && (
                    <>
                      <button onClick={() => handleSuspend(selectedProvider)} className="action-btn-full warning">
                        Suspend Provider
                      </button>
                      <button onClick={() => handleBan(selectedProvider)} className="action-btn-full danger">
                        Ban Permanently
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
