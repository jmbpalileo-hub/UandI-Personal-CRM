import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useGmailThreads(fileNo) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!fileNo) return
    try {
      setLoading(true)
      const data = await api.getThreads(fileNo)
      setThreads(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fileNo])

  useEffect(() => { load() }, [load])

  return { threads, loading, error }
}

export function useDriveFiles(fileNo) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!fileNo) return
    try {
      setLoading(true)
      const data = await api.getFiles(fileNo)
      setFiles(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fileNo])

  useEffect(() => { load() }, [load])

  return { files, loading, error }
}

export function usePayments(fileNo) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!fileNo) return
    try {
      setLoading(true)
      const data = await api.getPayments(fileNo)
      setPayments(data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [fileNo])

  useEffect(() => { load() }, [load])

  const addPayment = useCallback(async (data) => {
    const opt = { ...data, payment_id: `_opt_${Date.now()}` }
    setPayments(prev => [...prev, opt])
    try {
      await api.addPayment(data)
      await load()
    } catch (e) {
      setPayments(prev => prev.filter(p => p !== opt))
      throw e
    }
  }, [load])

  return { payments, loading, addPayment, refetch: load }
}

export function useEnrolments(fileNo) {
  const [enrolments, setEnrolments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!fileNo) return
    try {
      setLoading(true)
      const data = await api.getEnrolments(fileNo)
      setEnrolments(data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [fileNo])

  useEffect(() => { load() }, [load])

  const addEnrolment = useCallback(async (data) => {
    const opt = { ...data, enrolment_id: `_opt_${Date.now()}` }
    setEnrolments(prev => [...prev, opt])
    try {
      await api.addEnrolment(data)
      await load()
    } catch (e) {
      setEnrolments(prev => prev.filter(e => e !== opt))
      throw e
    }
  }, [load])

  return { enrolments, loading, addEnrolment, refetch: load }
}

export function useChecklist(fileNo) {
  const [checklist, setChecklist] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!fileNo) return
    try {
      setLoading(true)
      const data = await api.getChecklist(fileNo)
      setChecklist(data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [fileNo])

  useEffect(() => { load() }, [load])

  const toggle = useCallback(async (field) => {
    setChecklist(prev => {
      if (!prev) return prev
      return { ...prev, [field]: prev[field] === '✓' ? '' : '✓' }
    })
    try {
      const current = await api.getChecklist(fileNo)
      const updated = { ...current, [field]: current[field] === '✓' ? '' : '✓' }
      await api.updateChecklist(fileNo, updated)
    } catch {
      await load()
    }
  }, [fileNo, load])

  return { checklist, loading, toggle }
}
