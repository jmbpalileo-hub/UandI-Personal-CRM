import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/students', label: 'Students', icon: Users },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-200"
      style={{
        width: collapsed ? 56 : 240,
        background: '#F0FBF9',
        borderRight: '1px solid #D1E8E5',
        flexShrink: 0,
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid #D1E8E5', background: 'white', minHeight: 64 }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg font-black text-white"
          style={{ width: 36, height: 36, background: '#00B09B', fontFamily: 'Nunito', fontSize: 14 }}
        >
          U&I
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#00B09B' }}>U&I</span>
            <span style={{ fontFamily: 'Caveat', fontWeight: 600, fontSize: 14, color: '#4B6B67' }}>Student CRM</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-semibold ${
                active ? 'text-white' : 'text-text-secondary hover:bg-brand-light'
              }`}
              style={active ? { background: '#00B09B', fontFamily: 'Nunito' } : { fontFamily: 'Nunito' }}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={1.5} />
              {!collapsed && label}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 flex flex-col gap-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-brand-light text-sm font-semibold transition-all duration-150"
          style={{ fontFamily: 'Nunito' }}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} strokeWidth={1.5} />
          {!collapsed && 'Settings'}
        </NavLink>

        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-brand-light text-text-secondary transition-all duration-150 self-end mt-1"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
