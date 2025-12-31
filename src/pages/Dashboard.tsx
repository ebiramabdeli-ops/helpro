import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.service';
import { useOrders } from '../services/order.service';
import { useAI } from '../services/ai.service';
import { useTranslation } from '../i18n';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import './Dashboard.css';

// Dashboard Components
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import TrustScoreCard from '../components/Dashboard/TrustScoreCard';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentOrders from '../components/Dashboard/RecentOrders';
import StatsOverview from '../components/Dashboard/StatsOverview';
import AIInsights from '../components/Dashboard/AIInsights';

/**
 * USER DASHBOARD - Phase 10: Long-Term Satisfaction UX
 * 
 * Enhanced with:
 * - Booking history with easy access
 * - One-click re-booking
 * - Clear support access
 * - Calm notification system
 * 
 * DEVELOPER A (Frontend/UX Owner):
 * - All UI components in /components/Dashboard/
 * - Styling and layout
 * - User interactions
 * - Responsive design
 * 
 * DEVELOPER B (Backend/Logic Owner):
 * - API integration (useOrders, useAI, useAuth hooks)
 * - Data fetching logic
 * - Error handling
 * - Performance optimization
 */

interface DashboardData {
  orders: any[];
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalSpent: number;
  };
  trustScore: any;
  aiInsights: any;
  loading: boolean;
  error: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrders } = useOrders();
  const { getMyTrustScore } = useAI();
  const { t } = useTranslation();

  const [data, setData] = useState<DashboardData>({
    orders: [],
    stats: {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
    },
    trustScore: null,
    aiInsights: null,
    loading: true,
    error: null,
  });

  // DEVELOPER B: Data fetching logic
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all data in parallel
      const [ordersResult, trustScoreResult] = await Promise.all([
        getOrders({ role: user?.role || 'customer' }),
        getMyTrustScore(),
      ]);

      // Calculate stats from orders
      const stats = calculateStats(ordersResult.orders);

      setData({
        orders: ordersResult.orders.slice(0, 5), // Recent 5
        stats,
        trustScore: trustScoreResult,
        aiInsights: null, // TODO: Add AI insights
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data',
      }));
    }
  };

  // DEVELOPER B: Statistics calculation
  const calculateStats = (orders: any[]) => {
    return {
      totalOrders: orders.length,
      activeOrders: orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'IN_PROGRESS'
      ).length,
      completedOrders: orders.filter((o) => o.status === 'COMPLETED').length,
      totalSpent: orders.reduce(
        (sum, o) => sum + (o.finalPrice || o.budget || 0),
        0
      ),
    };
  };

  // Phase 10: Easy re-booking
  const handleReBook = (orderId: string) => {
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      navigate('/booking/re-book', { state: { previousOrder: order } });
    }
  };

  // DEVELOPER A: Loading state UI
  if (data.loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  // DEVELOPER A: Error state UI
  if (data.error) {
    return (
      <div className="dashboard-error">
        <h2>{t('error')}</h2>
        <p>{data.error}</p>
        <button onClick={loadDashboardData}>{t('retry')}</button>
      </div>
    );
  }

  // DEVELOPER A: Main dashboard layout
  return (
    <div className="dashboard">
      {/* DEVELOPER A: Header with greeting */}
      <DashboardHeader user={user} />

      {/* Phase 10: Quick Service Booking */}
      <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--background) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Need help with something?</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              Book a service in just a few clicks
            </p>
          </div>
          <Button onClick={() => navigate('/')}>Book Service</Button>
        </div>
      </Card>

      {/* DEVELOPER A: Main grid layout */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* DEVELOPER A: Trust Score Card (UI) */}
          {/* DEVELOPER B: Trust Score Data (API) */}
          <TrustScoreCard trustScore={data.trustScore} />

          {/* DEVELOPER A: Quick Actions (UI) */}
          <QuickActions userRole={user?.role} />

          {/* DEVELOPER A: AI Insights (UI) */}
          {/* DEVELOPER B: AI Insights Data (API) */}
          <AIInsights insights={data.aiInsights} />
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          {/* DEVELOPER A: Stats Overview (UI) */}
          {/* DEVELOPER B: Stats Calculation (Logic) */}
          <StatsOverview stats={data.stats} />

          {/* DEVELOPER A: Recent Orders (UI) */}
          {/* DEVELOPER B: Orders Data (API) */}
          <RecentOrders orders={data.orders} onRefresh={loadDashboardData} />
        </div>
      </div>
    </div>
  );
}
