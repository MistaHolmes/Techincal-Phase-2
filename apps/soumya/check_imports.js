import * as lucide from 'lucide-react';
const sidebar = [ 'LayoutDashboard', 'BarChart3', 'Users', 'Settings', 'HelpCircle', 'ChevronRight', 'LogOut', 'Bell', 'Search', 'Menu', 'X', 'Database', 'Globe', 'PieChart', 'Activity', 'Zap'];
const dashboard = ['ArrowUpRight', 'ArrowDownRight', 'Activity', 'Users', 'Clock', 'MousePointerClick', 'Filter', 'Download', 'MoreHorizontal'];

const all = [...sidebar, ...dashboard];
const missing = all.filter(name => !lucide[name]);
console.log("Missing icons:", missing);
