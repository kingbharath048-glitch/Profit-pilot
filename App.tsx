
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3,
  IndianRupee, 
  Target,
  PieChart as PieChartIcon,
  Calendar,
  X,
  ChevronLeft,
  ShoppingCart,
  Receipt,
  FileText,
  Save,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Product, DailyLog } from './types';
import { StatCard } from './components/StatCard';

const STORAGE_KEY = 'profitpilot_products_v1';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'UI Kit Pro',
    category: 'Asset',
    price: 3999,
    logs: [
      { id: 'l1', date: '2023-10-25', salesCount: 4, adSpend: 2000, miscExpenses: 0 },
      { id: 'l2', date: '2023-10-26', salesCount: 3, adSpend: 1500, miscExpenses: 200 },
      { id: 'l3', date: '2023-10-27', salesCount: 5, adSpend: 3000, miscExpenses: 0 },
    ],
    notes: 'Primary strategy: Target design agencies on LinkedIn.\nNext steps:\n- Update documentation\n- Launch v2.0 in December'
  },
  {
    id: '2',
    name: 'SaaS Starter Kit',
    category: 'SaaS',
    price: 7999,
    logs: [
      { id: 'l4', date: '2023-10-25', salesCount: 3, adSpend: 5000, miscExpenses: 500 },
      { id: 'l5', date: '2023-10-26', salesCount: 2, adSpend: 4500, miscExpenses: 0 },
      { id: 'l6', date: '2023-10-27', salesCount: 4, adSpend: 6000, miscExpenses: 100 },
    ],
    notes: 'Retention is key. Focus on onboarding flow improvement.'
  }
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load products from local storage", e);
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products'>('dashboard');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Define newProductState before it is used in handleAddProduct
  const [newProductState, setNewProductState] = useState<Partial<Product>>({
    name: '',
    category: 'SaaS',
    price: 0
  });

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    salesCount: 0,
    adSpend: 0,
    miscExpenses: 0
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const aggregateMetrics = useMemo(() => {
    let grossRevenue = 0;
    let totalExpenses = 0;

    products.forEach(p => {
      p.logs.forEach(log => {
        grossRevenue += (log.salesCount * p.price);
        totalExpenses += log.adSpend + (log.miscExpenses || 0);
      });
    });

    const netProfit = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

    return { grossRevenue, netProfit, profitMargin, roi };
  }, [products]);

  const productTotals = useMemo(() => {
    return products.map(p => {
      const totalSalesCount = p.logs.reduce((sum, l) => sum + l.salesCount, 0);
      const totalRevenue = totalSalesCount * p.price;
      const totalAdSpend = p.logs.reduce((sum, l) => sum + l.adSpend, 0);
      const totalMiscExpenses = p.logs.reduce((sum, l) => sum + (l.miscExpenses || 0), 0);
      const totalExpenses = totalAdSpend + totalMiscExpenses;
      return {
        ...p,
        totalSalesCount,
        totalRevenue,
        totalAdSpend,
        totalMiscExpenses,
        netProfit: totalRevenue - totalExpenses
      };
    });
  }, [products]);

  const chartData = useMemo(() => {
    return productTotals.map(p => ({
      name: p.name,
      profit: p.netProfit,
      revenue: p.totalRevenue,
      salesCount: p.totalSalesCount
    }));
  }, [productTotals]);

  const detailData = useMemo(() => {
    if (!viewingProduct) return null;
    const totalSalesCount = viewingProduct.logs.reduce((sum, l) => sum + l.salesCount, 0);
    const totalRevenue = totalSalesCount * viewingProduct.price;
    const totalAdSpend = viewingProduct.logs.reduce((sum, l) => sum + l.adSpend, 0);
    const totalMiscExpenses = viewingProduct.logs.reduce((sum, l) => sum + (l.miscExpenses || 0), 0);
    const totalExpenses = totalAdSpend + totalMiscExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const totalRoi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;
    
    const pieData = [
      { name: 'Ad Spend', value: totalAdSpend, color: '#ef4444' },
      { name: 'Misc Expenses', value: totalMiscExpenses, color: '#f59e0b' },
      { name: 'Net Profit', value: Math.max(0, netProfit), color: '#10b981' }
    ];

    const sortedLogs = [...viewingProduct.logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(l => {
      const rev = l.salesCount * viewingProduct.price;
      const totalDailyExpenses = l.adSpend + (l.miscExpenses || 0);
      const profit = rev - totalDailyExpenses;
      const roi = totalDailyExpenses > 0 ? (profit / totalDailyExpenses) * 100 : 0;
      return {
        ...l,
        revenue: rev,
        profit: profit,
        roi: roi
      };
    });

    return { totalSalesCount, totalRevenue, totalAdSpend, totalMiscExpenses, netProfit, totalRoi, pieData, sortedLogs };
  }, [viewingProduct]);

  const handleNoteChange = (text: string) => {
    if (!viewingProduct) return;
    const updatedProduct = { ...viewingProduct, notes: text };
    setProducts(prev => prev.map(p => p.id === viewingProduct.id ? updatedProduct : p));
    setViewingProduct(updatedProduct);
    
    // Simple autosave notification
    setIsSavedNotify(true);
    const timer = setTimeout(() => setIsSavedNotify(false), 2000);
    return () => clearTimeout(timer);
  };

  // Fixed: Use correct variable names newProductState and setNewProductState
  const handleAddProduct = () => {
    if (newProductState.name) {
      const productToAdd: Product = {
        id: Date.now().toString(),
        name: newProductState.name,
        category: (newProductState.category as Product['category']) || 'SaaS',
        price: newProductState.price || 0,
        logs: [],
        notes: ''
      };
      setProducts(prev => [...prev, productToAdd]);
      setIsModalOpen(false);
      setNewProductState({ name: '', category: 'SaaS', price: 0 });
    }
  };

  const handleEditProduct = () => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      setIsEditModalOpen(false);
      setEditingProduct(null);
      if (viewingProduct?.id === editingProduct.id) {
        setViewingProduct(editingProduct);
      }
    }
  };

  const handleAddLog = () => {
    if (selectedProductId) {
      const logEntry: DailyLog = {
        id: Date.now().toString(),
        ...newLog
      };
      setProducts(prev => prev.map(p => {
        if (p.id === selectedProductId) {
          const updatedP = { ...p, logs: [logEntry, ...p.logs] };
          if (viewingProduct?.id === p.id) setViewingProduct(updatedP);
          return updatedP;
        }
        return p;
      }));
      setIsLogModalOpen(false);
      setNewLog({ date: new Date().toISOString().split('T')[0], salesCount: 0, adSpend: 0, miscExpenses: 0 });
    }
  };

  const handleUpdateLog = () => {
    if (viewingProduct && editingLog) {
      const updatedLogs = viewingProduct.logs.map(l => l.id === editingLog.id ? editingLog : l);
      const updatedProduct = { ...viewingProduct, logs: updatedLogs };
      setProducts(prev => prev.map(p => p.id === viewingProduct.id ? updatedProduct : p));
      setViewingProduct(updatedProduct);
      setEditingLog(null);
    }
  };

  const removeLog = (e: React.MouseEvent, logId: string) => {
    e.stopPropagation();
    if (viewingProduct && confirm('Remove this daily entry?')) {
      const updatedLogs = viewingProduct.logs.filter(l => l.id !== logId);
      const updatedProduct = { ...viewingProduct, logs: updatedLogs };
      setProducts(prev => prev.map(p => p.id === viewingProduct.id ? updatedProduct : p));
      setViewingProduct(updatedProduct);
    }
  };

  const removeProduct = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this product and all its logs?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (viewingProduct?.id === id) setViewingProduct(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase italic">ProfitPilot</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setViewingProduct(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-semibold">Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab('products'); setViewingProduct(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'products' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package size={20} />
            <span className="font-semibold">Inventory</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {!viewingProduct ? (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  {activeTab === 'dashboard' ? 'Overview' : 'Product Portfolio'}
                </h2>
                <p className="text-slate-500 mt-1">
                  Advanced unit economics tracking for digital entrepreneurs.
                </p>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md shadow-indigo-100"
              >
                <Plus size={18} />
                Add Product
              </button>
            </header>

            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Lifetime Revenue" value={formatCurrency(aggregateMetrics.grossRevenue)} icon={<IndianRupee size={20} />} color="indigo" />
                  <StatCard label="Lifetime Profit" value={formatCurrency(aggregateMetrics.netProfit)} icon={<TrendingUp size={20} />} color="emerald" />
                  <StatCard label="Avg Margin" value={`${aggregateMetrics.profitMargin.toFixed(1)}%`} icon={<PieChartIcon size={20} />} color="amber" />
                  <StatCard label="Avg ROI" value={`${aggregateMetrics.roi.toFixed(0)}%`} icon={<Target size={20} />} color="rose" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <TrendingUp size={20} className="text-indigo-600" />
                      Profitability per Product (₹)
                    </h4>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            formatter={(value: number) => [formatCurrency(value), 'Profit']}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                          />
                          <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <ShoppingCart size={20} className="text-indigo-600" />
                      Sales Volume Split (Units)
                    </h4>
                    <div className="h-64 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="salesCount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value} units`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {chartData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                            <span className="text-slate-600 truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-900">{item.salesCount} Units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="overflow-x-auto bg-white rounded-3xl shadow-sm border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Unit Price</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Total Sales (Units)</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productTotals.map(product => (
                        <tr 
                          key={product.id} 
                          className="hover:bg-indigo-50/30 cursor-pointer transition-colors border-b border-slate-50 last:border-none group"
                          onClick={() => setViewingProduct(product)}
                        >
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{product.name}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">{product.category}</div>
                          </td>
                          <td className="px-8 py-6 text-slate-600 font-medium">{formatCurrency(product.price)}</td>
                          <td className="px-8 py-6 text-slate-600 font-medium">{product.totalSalesCount} units</td>
                          <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProductId(product.id);
                                  setIsLogModalOpen(true);
                                }}
                                className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                              >
                                <Calendar size={14} /> Log Units
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduct(product);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button 
                                onClick={(e) => removeProduct(e, product.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-6xl mx-auto pb-20">
            <button 
              onClick={() => setViewingProduct(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-6 transition-colors group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Inventory
            </button>

            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-full tracking-widest">
                    {viewingProduct.category}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">Unit-Based Tracking</span>
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2">{viewingProduct.name}</h2>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unit Price</span>
                    <span className="text-xl font-bold text-indigo-600">{formatCurrency(viewingProduct.price)}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Units Sold</span>
                    <span className="text-xl font-bold text-slate-900">{detailData?.totalSalesCount || 0}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Revenue</span>
                    <span className="text-xl font-bold text-emerald-600">{formatCurrency(detailData?.totalRevenue || 0)}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Ad Spend</span>
                    <span className="text-xl font-bold text-rose-600">{formatCurrency(detailData?.totalAdSpend || 0)}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Misc Exp</span>
                    <span className="text-xl font-bold text-amber-600">{formatCurrency(detailData?.totalMiscExpenses || 0)}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Net Profit</span>
                    <span className={`text-xl font-bold ${(detailData?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(detailData?.netProfit || 0)}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total ROI %</span>
                    <span className={`text-xl font-bold ${detailData && detailData.totalRoi >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {detailData?.totalRoi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedProductId(viewingProduct.id);
                    setIsLogModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Plus size={18} /> New Sales Log
                </button>
                <button 
                  onClick={(e) => removeProduct(e, viewingProduct.id)}
                  className="p-3 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-2xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-wide">
                  <PieChartIcon size={20} className="text-indigo-600" />
                  Unit Economics Breakdown
                </h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={detailData?.pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        stroke="none"
                      >
                        {detailData?.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-wide">
                  <TrendingUp size={20} className="text-indigo-600" />
                  Daily Revenue vs Total Expenses
                </h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detailData?.sortedLogs}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 10}}
                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1' }} name="Daily Revenue" />
                      <Line type="monotone" dataKey="adSpend" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2, fill: '#ef4444' }} name="Ad Spend" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-x-auto mb-10">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center sticky left-0">
                <h4 className="text-lg font-bold text-slate-800">Sales Count History</h4>
                <span className="text-slate-400 text-sm font-medium">{viewingProduct.logs.length} entries recorded</span>
              </div>
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Units</th>
                    <th className="px-8 py-4">Revenue</th>
                    <th className="px-8 py-4">Ad Spend</th>
                    <th className="px-8 py-4">Misc Exp</th>
                    <th className="px-8 py-4 font-bold text-slate-600">Net Profit</th>
                    <th className="px-8 py-4">ROI %</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData?.sortedLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 last:border-none group hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">
                          {new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {editingLog?.id === log.id ? (
                          <input 
                            type="number"
                            className="w-24 px-3 py-1.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={editingLog.salesCount}
                            onChange={(e) => setEditingLog({ ...editingLog, salesCount: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className="font-bold text-slate-900">{log.salesCount}</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-medium">
                        {formatCurrency(log.revenue)}
                      </td>
                      <td className="px-8 py-5">
                        {editingLog?.id === log.id ? (
                          <input 
                            type="number"
                            className="w-32 px-3 py-1.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={editingLog.adSpend}
                            onChange={(e) => setEditingLog({ ...editingLog, adSpend: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className="font-medium text-rose-600">{formatCurrency(log.adSpend)}</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        {editingLog?.id === log.id ? (
                          <input 
                            type="number"
                            className="w-32 px-3 py-1.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={editingLog.miscExpenses || 0}
                            onChange={(e) => setEditingLog({ ...editingLog, miscExpenses: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className="font-medium text-amber-600">{formatCurrency(log.miscExpenses || 0)}</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`font-bold ${log.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(log.profit)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`font-bold ${log.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                          {editingLog?.id === log.id ? (
                            <div className="flex gap-2 w-full justify-end">
                              <button onClick={handleUpdateLog} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap">Save</button>
                              <button onClick={() => setEditingLog(null)} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors whitespace-nowrap">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => setEditingLog(log)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={16} /></button>
                              <button onClick={(e) => removeLog(e, log.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notepad / Scratchpad for the product */}
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 px-8 py-4 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                    <FileText size={20} />
                    <h3 className="text-lg font-bold tracking-tight">Strategy Scratchpad: {viewingProduct.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    {isSavedNotify && (
                      <span className="flex items-center gap-1 text-emerald-300 text-xs font-bold animate-in fade-in slide-in-from-right-2">
                        <CheckCircle2 size={14} /> Autosaved
                      </span>
                    )}
                    <Save size={20} className="text-indigo-200" />
                  </div>
                </div>
                
                <div className="relative p-8 bg-[#fef9c3] min-h-[400px] flex flex-col shadow-inner">
                  <div className="absolute inset-y-0 left-12 w-px bg-rose-200"></div>
                  <div className="absolute inset-y-0 left-[12.25rem] w-px bg-rose-200 opacity-20 hidden md:block"></div>
                  
                  <textarea
                    value={viewingProduct.notes || ''}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    className="w-full flex-1 bg-transparent border-none outline-none resize-none font-medium text-slate-800 leading-[2rem] text-lg pl-8 z-10"
                    style={{
                      backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)',
                      backgroundSize: '100% 2rem',
                      fontFamily: 'inherit'
                    }}
                    placeholder={`Map out growth tactics for ${viewingProduct.name}...`}
                  />
                  
                  <div className="mt-8 pt-4 border-t border-slate-300/50 text-slate-400 text-xs italic flex justify-between">
                    <span>Product-specific blueprint</span>
                    <span>Persistent across sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sales Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Log Daily Sales</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    value={newLog.date}
                    onChange={e => setNewLog({...newLog, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sales Count (Units)</label>
                <div className="relative">
                  <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-white text-slate-900"
                    value={newLog.salesCount}
                    onChange={e => setNewLog({...newLog, salesCount: parseInt(e.target.value) || 0})}
                    placeholder="Number of units sold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">Revenue = units * product price</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ad Spend (₹)</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                      value={newLog.adSpend}
                      onChange={e => setNewLog({...newLog, adSpend: parseFloat(e.target.value) || 0})}
                      placeholder="Daily ads cost"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Misc Expenses (₹)</label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                      value={newLog.miscExpenses}
                      onChange={e => setNewLog({...newLog, miscExpenses: parseFloat(e.target.value) || 0})}
                      placeholder="Other daily costs"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setIsLogModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAddLog} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-colors">Save Log Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 italic">New Digital Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white text-slate-900"
                  value={newProductState.name}
                  onChange={e => setNewProductState({...newProductState, name: e.target.value})}
                  placeholder="e.g. Masterclass course"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    value={newProductState.category}
                    onChange={e => setNewProductState({...newProductState, category: e.target.value as any})}
                  >
                    <option>SaaS</option>
                    <option>E-book</option>
                    <option>Course</option>
                    <option>Asset</option>
                    <option>Newsletter</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initial Unit Price (₹)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    value={newProductState.price}
                    onChange={e => setNewProductState({...newProductState, price: parseFloat(e.target.value) || 0})}
                    placeholder="e.g. 999"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">Log daily units sold, ad spend, and misc expenses in the Inventory detail view.</p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAddProduct} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors">Create Product</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Edit Product</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                  >
                    <option>SaaS</option>
                    <option>E-book</option>
                    <option>Course</option>
                    <option>Asset</option>
                    <option>Newsletter</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unit Price (₹)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleEditProduct} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition-colors">Update Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
