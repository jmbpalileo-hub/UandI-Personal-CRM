import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useUpdates(fileNo) {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!fileNo) return
    try {
      setLoading(true)
      const data = await api.getUpdates(fileNo)
      setUpdates(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [fileNo])

  useEffect(() => { load() }, [load])

  const addUpdate = useCallback(async (entry) => {
    const optimistic = { ...entry, update_id: `_opt_${Date.now()}`, _optimistic: true }
    setUpdates(prev => [optimistic, ...prev])
    try {
      await api.addUpdate(entry)
      await load()
    } catch (e) {
      setUpdates(prev => prev.filter(u => u !== optimistic))
      throw e
    }
  }, [load])

  const editUpdate = useCallback(async (updateId, data) => {
    setUpdates(prev => prev.map(u => u.update_id === updateId ? { ...u, ...data } : u))
    try {
      await api.updateUpdate(updateId, data)
    } catch {
      await load()
    }
  }, [load])

  return { updates, loading, addUpdate, editUpdate, refetch: load }
}
