import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { adminUserAction, fetchAdminDashboard, isSuperAdminEmail } from './utils/adminClient.js'

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPkr(amount) {
  return `PKR ${Number(amount || 0).toLocaleString()}`
}

function statusLabel(status) {
  if (!status || status === 'none') return 'No plan'
  return String(status).replace(/_/g, ' ')
}

function AdminDashboardPage({ authUser }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState('')
  const [busyBlogId, setBusyBlogId] = useState('')
  const [search, setSearch] = useState('')
  const [blogSearch, setBlogSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('users')

  const isAdmin = isSuperAdminEmail(authUser?.email)

  const reload = async () => {
    setIsLoading(true)
    setError('')
    try {
      setData(await fetchAdminDashboard())
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load admin dashboard.')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return undefined
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await fetchAdminDashboard()
        if (!cancelled) setData(payload)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Unable to load admin dashboard.')
          setData(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const filteredUsers = useMemo(() => {
    const users = data?.users || []
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      if (statusFilter === 'active' && !user.isActiveSubscriber) return false
      if (statusFilter === 'inactive' && user.isActiveSubscriber) return false
      if (statusFilter !== 'all' && statusFilter !== 'active' && statusFilter !== 'inactive') {
        if ((user.status || 'none') !== statusFilter) return false
      }
      if (!query) return true
      return (
        String(user.email || '')
          .toLowerCase()
          .includes(query) ||
        String(user.fullName || '')
          .toLowerCase()
          .includes(query) ||
        String(user.username || '')
          .toLowerCase()
          .includes(query)
      )
    })
  }, [data?.users, search, statusFilter])

  const filteredBlogs = useMemo(() => {
    const blogs = data?.blogs || []
    const query = blogSearch.trim().toLowerCase()
    if (!query) return blogs
    return blogs.filter((blog) => {
      return (
        String(blog.title || '')
          .toLowerCase()
          .includes(query) ||
        String(blog.authorName || '')
          .toLowerCase()
          .includes(query) ||
        String(blog.ownerEmail || '')
          .toLowerCase()
          .includes(query) ||
        String(blog.slug || '')
          .toLowerCase()
          .includes(query)
      )
    })
  }, [data?.blogs, blogSearch])

  const handleAction = async (action, user) => {
    setError('')
    setMessage('')

    if (user.userId === authUser?.id) {
      setError('You cannot modify your own admin account.')
      return
    }

    if (action === 'refund') {
      const confirmed = window.confirm(
        `Refund the latest payment and cancel subscription for ${user.email}?`,
      )
      if (!confirmed) return
    }

    if (action === 'delete') {
      const confirmed = window.confirm(
        `Permanently delete ${user.email}? This removes their account and related data.`,
      )
      if (!confirmed) return
    }

    setBusyUserId(user.userId)
    try {
      const result = await adminUserAction({ action, userId: user.userId })
      if (action === 'refund') {
        setMessage(
          result.refunded
            ? `Refunded ${formatPkr(result.amountPkr)} and canceled subscription for ${user.email}.`
            : `Subscription canceled for ${user.email}. ${result.reason || 'No Stripe charge was refunded.'}`,
        )
      } else {
        setMessage(`Deleted account ${user.email}.`)
      }
      await reload()
    } catch (actionError) {
      setError(actionError?.message || 'Unable to complete action.')
    } finally {
      setBusyUserId('')
    }
  }

  const handleRemoveBlog = async (blog) => {
    setError('')
    setMessage('')
    const confirmed = window.confirm(
      `Remove blog "${blog.title}" by ${blog.authorName || blog.ownerEmail}? This cannot be undone.`,
    )
    if (!confirmed) return

    setBusyBlogId(blog.id)
    try {
      await adminUserAction({ action: 'delete_blog', blogId: blog.id })
      setMessage(`Removed blog "${blog.title}".`)
      await reload()
    } catch (actionError) {
      setError(actionError?.message || 'Unable to remove blog.')
    } finally {
      setBusyBlogId('')
    }
  }

  if (!authUser) {
    return <Navigate to="/signin" replace state={{ from: '/admin' }} />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const summary = data?.summary

  return (
    <main className="page-main container admin-page">
      <section className="section-title">
        <p>Super Admin</p>
        <h2>Business Dashboard</h2>
      </section>

      <div className="admin-toolbar">
        <button className="btn btn-secondary" type="button" disabled={isLoading} onClick={reload}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
        <Link className="btn btn-secondary" to="/dashboard">
          Open Dashboard
        </Link>
      </div>

      {message ? <p className="admin-success-msg" role="status">{message}</p> : null}
      {error ? <p className="planner-error">{error}</p> : null}

      {summary ? (
        <section className="admin-summary-grid" aria-label="Business summary">
          <article className="admin-stat-card">
            <p>Total revenue</p>
            <strong>{summary.totalEarnedLabel}</strong>
            <span>Source: {summary.revenueSource}</span>
          </article>
          <article className="admin-stat-card">
            <p>Total orders</p>
            <strong>{summary.totalOrders}</strong>
            <span>Paid invoices / orders</span>
          </article>
          <article className="admin-stat-card">
            <p>Active subscribers</p>
            <strong>{summary.activeSubscribers}</strong>
            <span>active / trialing / voucher</span>
          </article>
          <article className="admin-stat-card">
            <p>Registered users</p>
            <strong>{summary.totalRegisteredUsers}</strong>
            <span>All auth accounts</span>
          </article>
          <article className="admin-stat-card">
            <p>Published blogs</p>
            <strong>{summary.totalBlogs ?? (data?.blogs || []).length}</strong>
            <span>User-generated posts</span>
          </article>
        </section>
      ) : null}

      {summary?.statusCounts ? (
        <section className="admin-status-strip" aria-label="Subscription status breakdown">
          {Object.entries(summary.statusCounts).map(([key, value]) => (
            <div key={key} className="admin-status-chip">
              <span>{statusLabel(key)}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>
      ) : null}

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          aria-selected={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
        >
          All Users
          <span className="admin-tab-count">{summary?.totalRegisteredUsers ?? filteredUsers.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`admin-tab ${activeTab === 'blogs' ? 'active' : ''}`}
          aria-selected={activeTab === 'blogs'}
          onClick={() => setActiveTab('blogs')}
        >
          All Blogs
          <span className="admin-tab-count">{summary?.totalBlogs ?? (data?.blogs || []).length}</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <section className="admin-panel" role="tabpanel" aria-label="All users">
            <div className="admin-panel-head">
              <h3>User details</h3>
              <div className="admin-filters">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search email, name, username"
                  aria-label="Search users"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active subscribers</option>
                  <option value="inactive">Not subscribed</option>
                  <option value="voucher">Voucher</option>
                  <option value="pending">Pending</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past due</option>
                  <option value="none">No plan</option>
                </select>
              </div>
            </div>

            {isLoading && !data ? (
              <p className="admin-empty">Loading users...</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Status</th>
                      <th>Orders</th>
                      <th>Paid</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-empty-cell">
                          No users match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isBusy = busyUserId === user.userId
                        const isSelf = user.userId === authUser.id
                        return (
                          <tr key={user.userId}>
                            <td>
                              <div className="admin-user-cell">
                                <strong>{user.fullName || '—'}</strong>
                                <span>{user.email}</span>
                                {user.username ? <span>@{user.username}</span> : null}
                              </div>
                            </td>
                            <td>
                              <span className={`admin-badge ${user.isActiveSubscriber ? 'is-active' : ''}`}>
                                {statusLabel(user.status)}
                              </span>
                            </td>
                            <td>{user.orderCount || 0}</td>
                            <td>{formatPkr(user.totalPaidPkr)}</td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>
                              <div className="admin-row-actions">
                                <button
                                  className="btn btn-secondary admin-action-btn"
                                  type="button"
                                  disabled={
                                    isBusy ||
                                    isSelf ||
                                    !user.isActiveSubscriber ||
                                    user.status === 'voucher'
                                  }
                                  onClick={() => handleAction('refund', user)}
                                  title={
                                    user.status === 'voucher'
                                      ? 'Voucher access cannot be refunded'
                                      : undefined
                                  }
                                >
                                  {isBusy ? 'Working...' : 'Refund'}
                                </button>
                                <button
                                  className="btn btn-danger admin-action-btn"
                                  type="button"
                                  disabled={isBusy || isSelf}
                                  onClick={() => handleAction('delete', user)}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>Recent orders</h3>
              {data?.generatedAt ? (
                <span className="admin-generated">Updated {formatDate(data.generatedAt)}</span>
              ) : null}
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid at</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentOrders || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-empty-cell">
                        No orders recorded yet. Run the payment_orders migration and process a Stripe
                        payment to populate this.
                      </td>
                    </tr>
                  ) : (
                    (data?.recentOrders || []).map((order) => (
                      <tr key={order.id || order.stripeInvoiceId}>
                        <td>{order.email}</td>
                        <td>{order.orderType || '—'}</td>
                        <td>{formatPkr(order.amountPkr)}</td>
                        <td>{order.status || '—'}</td>
                        <td>{formatDate(order.paidAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="admin-panel" role="tabpanel" aria-label="All blogs">
          <div className="admin-panel-head">
            <h3>Blog details</h3>
            <div className="admin-filters">
              <input
                type="search"
                value={blogSearch}
                onChange={(event) => setBlogSearch(event.target.value)}
                placeholder="Search title, author, email"
                aria-label="Search blogs"
              />
            </div>
          </div>

          {isLoading && !data ? (
            <p className="admin-empty">Loading blogs...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Blog</th>
                    <th>Author</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-empty-cell">
                        No blogs found.
                      </td>
                    </tr>
                  ) : (
                    filteredBlogs.map((blog) => {
                      const isBusy = busyBlogId === blog.id
                      return (
                        <tr key={blog.id}>
                          <td>
                            <div className="admin-user-cell">
                              <strong>{blog.title || 'Untitled'}</strong>
                              <span>{blog.excerpt || 'No excerpt'}</span>
                              <span>
                                <a
                                  className="admin-blog-link"
                                  href={`/blogs/${blog.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  /blogs/{blog.slug}
                                </a>
                              </span>
                              {blog.categories?.length ? (
                                <span>{blog.categories.join(', ')}</span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="admin-user-cell">
                              <strong>{blog.authorName || '—'}</strong>
                              <span>{blog.ownerEmail || '—'}</span>
                            </div>
                          </td>
                          <td>{formatDate(blog.createdAt)}</td>
                          <td>
                            <button
                              className="btn btn-danger admin-action-btn"
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRemoveBlog(blog)}
                            >
                              {isBusy ? 'Removing...' : 'Remove'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default AdminDashboardPage
