import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Phone, Building2, Save, Trash2, Loader2,
  ChevronDown, ChevronUp, Clock, User, ExternalLink, CheckCircle
} from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function timeAgo(iso) {
  if (!iso) return ''
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return formatDate(iso)
}

// ─── Journal Entry Card ───────────────────────────────────────────────────────

function JournalEntry({ entry, onSave, onDelete }) {
  const [notes, setNotes] = useState(entry.notes || '')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(!entry.notes) // auto-expand if no notes yet
  const [saved, setSaved] = useState(false)
  const toast = useToast()

  const dirty = notes !== (entry.notes || '')

  async function handleSave() {
    setSaving(true)
    try {
      await api.patch(`/journal/${entry.id}`, { notes })
      onSave?.(entry.id, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast('Notes saved', 'success')
    } catch (err) {
      toast(`Save failed: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this journal entry?')) return
    try {
      await api.post(`/journal/${entry.id}`, {}) // using POST as workaround
      // Actually need DELETE - let me use fetch directly
    } catch (_) {}
    try {
      await fetch(`/api/journal/${entry.id}`, { method: 'DELETE' })
      onDelete?.(entry.id)
      toast('Entry deleted', 'success')
    } catch (err) {
      toast(`Delete failed: ${err.message}`, 'error')
    }
  }

  // Save on Cmd+Enter
  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && dirty) {
      e.preventDefault()
      handleSave()
    }
  }

  const priorityColor = {
    A: 'text-red-400 bg-red-500/10 border-red-500/30',
    B: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    C: 'text-charcoal-light bg-charcoal/10 border-charcoal/30',
  }[entry.priority] || 'text-charcoal-light bg-charcoal/10 border-charcoal/30'

  return (
    <div className="card border border-charcoal/30 hover:border-charcoal/50 transition-all">
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Company icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-prussian-700/60 border border-charcoal/30 flex-shrink-0">
            <Building2 size={18} className="text-teal" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/companies/${entry.company_id}`}
                className="font-semibold text-slate-100 hover:text-teal transition-colors truncate"
                onClick={e => e.stopPropagation()}
              >
                {entry.company_name}
              </Link>
              {entry.priority && (
                <span className={`badge border text-xs ${priorityColor}`}>{entry.priority}</span>
              )}
              {entry.type && (
                <span className="badge border text-xs text-charcoal-light bg-charcoal/10 border-charcoal/30">{entry.type}</span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-0.5 text-xs text-charcoal-light">
              {entry.contact_name && (
                <span className="flex items-center gap-1">
                  <User size={10} />
                  {entry.contact_name}
                </span>
              )}
              {entry.contact_phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={10} />
                  {entry.contact_phone}
                </span>
              )}
              <span className="flex items-center gap-1" title={`${formatDate(entry.called_at)} ${formatTime(entry.called_at)}`}>
                <Clock size={10} />
                {timeAgo(entry.called_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notes indicator */}
          {entry.notes && !expanded && (
            <span className="text-xs text-charcoal-light/60 max-w-48 truncate hidden sm:block">
              {entry.notes.slice(0, 60)}{entry.notes.length > 60 ? '…' : ''}
            </span>
          )}
          {saved && <CheckCircle size={14} className="text-tea-dark" />}
          {dirty && <span className="w-2 h-2 rounded-full bg-thistle flex-shrink-0" title="Unsaved changes" />}
          {expanded ? <ChevronUp size={16} className="text-charcoal-light" /> : <ChevronDown size={16} className="text-charcoal-light" />}
        </div>
      </div>

      {/* Expanded: notes editor */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-charcoal/20 pt-4 space-y-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add call notes here… What was discussed? Next steps? Follow-up needed?"
            rows={5}
            className="w-full bg-prussian-700/40 border border-charcoal/30 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-charcoal-light/40 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 resize-y transition-all"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  dirty
                    ? 'bg-teal/15 border border-teal/40 hover:bg-teal/25 hover:border-teal/60 text-teal'
                    : 'bg-charcoal/10 border border-charcoal/20 text-charcoal-light/40 cursor-not-allowed'
                }`}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Notes'}
              </button>
              <span className="text-xs text-charcoal-light/40">⌘+Enter to save</span>
            </div>

            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-charcoal-light/40 hover:text-red-400 transition-colors px-2 py-1"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>

          {entry.updated_at && entry.updated_at !== entry.called_at && (
            <p className="text-xs text-charcoal-light/30">
              Last edited {timeAgo(entry.updated_at)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Journal Page ────────────────────────────────────────────────────────

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/journal?limit=200')
      setEntries(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleSave(id, notes) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, notes, updated_at: new Date().toISOString() } : e))
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const date = formatDate(entry.called_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-thistle/15 border border-thistle/30">
            <BookOpen size={20} className="text-thistle" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Call Journal</h1>
            <p className="text-xs text-charcoal-light">
              {entries.length} {entries.length === 1 ? 'call' : 'calls'} logged
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-teal" />
        </div>
      ) : error ? (
        <div className="card border border-red-500/30 p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="card border border-charcoal/30 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-charcoal-light/30 mb-4" />
          <p className="text-charcoal-light text-sm mb-1">No calls logged yet</p>
          <p className="text-charcoal-light/50 text-xs">
            Mark a company as "Manual Call Made" in the Companies tab to start journaling.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dateEntries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-charcoal-light uppercase tracking-wider">{date}</span>
                <div className="flex-1 h-px bg-charcoal/20" />
                <span className="text-xs text-charcoal-light/40">{dateEntries.length} {dateEntries.length === 1 ? 'call' : 'calls'}</span>
              </div>
              <div className="space-y-2">
                {dateEntries.map(entry => (
                  <JournalEntry
                    key={entry.id}
                    entry={entry}
                    onSave={handleSave}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
