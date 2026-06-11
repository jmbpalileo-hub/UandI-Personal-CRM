import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, PlusCircle, Users, FolderOpen, LayoutGrid, List } from 'lucide-react'
import { useStudents } from '../hooks/useStudents'
import StudentCard from '../components/StudentCard'
import StudentRow from '../components/StudentRow'
import StudentForm from '../components/StudentForm'
import DriveImportModal from '../components/DriveImportModal'
import { useToast } from '../components/Toast'
import { getVisaStatus } from '../lib/utils'

const STATUS_TABS = ['All', 'Active', 'On Hold', 'Completed']
const SORT_OPTIONS = [
  { value: 'visa_asc', label: 'Visa Expiry (soonest)' },
  { value: 'name_az', label: 'Name A–Z' },
  { value: 'updated_desc', label: 'Last Updated' },
]

export default function Dashboard() {
  const { students, loading, addStudent, refetch: load } = useStudents()
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('All')
  const [sort, setSort] = useState('visa_asc')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('crm-view') || 'grid')
  const toast = useToast()

  const toggleView = (mode) => {
    setViewMode(mode)
    localStorage.setItem('crm-view', mode)
  }

  const filtered = useMemo(() => {
    let list = [...students]
    if (statusTab !== 'All') list = list.filter(s => s.status === statusTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        `${s.first_name} ${s.family_name}`.toLowerCase().includes(q) ||
        (s.file_no || '').toLowerCase().includes(q) ||
        (s.new_school || '').toLowerCase().includes(q) ||
        (s.visa_type || '').toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      if (sort === 'name_az') return `${a.family_name}${a.first_name}`.localeCompare(`${b.family_name}${b.first_name}`)
      if (sort === 'visa_asc') {
        const da = a.visa_end_date ? new Date(a.visa_end_date).getTime() : Infinity
        const db = b.visa_end_date ? new Date(b.visa_end_date).getTime() : Infinity
        return da - db
      }
      return 0
    })
    return list
  }, [students, search, statusTab, sort])

  const counts = useMemo(() => {
    const c = { All: students.length }
    STATUS_TABS.slice(1).forEach(s => { c[s] = students.filter(st => st.status === s).length })
    return c
  }, [students])

  const handleAdd = async (data) => {
    try {
      await addStudent(data)
    } catch (e) {
      toast(e.message || 'Failed to add student', 'error')
      throw e
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Page header */}
      <div className="px-8 py-6 border-b border-border bg-white">
        <div className="flex items-center justify-between max-w-5xl">
          <div>
            <h1 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 24, color: '#1A2E2B' }}>Students</h1>
            <p className="text-text-secondary text-sm mt-0.5">{students.length} total students</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => toggleView('grid')}
                className="px-2.5 py-2 transition-colors"
                style={{ background: viewMode === 'grid' ? '#E6F7F5' : 'white', color: viewMode === 'grid' ? '#00B09B' : '#8FA8A5' }}
                title="Grid view"
              >
                <LayoutGrid size={15} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => toggleView('list')}
                className="px-2.5 py-2 transition-colors border-l border-border"
                style={{ background: viewMode === 'list' ? '#E6F7F5' : 'white', color: viewMode === 'list' ? '#00B09B' : '#8FA8A5' }}
                title="List view"
              >
                <List size={15} strokeWidth={1.5} />
              </button>
            </div>
            <button className="btn-secondary flex items-center gap-2" onClick={() => setShowImport(true)}>
              <FolderOpen size={15} strokeWidth={1.5} />
              Import from Drive
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}>
              <PlusCircle size={16} strokeWidth={2} />
              New Student
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl w-full">
        {/* Search + Sort bar */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={1.5} />
            <input
              className="input-field pl-9"
              placeholder="Search by name, file no., school, or visa type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              className="input-field pl-9 pr-8 appearance-none"
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ minWidth: 180 }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className="px-4 py-2 text-sm font-semibold transition-all duration-150 relative -mb-px"
              style={{
                fontFamily: 'Nunito',
                color: statusTab === tab ? '#00B09B' : '#4B6B67',
                borderBottom: statusTab === tab ? '2px solid #00B09B' : '2px solid transparent',
              }}
            >
              {tab}
              <span
                className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
                style={{ background: statusTab === tab ? '#E6F7F5' : '#F1F5F9', color: statusTab === tab ? '#008C7E' : '#64748B' }}
              >
                {counts[tab] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Student list / grid */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-border rounded w-2/3 mb-3" />
                  <div className="h-3 bg-border rounded w-1/3 mb-2" />
                  <div className="h-3 bg-border rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="card overflow-hidden">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 animate-pulse">
                  <div className="h-3 bg-border rounded w-20" />
                  <div className="h-3 bg-border rounded w-32" />
                  <div className="h-3 bg-border rounded w-40" />
                  <div className="h-3 bg-border rounded w-16 ml-auto" />
                </div>
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users size={40} className="text-text-muted" strokeWidth={0.8} />
            <p style={{ fontFamily: 'Caveat', fontSize: 20, color: '#8FA8A5' }}>
              {search ? 'No students match your search.' : 'No students yet — add your first one.'}
            </p>
            {!search && (
              <button className="btn-primary flex items-center gap-2 mt-1" onClick={() => setShowForm(true)}>
                <PlusCircle size={15} />New Student
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => <StudentCard key={s.file_no} student={s} />)}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* List header */}
            <div className="grid grid-cols-[140px_1fr_1fr_120px_110px] gap-4 px-4 py-2.5 border-b border-border table-header text-xs font-semibold text-text-secondary uppercase tracking-wide">
              <span>File No.</span>
              <span>Name</span>
              <span>School</span>
              <span>Visa Expiry</span>
              <span>Status</span>
            </div>
            {filtered.map(s => <StudentRow key={s.file_no} student={s} />)}
          </div>
        )}
      </div>

      {showForm && <StudentForm onSave={handleAdd} onClose={() => setShowForm(false)} />}
      {showImport && (
        <DriveImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { load(); toast('Students imported from Drive') }}
        />
      )}
    </div>
  )
}
