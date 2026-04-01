/**
 * useBrowserCall — React hook for direct browser-to-phone calling via Twilio Client SDK
 *
 * Usage:
 *   const { call, hangUp, callState, isAvailable } = useBrowserCall()
 *   call('+14155551234')   // starts ringing
 *   hangUp()               // ends the call
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Device } from '@twilio/voice-sdk'

export function useBrowserCall() {
  const [callState, setCallState] = useState('idle') // idle | connecting | ringing | in-progress | disconnected | error
  const [error, setError] = useState(null)
  const [isAvailable, setIsAvailable] = useState(null) // null = checking, true/false
  const [duration, setDuration] = useState(0)
  const [callingNumber, setCallingNumber] = useState(null)
  const deviceRef = useRef(null)
  const activeCallRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Check if browser calling is configured
  useEffect(() => {
    fetch('/api/browser-call/status')
      .then(r => r.json())
      .then(data => setIsAvailable(data.configured === true))
      .catch(() => setIsAvailable(false))
  }, [])

  // Duration timer
  useEffect(() => {
    if (callState === 'in-progress') {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (callState === 'idle') setDuration(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [callState])

  const ensureDevice = useCallback(async () => {
    // Reuse existing device if still valid
    if (deviceRef.current && deviceRef.current.state !== 'destroyed') {
      return deviceRef.current
    }

    console.log('[useBrowserCall] Fetching token...')
    const res = await fetch('/api/browser-call/token')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || err.details || `Token fetch failed (${res.status})`)
    }
    const { token } = await res.json()
    console.log('[useBrowserCall] Token received, creating Device...')

    const device = new Device(token, {
      logLevel: 1,
      codecPreferences: ['opus', 'pcmu'],
      // Keep connection alive
      closeProtection: true,
    })

    device.on('error', (err) => {
      console.error('[useBrowserCall] Device error:', err)
    })

    device.on('tokenWillExpire', async () => {
      console.log('[useBrowserCall] Token expiring, refreshing...')
      try {
        const r = await fetch('/api/browser-call/token')
        const { token: newToken } = await r.json()
        device.updateToken(newToken)
      } catch (e) {
        console.error('[useBrowserCall] Token refresh failed:', e)
      }
    })

    await device.register()
    console.log('[useBrowserCall] Device registered')
    deviceRef.current = device
    return device
  }, [])

  const call = useCallback(async (phoneNumber) => {
    setError(null)
    setCallingNumber(phoneNumber)
    setCallState('connecting')
    setDuration(0)

    try {
      const device = await ensureDevice()
      console.log('[useBrowserCall] Connecting to', phoneNumber)

      const activeCall = await device.connect({
        params: { To: phoneNumber },
      })

      activeCallRef.current = activeCall
      console.log('[useBrowserCall] Call object created, SID:', activeCall.parameters?.CallSid)

      activeCall.on('ringing', (hasEarlyMedia) => {
        console.log('[useBrowserCall] Ringing, earlyMedia:', hasEarlyMedia)
        setCallState('ringing')
      })

      activeCall.on('accept', () => {
        console.log('[useBrowserCall] Call accepted/answered')
        setCallState('in-progress')
      })

      activeCall.on('disconnect', (call) => {
        console.log('[useBrowserCall] Call disconnected')
        setCallState('disconnected')
        activeCallRef.current = null
        // Auto-reset after showing disconnected state briefly
        setTimeout(() => setCallState('idle'), 3000)
      })

      activeCall.on('cancel', () => {
        console.log('[useBrowserCall] Call cancelled')
        setCallState('idle')
        activeCallRef.current = null
      })

      activeCall.on('reject', () => {
        console.log('[useBrowserCall] Call rejected')
        setError('Call was rejected')
        setCallState('error')
        activeCallRef.current = null
      })

      activeCall.on('error', (err) => {
        console.error('[useBrowserCall] Call error:', err)
        setError(err.message || String(err))
        setCallState('error')
        activeCallRef.current = null
      })

      // Twilio SDK also emits 'warning' for quality issues
      activeCall.on('warning', (name, data) => {
        console.warn('[useBrowserCall] Call warning:', name, data)
      })

    } catch (err) {
      console.error('[useBrowserCall] Connect error:', err)
      setError(err.message)
      setCallState('error')
    }
  }, [ensureDevice])

  const hangUp = useCallback(() => {
    console.log('[useBrowserCall] Hanging up')
    if (activeCallRef.current) {
      activeCallRef.current.disconnect()
      activeCallRef.current = null
    }
    setCallState('disconnected')
    setTimeout(() => setCallState('idle'), 2000)
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setCallState('idle')
    setCallingNumber(null)
    setDuration(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeCallRef.current) activeCallRef.current.disconnect()
      if (deviceRef.current) {
        deviceRef.current.destroy()
        deviceRef.current = null
      }
    }
  }, [])

  return {
    call,
    hangUp,
    reset,
    callState,
    error,
    isAvailable,
    duration,
    callingNumber,
    isActive: callState === 'connecting' || callState === 'ringing' || callState === 'in-progress',
  }
}
