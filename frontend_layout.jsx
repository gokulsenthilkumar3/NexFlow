import React from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Kanban, 
  GitBranch, 
  BookOpen, 
  Settings,
  Search,
  Bell,
  Plus
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false }) => (
  <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
    active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`}>
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </div>
);

const ManagerDashboard = () => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center space-x-2 px-4 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">M</div>
          <span className="text-xl font-bold tracking-tight">Manager <span className="text-blue-500">HD</span></span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Overview" active />
          <SidebarItem icon={Kanban} label="Project Boards" />
          <SidebarItem icon={Ticket} label="Helpdesk Tickets" />
          <SidebarItem icon={GitBranch} label="Repo & Pipelines" />
          <SidebarItem icon={BookOpen} label="Knowledge Base" />
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <SidebarItem icon={Settings} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-md">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search across projects & tickets..." 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
              <Bell size={20} />
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-semibold transition-all shadow-lg shadow-blue-900/20">
              <Plus size={18} />
              <span>Quick Create</span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full border-2 border-slate-800"></div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
            <div className="text-sm text-slate-500">Last updated: Just now</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Open Tickets', value: '24', trend: '+12%', color: 'blue' },
              { label: 'SLA At Risk', value: '3', trend: '-2', color: 'red' },
              { label: 'Active Sprints', value: '5', trend: 'Healthy', color: 'green' },
              { label: 'Avg. Resolution', value: '4.2h', trend: '-15%', color: 'purple' }
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
                <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-bold">{stat.value}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    stat.color === 'red' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold">Recent Ticket Inflow</h3>
                <span className="text-xs text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>
              <div className="p-6 h-64 flex items-center justify-center text-slate-500 italic">
                Chart.js / Recharts Visualization Placeholder
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold mb-6">Pipeline Health</h3>
              <div className="space-y-4">
                {['Production', 'Staging', 'Auth-Service'].map((env, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                    <span className="text-sm font-medium">{env}</span>
                    <span className="flex items-center text-xs text-green-400 font-bold">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Deployed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
