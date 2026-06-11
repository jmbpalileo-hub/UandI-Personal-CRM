import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Hash, Mail, Phone, MapPin, Calendar, GraduationCap,
  MessageSquare, CreditCard, FolderOpen, Edit2, Receipt
} from 'lucide-react'
import { useStudent } from '../hooks/useStudents'
import { useUpdates } from '../hooks/useUpdates'
import { usePayments, useEnrolments, useChecklist, useGmailThreads, useDriveFiles } from '../hooks/useGoogleData'
import { StatusBadge, VisaExpiryBadge } from '../components/StatusBadge'
import ChecklistBar from '../components/ChecklistBar'
import UpdateEntry from '../components/UpdateEntry'
import UpdateForm from '../components/UpdateForm'
import PaymentTable from '../components/PaymentTable'
import EnrolmentPanel from '../components/EnrolmentPanel'
import GmailThreads from '../components/GmailThreads'
import DriveFiles from '../components/DriveFiles'
import StudentForm from '../components/StudentForm'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Hash },
  { id: 'updates', label: 'Updates', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'enrolments', label: 'Enrolments', icon: GraduationCap },
  { id: 'files', label: 'Files & Emails', icon: FolderOpen },
]

export default function StudentDetail() {
  const { file_no } = useParams()
  const decodedFileNo = decodeURIComponent(file_no)
  const { student, loading, update } = useStudent(decodedFileNo)
  const { updates, addUpdate, editUpdate } = useUpdates(decodedFileNo)
  const { payments, addPayment } = usePayments(decodedFileNo)
  const { enrolments, addEnrolment } = useEnrolments(decodedFileNo)
  const { checklist, toggle: toggleChecklist } = useChecklist(decodedFileNo)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditForm, setShowEditForm] = useState(false)
  const [savedField, setSavedField] = useState(null)
  const toast = useToast()
  const saveTimer = useRef(null)

  const handleFieldBlur = async (field, value) => {
    if (!student || student[field] === value) return
    try {
      await update({ [field]: value })
      setSavedField(field)
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSavedField(null), 2000)
    } catch {
      toast('Failed to save changes', 'error')
    }
  }

  const handleEditSubmit = async (data) => {
    await update(data)
    setShowEditForm(false)
    toast('Student updated')
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-text-secondary text-sm">Loading student…</span>
      </div>
    </div>
  )

  if (!student) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p style={{ fontFamily: 'Caveat', fontSize: 20, color: '#8FA8A5' }}>Student not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Back to Dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border bg-white">
        <Link to="/" className="inline-flex items-center gap-1 text-text-secondary text-sm hover:text-brand-primary mb-4 transition-colors">
          <ChevronLeft size={14} /> Back to Students
        </Link>
        <div className="flex items-start justify-between max-w-5xl">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
              style={{ width: 52, height: 52, background: '#00B09B', fontFamily: 'Nunito', fontSize: 18 }}
            >
              {student.first_name?.[0]}{student.family_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 24, color: '#1A2E2B' }}>
                  {student.first_name} {student.family_name}
                </h1>
                <StatusBadge status={student.status} />
                <VisaExpiryBadge visaEndDate={student.visa_end_date} />
              </div>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-text-muted text-sm">
                  <Hash size={12} strokeWidth={2} />{student.file_no}
                </span>
                {student.vto_no && (
                  <span className="text-text-muted text-sm">VTO: {student.vto_no}</span>
                )}
                {student.email && (
                  <span className="flex items-center gap-1 text-text-secondary text-sm">
                    <Mail size={12} strokeWidth={1.5} />{student.email}
                  </span>
                )}
                {student.tel_mob && (
                  <span className="flex items-center gap-1 text-text-secondary text-sm">
                    <Phone size={12} strokeWidth={1.5} />{student.tel_mob}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://u-i-payment-sheet-app.vercel.app/?fileNo=${encodeURIComponent(student.file_no)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <Receipt size={14} />Payment Sheet
            </a>
            <button className="btn-secondary flex items-center gap-2" onClick={() => setShowEditForm(true)}>
              <Edit2 size={14} />Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-white px-8">
        <div className="flex gap-0 max-w-5xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-150 relative"
              style={{
                fontFamily: 'Nunito',
                color: activeTab === id ? '#00B09B' : '#4B6B67',
                borderBottom: activeTab === id ? '2px solid #00B09B' : '2px solid transparent',
              }}
            >
              <Icon size={14} strokeWidth={1.5} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-8 py-6 max-w-5xl w-full">
        {activeTab === 'overview' && (
          <OverviewTab
            student={student}
            checklist={checklist}
            onToggleChecklist={toggleChecklist}
            savedField={savedField}
          />
        )}
        {activeTab === 'updates' && (
          <div>
            <UpdateForm fileNo={decodedFileNo} staff={student.consultant} onAdd={addUpdate} />
            {updates.length === 0 ? (
              <div className="card py-10 text-center">
                <p style={{ fontFamily: 'Caveat', fontSize: 18, color: '#8FA8A5' }}>
                  No updates for this student. Add one above.
                </p>
              </div>
            ) : (
              <div className="card px-3">
                {updates.map(u => (
                  <UpdateEntry key={u.update_id} update={u} onEdit={editUpdate} />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'payments' && (
          <PaymentTable payments={payments} fileNo={decodedFileNo} onAdd={addPayment} />
        )}
        {activeTab === 'enrolments' && (
          <EnrolmentPanel enrolments={enrolments} fileNo={decodedFileNo} onAdd={addEnrolment} />
        )}
        {activeTab === 'files' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DriveFiles fileNo={decodedFileNo} driveFolderId={student.drive_folder_id} />
            <GmailThreads fileNo={decodedFileNo} gmailQuery={student.gmail_query} />
          </div>
        )}
      </div>

      {showEditForm && (
        <StudentForm
          initial={student}
          onSave={handleEditSubmit}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  )
}

function OverviewTab({ student, checklist, onToggleChecklist }) {
  const infoFields = [
    { label: 'Email', value: student.email, icon: Mail },
    { label: 'Phone', value: student.tel_mob, icon: Phone },
    { label: 'Date of Birth', value: formatDate(student.dob), icon: Calendar },
    { label: 'Gender', value: student.gender },
    { label: 'Address', value: student.address, icon: MapPin },
    { label: 'Visa Type', value: student.visa_type },
    { label: 'Visa Expiry', value: formatDate(student.visa_end_date), icon: Calendar },
    { label: 'Previous School', value: student.previous_school, icon: GraduationCap },
    { label: 'New School', value: student.new_school, icon: GraduationCap },
    { label: 'Consultant', value: student.consultant },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Checklist */}
      <div className="card p-5">
        <h3 className="mb-5" style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#1A2E2B' }}>
          Application Progress
        </h3>
        <ChecklistBar checklist={checklist} onToggle={onToggleChecklist} />
      </div>

      {/* Student info */}
      <div className="card p-5">
        <h3 className="mb-4" style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#1A2E2B' }}>
          Student Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {infoFields.filter(f => f.value).map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="label">{label}</span>
              <div className="flex items-center gap-1.5 text-text-primary text-sm">
                {Icon && <Icon size={13} strokeWidth={1.5} className="text-text-muted" />}
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
