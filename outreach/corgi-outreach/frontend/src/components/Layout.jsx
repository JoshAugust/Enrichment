import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Columns, Building2, Mail, Phone, GitBranch,
  ChevronLeft, ChevronRight, AlertTriangle, Settings, X
} from 'lucide-react'
import { DryRunModal } from './DryRunModal'

const BASE_NAV = [
  { to: '/companies',  label: 'Companies',       icon: Building2 },

  { to: '/emails',     label: 'Email Campaigns',  icon: Mail },
  { to: '/calls',      label: 'Voice & Calls',    icon: Phone },
  { to: '/pipeline',   label: 'Pipeline',         icon: GitBranch },
]

const DASHBOARD_NAV = { to: '/dashboard', label: 'Dashboard', icon: Columns }

const STORAGE_KEY = 'corgi-show-dashboard'

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="text-charcoal-light text-sm font-mono tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function SettingsPopover({ onClose }) {
  const [showDashboard, setShowDashboard] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function toggle() {
    const next = !showDashboard
    setShowDashboard(next)
    localStorage.setItem(STORAGE_KEY, String(next))
    // Trigger nav re-render
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-2 z-50 bg-prussian border border-charcoal/50 rounded-xl shadow-2xl p-4 w-56 animate-modal"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Settings</span>
        <button onClick={onClose} className="text-charcoal-light hover:text-slate-200 transition-colors">
          <X size={14} />
        </button>
      </div>

      <label className="flex items-center justify-between gap-3 cursor-pointer group">
        <div>
          <p className="text-sm text-slate-200">Show Dashboard</p>
          <p className="text-xs text-charcoal-light mt-0.5">Adds Dashboard to sidebar nav</p>
        </div>
        <button
          onClick={toggle}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 transition-colors duration-200 ${
            showDashboard
              ? 'bg-teal border-teal'
              : 'bg-prussian-700 border-charcoal/50'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              showDashboard ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </label>
    </div>
  )
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [showDryRunModal, setShowDryRunModal] = useState(false)
  const [isDryRun, setIsDryRun] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDashboard, setShowDashboard] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )
  const location = useLocation()
  const navigate = useNavigate()

  // Listen for localStorage changes (from settings popover)
  useEffect(() => {
    function sync() {
      setShowDashboard(localStorage.getItem(STORAGE_KEY) === 'true')
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  // Check dry run status from API
  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => setIsDryRun(d.dry_run === true))
      .catch(() => setIsDryRun(null))
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        if (!location.pathname.startsWith('/companies')) {
          navigate('/companies?focus=search')
        } else {
          window.dispatchEvent(new CustomEvent('focus-search'))
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [location.pathname, navigate])

  const navItems = showDashboard ? [...BASE_NAV, DASHBOARD_NAV] : BASE_NAV

  return (
    <div className="flex h-screen overflow-hidden bg-prussian-900">
      {showDryRunModal && <DryRunModal onClose={() => setShowDryRunModal(false)} />}

      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-prussian border-r border-charcoal/30 transition-all duration-300 flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
        style={{ background: 'linear-gradient(180deg, #011936 0%, #0a2a4a 100%)' }}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-charcoal/30 ${collapsed ? 'justify-center' : 'gap-2'}`}>
          <span className="text-2xl">🐕</span>
          {!collapsed && (
            <span className="font-bold text-white text-sm tracking-tight">Corgi Outreach</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium group ${
                  isActive
                    ? 'bg-teal/15 text-teal border-l-2 border-teal pl-[10px]'
                    : 'text-charcoal-light hover:text-thistle hover:bg-prussian-700/60 border-l-2 border-transparent pl-[10px]'
                } ${collapsed ? 'justify-center pl-3 border-l-0' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={`flex-shrink-0 transition-colors ${isActive ? 'text-teal' : 'group-hover:text-thistle'}`} />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Keyboard hint */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-charcoal/20">
            <p className="text-charcoal/60 text-xs">
              <kbd className="bg-prussian-700 border border-charcoal/40 rounded px-1 text-charcoal-light">/</kbd>
              {' '}search &nbsp;
              <kbd className="bg-prussian-700 border border-charcoal/40 rounded px-1 text-charcoal-light">Esc</kbd>
              {' '}close
            </p>
          </div>
        )}

        {/* Settings button */}
        <div className="relative border-t border-charcoal/20">
          {showSettings && <SettingsPopover onClose={() => setShowSettings(false)} />}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center w-full transition-colors h-10 ${collapsed ? 'justify-center' : 'gap-2 px-4'} ${
              showSettings
                ? 'text-teal bg-teal/10'
                : 'text-charcoal-light hover:text-thistle'
            }`}
            title="Settings"
          >
            <Settings size={16} />
            {!collapsed && <span className="text-xs">Settings</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-charcoal/20 text-charcoal-light hover:text-thistle transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 bg-prussian border-b border-charcoal/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-200 font-semibold text-sm hidden sm:block">
              {navItems.find(n => n.end
                ? location.pathname === n.to
                : location.pathname === n.to || location.pathname.startsWith(n.to + '/')
              )?.label || 'Corgi Outreach'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Clock />
            {isDryRun === true ? (
              <button
                onClick={() => setShowDryRunModal(true)}
                className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 rounded-full px-3 py-1 hover:bg-amber-500/25 transition-colors cursor-pointer group"
                title="Click to learn about DRY RUN mode"
              >
                <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                <span className="text-amber-400 text-xs font-bold tracking-wide uppercase">
                  DRY RUN
                </span>
              </button>
            ) : isDryRun === false ? (
              <span className="flex items-center gap-1.5 bg-tea/15 border border-tea/40 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-tea-dark animate-pulse" />
                <span className="text-tea-dark text-xs font-bold tracking-wide uppercase">LIVE</span>
              </span>
            ) : null}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
