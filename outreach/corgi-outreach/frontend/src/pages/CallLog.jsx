import CallLogComponent from '../components/CallLog'
import { PhoneIncoming } from 'lucide-react'

export default function CallLog() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <PhoneIncoming size={24} className="text-teal" />
          Call Log
        </h1>
        <p className="text-charcoal-light text-sm mt-0.5 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
          </span>
          All calls, transcripts, recordings, and outcomes — auto-refreshing
        </p>
      </div>

      <CallLogComponent />
    </div>
  )
}
