import { Check } from 'lucide-react'

const STEPS = [
  { key: 'application_form', label: 'Application Form' },
  { key: 'letter_of_offer', label: 'Letter of Offer' },
  { key: 'first_payment', label: 'First Payment' },
  { key: 'coe', label: 'CoE' },
  { key: 'visa_applied', label: 'Visa Applied' },
  { key: 'medical_check', label: 'Medical Check' },
  { key: 'visa_approved', label: 'Visa Approved' },
]

export default function ChecklistBar({ checklist, onToggle }) {
  if (!checklist) return null

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = checklist[step.key] === '✓'
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <button
                onClick={() => onToggle(step.key)}
                className="flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110"
                style={{
                  background: done ? '#00B09B' : 'white',
                  borderColor: done ? '#00B09B' : '#D1E8E5',
                }}
                title={step.label}
              >
                {done && <Check size={14} color="white" strokeWidth={2.5} />}
              </button>
              <span
                className="text-center leading-tight"
                style={{ fontSize: 10, color: '#4B6B67', maxWidth: 60, textAlign: 'center', fontFamily: 'Inter' }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="h-0.5 flex-1 -mt-5"
                style={{ background: done ? '#00B09B' : '#D1E8E5', transition: 'background 0.2s' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
