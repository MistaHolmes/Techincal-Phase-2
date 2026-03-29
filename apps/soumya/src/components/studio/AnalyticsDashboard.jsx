import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Users, 
  Clock, 
  Zap,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';

const MetricCard = ({ title, value, change, isPositive, icon: Icon, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
          <Icon className="text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 transition-colors" size={24} />
        </div>
        <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      <div>
        <h3 className="font-label text-xs uppercase tracking-[0.15em] text-gray-500 font-bold mb-1">{title}</h3>
        <div className="flex items-end gap-3">
          <span className="font-headline text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-none">{value}</span>
          <span className={`flex items-center text-sm font-bold mb-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <ArrowUpRight size={16} className="mr-0.5" /> : <ArrowDownRight size={16} className="mr-0.5" />}
            {change}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const TrafficMockChart = () => {
  // SVG Mock Chart to simulate complex D3/Recharts rendering without dependencies
  const points = "0,100 20,80 40,90 60,50 80,60 100,20 120,40 140,10 160,30 180,5 200,10";
  
  return (
    <div className="w-full h-full min-h-[300px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white">Active Users (7 Days)</h2>
          <p className="font-body text-sm text-gray-500 mt-1">Real-time pulse of your platform's traffic.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">1D</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/20">7D</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">30D</button>
        </div>
      </div>

      <div className="flex-1 relative w-full mt-4 flex items-end opacity-80 z-10">
        {/* Simple CSS animated bar charts for visual weight */}
        {[40, 60, 30, 80, 50, 90, 100, 70, 85, 45, 65, 95].map((height, i) => (
          <motion.div 
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
            className="flex-1 mx-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-t-sm relative group cursor-pointer hover:bg-emerald-400 dark:hover:bg-emerald-500 transition-colors"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
              {height * 124}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Background glow for aesthetics */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent z-0 pointer-events-none" />
    </div>
  );
};

const DataTableMock = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
        <h2 className="font-headline text-lg font-bold">Recent Conversion Events</h2>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['Event ID', 'User', 'Action', 'Revenue', 'Status', 'Date'].map((header) => (
                <th key={header} className="p-4 font-label text-[10px] uppercase tracking-widest text-gray-400 font-black">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { id: 'EVT-9923', user: 'suprit-naik', action: 'Pro Subscription', rev: '$29.00', status: 'Completed', date: '2 mins ago' },
              { id: 'EVT-9922', user: 'sk-mustakim', action: 'API Credits', rev: '$120.00', status: 'Pending', date: '15 mins ago' },
              { id: 'EVT-9921', user: 'MistaHolmes', action: 'Enterprise Plan', rev: '$499.00', status: 'Completed', date: '1 hour ago' },
              { id: 'EVT-9920', user: 'Guest_819', action: 'Pro Subscription', rev: '$29.00', status: 'Failed', date: '2 hours ago' },
              { id: 'EVT-9919', user: 'AlexTracker', action: 'Basic Plan', rev: '$9.00', status: 'Completed', date: '5 hours ago' },
            ].map((row, i) => (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={row.id} 
                className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer"
              >
                <td className="p-4 font-body text-sm font-bold text-gray-900 dark:text-white">{row.id}</td>
                <td className="p-4 font-body text-sm text-gray-600 dark:text-gray-300">{row.user}</td>
                <td className="p-4 font-body text-sm text-gray-600 dark:text-gray-300">{row.action}</td>
                <td className="p-4 font-body text-sm font-bold text-gray-900 dark:text-emerald-400">{row.rev}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    row.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                    'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="p-4 font-body text-xs text-gray-400">{row.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AnalyticsDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-headline text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white"
          >
            Analytics Overview
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-body text-gray-500 mt-2 max-w-2xl text-sm md:text-base leading-relaxed"
          >
            Review your completely native, real-time metrics generated locally inside the application. No external database necessary.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <button className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Share Report
          </button>
          <button className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard title="Total Visitors" value="482,901" change={12.5} isPositive={true} icon={Users} delay={0.1} />
        <MetricCard title="Engaged Sessions" value="234,092" change={8.2} isPositive={true} icon={Activity} delay={0.2} />
        <MetricCard title="Avg Time on Page" value="4m 32s" change={2.1} isPositive={false} icon={Clock} delay={0.3} />
        <MetricCard title="Conversion Rate" value="4.91%" change={1.2} isPositive={true} icon={Zap} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficMockChart />
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white shadow-xl shadow-emerald-500/20 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="p-3 bg-white/10 w-fit rounded-xl backdrop-blur-md mb-6 inline-flex border border-white/10">
              <Zap size={24} className="text-emerald-300" />
            </div>
            <h3 className="font-headline text-2xl font-black mb-2 leading-tight">Pro Studio Mode Activated</h3>
            <p className="font-body text-emerald-100 text-sm leading-relaxed max-w-xs">
              You are currently viewing the local environment with mocked analytics. Your actual DraftDock database remains completely secure and untouched.
            </p>
          </div>
          
          <div className="mt-8">
            <p className="text-[10px] font-black tracking-widest uppercase text-emerald-200/70 mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_10px_rgba(110,231,183,1)]" />
              <span className="font-bold text-sm tracking-wide">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      <DataTableMock />
      
      {/* Spacer to simulate scrolling area for huge dashboards */}
      <div className="h-[20vh]" />
    </div>
  );
};

export default AnalyticsDashboard;
