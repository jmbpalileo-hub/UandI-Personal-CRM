import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getStudents()
      setStudents(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addStudent = useCallback(async (studentData) => {
    const optimistic = { ...studentData, _optimistic: true }
    setStudents(prev => [optimistic, ...prev])
    try {
      await api.createStudent(studentData)
      await load()
    } catch (e) {
      setStudents(prev => prev.filter(s => s !== optimistic))
      throw e
    }
  }, [load])

  const updateStudent = useCallback(async (fileNo, data) => {
    setStudents(prev => prev.map(s => s.file_no === fileNo ? { ...s, ...data } : s))
    try {
      await api.updateStudent(fileNo, data)
    } catch (e) {
      await load()
      throw e
    }
  }, [load])

  return { students, loading, error, refetch: load, addStudent, updateStudent }
}

export function useStudent(fileNo) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!fileNo) return
    try {
      setLoading(true)
      const data = await api.getStudent(fileNo)
      setStudent(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fileNo])

  useEffect(() => { load() }, [load])

  const update = useCallback(async (data) => {
    setStudent(prev => ({ ...prev, ...data }))
    try {
      await api.updateStudent(fileNo, data)
    } catch (e) {
      await load()
      throw e
    }
  }, [fileNo, load])

  return { student, loading, error, refetch: load, update }
}
