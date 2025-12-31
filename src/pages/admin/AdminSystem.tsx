import { useEffect, useState } from 'react';
import { adminApi } from '../../services/admin-api.service';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * MODULE G - SYSTEM & STABILITY
 * 
 * Problems to Solve:
 * - API failures
 * - Service outages
 * - Regional downtime
 * 
 * Features:
 * - System health indicators
 * - Error log viewer
 * - Ability to disable services temporarily
 * - Maintenance mode toggle
 */

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: string;
  }[];
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    connections: number;
  };
  cache: {
    status: 'up' | 'down';
    hitRate: number;
  };
  uptime: number;
}

interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'critical';
  service: string;
  message: string;
  stack?: string;
  timestamp: string;
  userId?: string;
  resolved: boolean;
}

export default function AdminSystem() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  useEffect(() => {
    loadSystemData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const [healthData, logsData] = await Promise.all([
        adminApi.getSystemHealth(),
        adminApi.getErrorLogs({ limit: 50 })
      ]);
      setHealth(healthData);
      setErrorLogs(logsData.logs || []);
      setMaintenanceMode(healthData.maintenanceMode || false);
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenanceMode = () => {
    setConfirmDialog({
      isOpen: true,
      title: maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode',
      message: maintenanceMode
        ? 'Disable maintenance mode and restore normal service?'
        : 'Enable maintenance mode? All user access will be blocked.',
      action: async () => {
        try {
          await adminApi.toggleMaintenanceMode(!maintenanceMode);
          setMaintenanceMode(!maintenanceMode);
          alert(maintenanceMode ? 'Maintenance mode disabled' : 'Maintenance mode enabled');
        } catch (err) {
          alert('Failed to toggle maintenance mode');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: !maintenanceMode
    });
  };

  const handleDisableService = (serviceName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Disable Service',
      message: `Temporarily disable ${serviceName}? This will affect users.`,
      action: async () => {
        const reason = prompt('Reason for disabling:');
        if (reason) {
          try {
            await adminApi.disableService(serviceName, reason);
            await loadSystemData();
            alert('Service disabled');
          } catch (err) {
            alert('Failed to disable service');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleEnableService = async (serviceName: string) => {
    try {
      await adminApi.enableService(serviceName);
      await loadSystemData();
      alert('Service enabled');
    } catch (err) {
      alert('Failed to enable service');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
      case 'connected':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'down':
      case 'disconnected':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#dc2626';
      case 'error':
        return '#ea580c';
      case 'warning':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  if (loading && !health) {
    return <div className="admin-loading">Loading system status...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>System Control</h1>
          <p className="page-subtitle">Monitor health, manage services, view error logs</p>
        </div>
        <button
          onClick={handleToggleMaintenanceMode}
          className={`action-btn ${maintenanceMode ? 'success' : 'danger'}`}
        >
          {maintenanceMode ? 'Disable' : 'Enable'} Maintenance Mode
        </button>
      </div>

      {/* Maintenance Mode Alert */}
      {maintenanceMode && (
        <div className="maintenance-alert">
          ⚠️ MAINTENANCE MODE ACTIVE - All user access is blocked
        </div>
      )}

      {/* Overall Health */}
      {health && (
        <div className="system-health-card">
          <div className="health-status">
            <div
              className="health-indicator"
              style={{ background: getStatusColor(health.overall) }}
            />
            <div>
              <h2>System Status: {health.overall.toUpperCase()}</h2>
              <p>Uptime: {health.uptime.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status Grid */}
      {health && (
        <div className="services-grid">
          {health.services.map((service) => (
            <div key={service.name} className="service-card">
              <div className="service-header">
                <h3>{service.name}</h3>
                <div
                  className="service-status"
                  style={{ color: getStatusColor(service.status) }}
                >
                  {service.status.toUpperCase()}
                </div>
              </div>
              <div className="service-metrics">
                <div>Response Time: {service.responseTime}ms</div>
                <div className="text-secondary text-sm">
                  Last check: {new Date(service.lastCheck).toLocaleString()}
                </div>
              </div>
              <div className="service-actions">
                {service.status === 'up' ? (
                  <button
                    onClick={() => handleDisableService(service.name)}
                    className="action-btn-sm danger"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={() => handleEnableService(service.name)}
                    className="action-btn-sm success"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Database Status */}
          <div className="service-card">
            <div className="service-header">
              <h3>Database</h3>
              <div
                className="service-status"
                style={{ color: getStatusColor(health.database.status) }}
              >
                {health.database.status.toUpperCase()}
              </div>
            </div>
            <div className="service-metrics">
              <div>Response Time: {health.database.responseTime}ms</div>
              <div>Active Connections: {health.database.connections}</div>
            </div>
          </div>

          {/* Cache Status */}
          <div className="service-card">
            <div className="service-header">
              <h3>Cache</h3>
              <div
                className="service-status"
                style={{ color: getStatusColor(health.cache.status) }}
              >
                {health.cache.status.toUpperCase()}
              </div>
            </div>
            <div className="service-metrics">
              <div>Hit Rate: {health.cache.hitRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Logs */}
      <div className="error-logs-section">
        <h2>Error Logs</h2>
        <div className="error-logs-container">
          {errorLogs.map((error) => (
            <div
              key={error.id}
              className={`error-log-card ${error.resolved ? 'resolved' : ''}`}
              onClick={() => setSelectedError(error)}
              style={{ borderLeft: `4px solid ${getLevelColor(error.level)}` }}
            >
              <div className="error-log-header">
                <div className="error-level" style={{ color: getLevelColor(error.level) }}>
                  {error.level.toUpperCase()}
                </div>
                <div className="error-service">{error.service}</div>
                {error.resolved && <span className="resolved-badge">Resolved</span>}
              </div>
              <div className="error-message">{error.message}</div>
              <div className="error-time">{new Date(error.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Details Panel */}
      {selectedError && (
        <div className="admin-panel-overlay" onClick={() => setSelectedError(null)}>
          <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel-header">
              <h2>Error Log Details</h2>
              <button onClick={() => setSelectedError(null)} className="close-button">×</button>
            </div>
            <div className="admin-panel-content">
              <div className="detail-section">
                <h3>Error Information</h3>
                <div className="detail-grid">
                  <div><strong>Level:</strong> <span style={{ color: getLevelColor(selectedError.level) }}>{selectedError.level}</span></div>
                  <div><strong>Service:</strong> {selectedError.service}</div>
                  <div><strong>Timestamp:</strong> {new Date(selectedError.timestamp).toLocaleString()}</div>
                  <div><strong>Resolved:</strong> {selectedError.resolved ? 'Yes' : 'No'}</div>
                  {selectedError.userId && <div><strong>User ID:</strong> {selectedError.userId}</div>}
                </div>
              </div>

              <div className="detail-section">
                <h3>Error Message</h3>
                <p className="error-message-full">{selectedError.message}</p>
              </div>

              {selectedError.stack && (
                <div className="detail-section">
                  <h3>Stack Trace</h3>
                  <pre className="code-block">{selectedError.stack}</pre>
                </div>
              )}

              <div className="detail-section">
                <h3>Actions</h3>
                <div className="action-buttons-vertical">
                  {!selectedError.resolved && (
                    <button className="action-btn-full success">
                      Mark as Resolved
                    </button>
                  )}
                  <button className="action-btn-full">Copy Error Details</button>
                  {selectedError.userId && (
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
