import { useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from './Toast'
import { validateFileNo, nowDate } from '../lib/utils'

const VISA_TYPES = ['Student', 'Working Holiday', 'Tourist', 'Other']
const STATUSES = ['Active', 'On Hold', 'Completed']

const EMPTY = {
  file_no: '', vto_no: '', family_name: '', first_name: '', dob: '', gender: '',
  address: '', email: '', tel_mob: '', visa_type: 'Student', visa_end_date: '',
  previous_school: '', new_school: '', consultant: '', drive_folder_id: '',
  gmail_query: '', status: 'Active',
}

export default function StudentForm({ onSave, onClose, initial = {} }) {
  const [form, setForm] = useState({ ...EMPTY, created_at: nowDate(), ...initial })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.file_no) e.file_no = 'Required'
    else if (!validateFileNo(form.file_no)) e.file_no = 'Format: U25-001'
    if (!form.family_name) e.family_name = 'Required'
    if (!form.first_name) e.first_name = 'Required'
    if (!form.email) e.email = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.gmail_query && payload.email) {
        payload.gmail_query = `from:${payload.email} OR to:${payload.email}`
      }
      await onSave(payload)
      toast('Student saved successfully')
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to save student', 'error')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, name, type = 'text', options, required, colSpan, placeholder }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {options ? (
        <select
          className="input-field"
          value={form[name]}
          onChange={e => set(name, e.target.value)}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className={`input-field ${errors[name] ? 'border-red-400' : ''}`}
          value={form[name]}
          onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
        />
      )}
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-modal shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#1A2E2B' }}>
            {initial.file_no ? 'Edit Student' : 'New Student'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="File No." name="file_no" required placeholder="U25-001" />
            <Field label="VTO No." name="vto_no" />
            <Field label="First Name" name="first_name" required />
            <Field label="Family Name" name="family_name" required />
            <Field label="Date of Birth" name="dob" type="date" />
            <Field label="Gender" name="gender" options={['', 'M', 'F']} />
            <Field label="Email" name="email" type="email" required colSpan={2} />
            <Field label="Phone / Mobile" name="tel_mob" />
            <Field label="Visa Type" name="visa_type" options={VISA_TYPES} />
            <Field label="Visa Expiry" name="visa_end_date" type="date" />
            <Field label="Status" name="status" options={STATUSES} />
            <Field label="Consultant" name="consultant" />
            <Field label="Previous School" name="previous_school" colSpan={2} />
            <Field label="New School" name="new_school" colSpan={2} />
            <Field label="Address" name="address" colSpan={2} />
            <Field label="Drive Folder ID" name="drive_folder_id" colSpan={2} placeholder="Google Drive folder ID" />
            <Field label="Gmail Query" name="gmail_query" colSpan={2} placeholder="from:student@email.com OR subject:U25-001" />
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? 'Saving…' : initial.file_no ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  )
}
