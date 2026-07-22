import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminDashboardStats } from './utils/paymentClient.js'

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatPkr(amount) {
  return `PKR ${Number(amount || 0).toLocaleString()}`
}

function formatStatus(status) {
  const labels = {
    active: 'Active',
    trialing: 'Trial',
    voucher: 'Voucher',
    pending: 'Pending',
    past_due: 'Past due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    unpaid: 'Unpaid',
  }
  return labels[status] || status || '—'
}

function AdminProfilePage({ authUser }) {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchAdminDashboardStats()
        if (!cancelled) {
          setDashboard(data)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Unable to load admin dashboard.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredSubscriptions = useMemo(() => {
    const subscriptions = dashboard?.subscriptions || []
    const query = searchQuery.trim().toLowerCase()
    return subscriptions.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      if (!matchesStatus) return false
      if (!query) return true
      return (
        String(item.email || '').toLowerCase().includes(query) ||
        String(item.fullName || '').toLowerCase().includes(query) ||
        String(item.username || '').toLowerCase().includes(query)
      )
    })
  }, [dashboard?.subscriptions, searchQuery, statusFilter])

  const summary = dashboard?.summary

  return (
    <section className="intro auth-intro profile-intro">
      <div className="intro-video auth-video" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="none">
          <source src="/media/guardian-intro.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="intro-overlay auth-overlay" aria-hidden="true" />
      <section className="container auth-page auth-page-overlay profile-page admin-profile-page">
        <div className="section-title">
          <h2 className="auth-title-pump">Super Admin Dashboard</h2>
          <p className="profile-lead">
            Signed in as {authUser?.email}. Overview of subscribers, revenue, and orders.
          </p>
        </div>

        {isLoading ? <p className="admin-loading" role="status">Loading admin dashboard...</p> : null}
        {error ? <p className="planner-error profile-error">{error}</p> : null}

        {summary ? (
          <>
            <div className="admin-stats-grid">
              <article className="admin-stat-card">
                <p className="admin-stat-label">Total earned</p>
                <strong className="admin-stat-value">{summary.totalEarnedLabel}</strong>
                <span className="admin-stat-meta">Source: {summary.revenueSource}</span>
              </article>
              <article className="admin-stat-card">
                <p className="admin-stat-label">Active subscribers</p>
                <strong className="admin-stat-value">{summary.activeSubscribers}</strong>
                <span className="admin-stat-meta">Paid or voucher access</span>
              </article>
              <article className="admin-stat-card">
                <p className="admin-stat-label">Total orders</p>
                <strong className="admin-stat-value">{summary.totalOrders}</strong>
                <span className="admin-stat-meta">Stripe paid invoices</span>
              </article>
              <article className="admin-stat-card">
                <p className="admin-stat-label">Registered users</p>
                <strong className="admin-stat-value">{summary.totalRegisteredUsers}</strong>
                <span className="admin-stat-meta">All accounts</span>
              </article>
              <article className="admin-stat-card">
                <p className="admin-stat-label">Paid subscribers</p>
                <strong className="admin-stat-value">{summary.paidSubscribers}</strong>
                <span className="admin-stat-meta">Ever paid or active</span>
              </article>
              <article className="admin-stat-card">
                <p className="admin-stat-label">Subscription records</p>
                <strong className="admin-stat-value">{summary.totalSubscriptionRecords}</strong>
                <span className="admin-stat-meta">All payment profiles</span>
              </article>
            </div>

            <article className="planner-card auth-card profile-card admin-card">
              <h3>Subscription Status Breakdown</h3>
              <div className="admin-status-grid">
                {Object.entries(summary.statusCounts || {}).map(([status, count]) => (
                  <div key={status} className="admin-status-item">
                    <span>{formatStatus(status)}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="planner-card auth-card profile-card admin-card admin-card-wide">
              <div className="admin-card-head">
                <h3>All Subscriptions</h3>
                <div className="admin-filters">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search email or name"
                    aria-label="Search subscriptions"
                  />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="trialing">Trial</option>
                    <option value="voucher">Voucher</option>
                    <option value="pending">Pending</option>
                    <option value="past_due">Past due</option>
                    <option value="canceled">Canceled</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Status</th>
                      <th>Orders</th>
                      <th>Paid total</th>
                      <th>Monthly</th>
                      <th>First paid</th>
                      <th>Renews</th>
                      <th>Stripe sub</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.length ? (
                      filteredSubscriptions.map((item) => (
                        <tr key={item.userId}>
                          <td>
                            <div className="admin-user-cell">
                              <strong>{item.fullName}</strong>
                              <span>{item.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`profile-status-badge ${item.status === 'active' || item.status === 'voucher' ? 'is-active' : ''}`}>
                              {formatStatus(item.status)}
                            </span>
                          </td>
                          <td>{item.orderCount}</td>
                          <td>{formatPkr(item.totalPaidPkr)}</td>
                          <td>{formatPkr(item.monthlyAmountPkr)}</td>
                          <td>{formatDate(item.paidAt)}</td>
                          <td>{formatDate(item.currentPeriodEnd)}</td>
                          <td className="admin-mono">{item.stripeSubscriptionId || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8}>No subscriptions match your filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="planner-card auth-card profile-card admin-card admin-card-wide">
              <h3>Recent Orders</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentOrders?.length ? (
                      dashboard.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{formatDate(order.paidAt)}</td>
                          <td>{order.email}</td>
                          <td>{order.orderType}</td>
                          <td>{formatPkr(order.amountPkr)}</td>
                          <td className="admin-mono">{order.stripeInvoiceId || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>No recorded orders yet. New Stripe payments will appear here.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <div className="profile-quick-links">
              <Link className="btn btn-secondary" to="/dashboard">
                Open Dashboard
              </Link>
              {dashboard.generatedAt ? (
                <span className="admin-generated-at">Updated {formatDate(dashboard.generatedAt)}</span>
              ) : null}
            </div>
          </>
        ) : null}
      </section>
    </section>
  )
}

export default AdminProfilePage
