import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <div>
            <span className="text-base font-semibold text-slate-900">Nexora</span>
            <span className="ml-2 text-xs text-slate-500">Operations workspace</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link className="hover:text-blue-600" to="/workspace">Workspace</Link>
          <Link className="hover:text-blue-600" to="/submit">Support</Link>
        </div>
      </div>
    </nav>
  );
}
