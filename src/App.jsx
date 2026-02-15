import './index.css'
import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, Calendar, DollarSign, PieChart, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function BudgetSimulator() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const loadFromStorage = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  };

  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const [userInfo, setUserInfo] = useState(() => loadFromStorage('userInfo', null));
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!loadFromStorage('userInfo', null));

  const resetAllData = () => {
    if (window.confirm('本当に全てのデータを削除しますか？この操作は取り消せません。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const [transactions, setTransactions] = useState(() => 
    loadFromStorage('transactions', [
      { id: 1, date: '2026-02-14', category: '食費', amount: -1200, type: 'expense', paymentMethod: 'credit', settled: false },
      { id: 2, date: '2026-02-13', category: '交通費', amount: -500, type: 'expense', paymentMethod: 'cash', settled: true },
      { id: 3, date: '2026-02-10', category: '給料', amount: 250000, type: 'income', paymentMethod: 'cash', settled: true },
    ])
  );

  const [assetData, setAssetData] = useState(() => 
    loadFromStorage('assetData', {
      savings: 500000,
      investments: 300000,
      nisa: 0
    })
  );

  const [monthlyHistory, setMonthlyHistory] = useState(() => 
    loadFromStorage('monthlyHistory', {})
  );

  const [lifeEvents, setLifeEvents] = useState(() =>
    loadFromStorage('lifeEvents', [])
  );

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    type: 'expense',
    paymentMethod: 'credit'
  });

  const [simulationSettings, setSimulationSettings] = useState(() =>
    loadFromStorage('simulationSettings', {
      targetAmount: 10000000,
      years: 10,
      monthlyInvestment: 30000,
      returnRate: 5,
      useNisa: true,
      useLumpSum: false,
      lumpSumAmount: 500000,
      lumpSumFrequency: 2,
      lumpSumMonths: [6, 12]
    })
  );

  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false);
  const [closeMonthData, setCloseMonthData] = useState({ savedAmount: 0, investAmount: 0 });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showLifeEventModal, setShowLifeEventModal] = useState(false);
  const [editingLifeEvent, setEditingLifeEvent] = useState(null);

  useEffect(() => {
    saveToStorage('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage('assetData', assetData);
  }, [assetData]);

  useEffect(() => {
    saveToStorage('monthlyHistory', monthlyHistory);
  }, [monthlyHistory]);

  useEffect(() => {
    saveToStorage('lifeEvents', lifeEvents);
  }, [lifeEvents]);

  useEffect(() => {
    if (userInfo) {
      saveToStorage('userInfo', userInfo);
    }
  }, [userInfo]);

  useEffect(() => {
    saveToStorage('simulationSettings', simulationSettings);
  }, [simulationSettings]);

  const categories = ['食費', '住居費', '光熱費', '通信費', '交通費', '娯楽費', '医療費', '教育費', '被服費', 'その他'];

  const calculateMonthlyBalance = (yearMonth) => {
    const monthTransactions = transactions.filter(t => 
      t.date.startsWith(yearMonth) && t.settled
    );
    
    const income = monthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = Math.abs(monthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    return {
      income,
      expense,
      balance: income - expense
    };
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentBalance = calculateMonthlyBalance(currentMonth);

  const unsettledCredit = transactions.filter(t => 
    t.paymentMethod === 'credit' && !t.settled && !t.isSettlement
  );

  const totalUnsettledCredit = Math.abs(
    unsettledCredit.reduce((sum, t) => sum + (t.amount < 0 ? t.amount : 0), 0)
  );

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) return;

    const amount = newTransaction.type === 'expense' 
      ? -Math.abs(Number(newTransaction.amount))
      : Math.abs(Number(newTransaction.amount));

    const transaction = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      category: newTransaction.category,
      amount: amount,
      type: newTransaction.type,
      paymentMethod: newTransaction.paymentMethod,
      settled: newTransaction.paymentMethod === 'cash',
      isSettlement: false
    };

    setTransactions([transaction, ...transactions]);
    setNewTransaction({ amount: '', category: '', type: 'expense', paymentMethod: 'credit' });
  };

  const settleCredit = () => {
    const today = new Date();
    const settlementDate = new Date(today.getFullYear(), today.getMonth(), 26);
    if (today.getDate() > 26) {
      settlementDate.setMonth(settlementDate.getMonth() + 1);
    }

    const settlementTransaction = {
      id: Date.now(),
      date: settlementDate.toISOString().slice(0, 10),
      category: 'クレジット引き落とし',
      amount: -totalUnsettledCredit,
      type: 'expense',
      paymentMethod: 'cash',
      settled: false,
      isSettlement: true
    };

    const updatedTransactions = transactions.map(t =>
      t.paymentMethod === 'credit' && !t.settled && !t.isSettlement
        ? { ...t, settled: true }
        : t
    );

    setTransactions([settlementTransaction, ...updatedTransactions]);
  };

  const closeMonth = () => {
    const balance = currentBalance.balance;
    const investAmount = closeMonthData.investAmount;
    const savedAmount = balance - investAmount;

    setAssetData(prev => ({
      savings: prev.savings + savedAmount,
      investments: prev.investments + investAmount,
      nisa: prev.nisa
    }));

    setMonthlyHistory(prev => ({
      ...prev,
      [currentMonth]: {
        balance,
        savedAmount,
        investAmount
      }
    }));

    setShowCloseMonthModal(false);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setDeleteConfirmId(null);
  };

  const updateTransaction = (updatedTransaction) => {
    setTransactions(transactions.map(t => 
      t.id === updatedTransaction.id ? updatedTransaction : t
    ));
    setEditingTransaction(null);
  };

  const calculateCategoryExpenses = () => {
    const currentMonthTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth) && t.amount < 0 && t.settled
    );

    const categoryTotals = currentMonthTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculateMonthlyComparison = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    const prevMonth = date.toISOString().slice(0, 7);
    
    const current = calculateMonthlyBalance(currentMonth);
    const previous = calculateMonthlyBalance(prevMonth);
    
    return {
      expense: {
        current: current.expense,
        previous: previous.expense,
        diff: current.expense - previous.expense,
        diffPercent: previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense * 100) : 0
      },
      balance: {
        current: current.balance,
        previous: previous.balance,
        diff: current.balance - previous.balance
      }
    };
  };

  const getDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).getDay();
  };

  const getTransactionsForDay = (yearMonth, day) => {
    const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
    return transactions.filter(t => t.date === dateStr);
  };

  const getDayBalance = (yearMonth, day) => {
    const dayTransactions = getTransactionsForDay(yearMonth, day);
    const income = dayTransactions.filter(t => t.amount > 0 && t.settled).reduce((sum, t) => sum + t.amount, 0);
    const expense = Math.abs(dayTransactions.filter(t => t.amount < 0 && t.settled).reduce((sum, t) => sum + t.amount, 0));
    return { income, expense, balance: income - expense };
  };

  const getLast6MonthsTrend = () => {
    const trends = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yearMonth = date.toISOString().slice(0, 7);
      const balance = calculateMonthlyBalance(yearMonth);
      
      trends.push({
        month: date.toLocaleDateString('ja-JP', { month: 'short' }),
        balance: balance.balance
      });
    }
    
    return trends;
  };
  // 新NISA制度対応のシミュレーション計算
  const calculateSimulation = () => {
    const { targetAmount, years, monthlyInvestment, returnRate, useNisa, useLumpSum, lumpSumAmount, lumpSumFrequency, lumpSumMonths } = simulationSettings;
    const monthlyRate = returnRate / 100 / 12;

    let results = [];
    let regularInvestment = assetData.investments; // 通常の投資（課税）
    let nisaInvestment = assetData.nisa || 0; // NISA投資（非課税）
    let savings = assetData.savings;
    
    // NISA年間限度額
    const NISA_TSUMITATE_LIMIT = 3600000; // つみたて投資枠：年360万円
    const NISA_GROWTH_LIMIT = 2400000; // 成長投資枠：年240万円
    const NISA_TOTAL_LIMIT = 18000000; // 生涯投資枠：1800万円

    let nisaUsedThisYear = 0;
    let nisaTotalUsed = nisaInvestment;

    for (let year = 1; year <= years; year++) {
      nisaUsedThisYear = 0;
      let yearlyTaxSaved = 0;
      let yearlyProfit = 0;

      for (let month = 1; month <= 12; month++) {
        // 月次積立投資
        if (monthlyInvestment > 0) {
          if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < NISA_TSUMITATE_LIMIT) {
            const nisaSpace = Math.min(
              monthlyInvestment,
              NISA_TOTAL_LIMIT - nisaTotalUsed,
              NISA_TSUMITATE_LIMIT - nisaUsedThisYear
            );
            nisaInvestment += nisaSpace;
            nisaTotalUsed += nisaSpace;
            nisaUsedThisYear += nisaSpace;

            const remainingInvestment = monthlyInvestment - nisaSpace;
            if (remainingInvestment > 0) {
              regularInvestment += remainingInvestment;
            }
          } else {
            regularInvestment += monthlyInvestment;
          }
        }

        // 成長投資（一括投資）
        if (useLumpSum && lumpSumMonths.includes(month)) {
          if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < (NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT)) {
            const availableGrowth = NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT - nisaUsedThisYear;
            const nisaSpace = Math.min(
              lumpSumAmount,
              NISA_TOTAL_LIMIT - nisaTotalUsed,
              availableGrowth
            );
            nisaInvestment += nisaSpace;
            nisaTotalUsed += nisaSpace;
            nisaUsedThisYear += nisaSpace;

            const remainingLumpSum = lumpSumAmount - nisaSpace;
            if (remainingLumpSum > 0) {
              regularInvestment += remainingLumpSum;
            }
          } else {
            regularInvestment += lumpSumAmount;
          }
        }

        // 月次運用益
        const nisaMonthlyProfit = nisaInvestment * monthlyRate;
        const regularMonthlyProfit = regularInvestment * monthlyRate;
        
        nisaInvestment += nisaMonthlyProfit;
        regularInvestment += regularMonthlyProfit;

        yearlyProfit += nisaMonthlyProfit + regularMonthlyProfit;

        // 通常投資の税金計算（利益の20.315%）
        const regularTax = regularMonthlyProfit * 0.20315;
        yearlyTaxSaved += regularTax;

        // ライフイベントの適用
        const currentDate = new Date();
        currentDate.setFullYear(currentDate.getFullYear() + year - 1);
        currentDate.setMonth(month - 1);
        const yearMonth = currentDate.toISOString().slice(0, 7);
        
        const eventsThisMonth = lifeEvents.filter(e => e.date === yearMonth);
        eventsThisMonth.forEach(event => {
          if (savings >= event.amount) {
            savings -= event.amount;
          } else {
            const fromSavings = savings;
            const remaining = event.amount - fromSavings;
            savings = 0;
            if (regularInvestment >= remaining) {
              regularInvestment -= remaining;
            } else {
              regularInvestment = 0;
            }
          }
        });
      }

      const totalValue = savings + regularInvestment + nisaInvestment;

      results.push({
        year,
        totalValue: Math.round(totalValue),
        savings: Math.round(savings),
        regularInvestment: Math.round(regularInvestment),
        nisaInvestment: Math.round(nisaInvestment),
        nisaUsed: Math.round(nisaTotalUsed),
        taxSaved: Math.round(yearlyTaxSaved * year),
        yearlyProfit: Math.round(yearlyProfit),
        events: lifeEvents.filter(e => {
          const eventYear = new Date(e.date + '-01').getFullYear();
          const currentYear = new Date().getFullYear() + year;
          return eventYear === currentYear;
        })
      });
    }

    return results;
  };

  const simulationResults = calculateSimulation();
  const finalValue = simulationResults[simulationResults.length - 1]?.totalValue || 0;
  const achievement = Math.min((finalValue / simulationSettings.targetAmount) * 100, 100);
  const totalTaxSaved = simulationResults[simulationResults.length - 1]?.taxSaved || 0;

  // グラフ用データ整形
  const chartData = simulationResults.map(result => ({
    年: `${result.year}年後`,
    貯金: result.savings,
    課税口座: result.regularInvestment,
    NISA: result.nisaInvestment,
    合計: result.totalValue
  }));

  const lifeEventTemplates = [
    { name: '結婚', estimatedAmount: 3000000, icon: '💍', type: 'expense' },
    { name: '出産', estimatedAmount: 500000, icon: '👶', type: 'expense' },
    { name: '住宅購入', estimatedAmount: 30000000, icon: '🏠', type: 'expense' },
    { name: '車購入', estimatedAmount: 2000000, icon: '🚗', type: 'expense' },
    { name: '進学', estimatedAmount: 2000000, icon: '🎓', type: 'expense' },
    { name: '海外旅行', estimatedAmount: 500000, icon: '✈️', type: 'expense' },
    { name: '退職', estimatedAmount: 0, icon: '🎉', type: 'milestone' },
    { name: 'カスタム', estimatedAmount: 0, icon: '📌', type: 'expense' }
  ];

  const eventIcons = ['💍', '👶', '🏠', '🚗', '🎓', '✈️', '💰', '🎉', '📌', '🎊', '🎁', '⭐'];

  const addOrUpdateLifeEvent = (eventData) => {
    if (editingLifeEvent && editingLifeEvent.id) {
      setLifeEvents(lifeEvents.map(e => e.id === editingLifeEvent.id ? { ...eventData, id: e.id } : e));
    } else {
      setLifeEvents([...lifeEvents, { ...eventData, id: Date.now() }]);
    }
    setShowLifeEventModal(false);
    setEditingLifeEvent(null);
  };

  const deleteLifeEvent = (id) => {
    setLifeEvents(lifeEvents.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                マネープランナー
                {userInfo?.name && <span className="text-lg ml-2">- {userInfo.name}さん</span>}
              </h1>
              <p className="text-sm text-indigo-100">
                {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* ホームタブ */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* 月次サマリー */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-md p-4">
                <p className="text-xs text-green-100 mb-1">収入</p>
                <p className="text-xl font-bold text-white">¥{currentBalance.income.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl shadow-md p-4">
                <p className="text-xs text-red-100 mb-1">支出</p>
                <p className="text-xl font-bold text-white">¥{currentBalance.expense.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-md p-4">
                <p className="text-xs text-blue-100 mb-1">収支</p>
                <p className="text-xl font-bold text-white">
                  {currentBalance.balance >= 0 ? '+' : ''}¥{currentBalance.balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 資産カード */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-6">
              <p className="text-sm text-indigo-100 mb-2">総資産</p>
              <p className="text-4xl font-bold text-white mb-4">
                ¥{(assetData.savings + assetData.investments + (assetData.nisa || 0)).toLocaleString()}
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-indigo-100">貯金</p>
                  <p className="text-lg font-bold text-white">¥{assetData.savings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-purple-100">投資</p>
                  <p className="text-lg font-bold text-white">¥{assetData.investments.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-pink-100">NISA</p>
                  <p className="text-lg font-bold text-white">¥{(assetData.nisa || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* クレジット未確定 */}
            {unsettledCredit.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-orange-800 font-bold">💳 未確定のクレジット</p>
                    <p className="text-2xl font-bold text-orange-600">¥{totalUnsettledCredit.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={settleCredit}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600"
                  >
                    確定する
                  </button>
                </div>
              </div>
            )}

            {/* 取引入力フォーム */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PlusCircle size={20} className="text-indigo-600" />
                取引を追加
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      newTransaction.type === 'expense'
                        ? 'bg-red-500 text-white scale-105 shadow-lg'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    支出
                  </button>
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      newTransaction.type === 'income'
                        ? 'bg-green-500 text-white scale-105 shadow-lg'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    収入
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: 'credit' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      newTransaction.paymentMethod === 'credit'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    💳 クレジット
                  </button>
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: 'cash' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      newTransaction.paymentMethod === 'cash'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    💵 現金
                  </button>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="金額"
                  value={newTransaction.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewTransaction({ ...newTransaction, amount: value });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-indigo-500 focus:outline-none"
                />

                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">カテゴリを選択</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={addTransaction}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:opacity-90"
                >
                  追加する
                </button>
              </div>
            </div>
            {/* カテゴリ別支出 */}
            {calculateCategoryExpenses().length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <PieChart size={20} className="text-indigo-600" />
                  今月の支出内訳
                </h2>
                
                <div className="flex justify-center mb-6">
                  <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                    {(() => {
                      const categories = calculateCategoryExpenses();
                      const total = categories.reduce((sum, c) => sum + c.amount, 0);
                      const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
                      let currentAngle = 0;
                      
                      return categories.map((cat, index) => {
                        const percentage = cat.amount / total;
                        const angle = percentage * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        
                        const x1 = 100 + 80 * Math.cos(startRad);
                        const y1 = 100 + 80 * Math.sin(startRad);
                        const x2 = 100 + 80 * Math.cos(endRad);
                        const y2 = 100 + 80 * Math.sin(endRad);
                        
                        const largeArc = angle > 180 ? 1 : 0;
                        const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
                        
                        currentAngle = endAngle;
                        
                        return (
                          <path
                            key={cat.category}
                            d={path}
                            fill={colors[index % colors.length]}
                            opacity="0.9"
                          />
                        );
                      });
                    })()}
                    <circle cx="100" cy="100" r="50" fill="white" />
                  </svg>
                </div>

                <div className="space-y-2">
                  {calculateCategoryExpenses().map((item, index) => {
                    const total = calculateCategoryExpenses().reduce((sum, i) => sum + i.amount, 0);
                    const percentage = (item.amount / total * 100).toFixed(1);
                    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-cyan-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
                    return (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                          <span className="text-sm text-gray-700 font-medium">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{percentage}%</span>
                          <span className="text-sm text-gray-900 font-bold min-w-[80px] text-right">
                            ¥{item.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 前月比較 */}
            {calculateMonthlyComparison().expense.previous > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">前月との比較</h2>
                <div className="space-y-3">
                  {(() => {
                    const comparison = calculateMonthlyComparison();
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">支出</span>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">¥{comparison.expense.current.toLocaleString()}</p>
                            <p className={`text-sm ${comparison.expense.diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {comparison.expense.diff > 0 ? '+' : ''}¥{comparison.expense.diff.toLocaleString()} 
                              ({comparison.expense.diffPercent.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">収支</span>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              {comparison.balance.current >= 0 ? '+' : ''}¥{comparison.balance.current.toLocaleString()}
                            </p>
                            <p className={`text-sm ${comparison.balance.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparison.balance.diff >= 0 ? '+' : ''}¥{comparison.balance.diff.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 最近の取引 */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">最近の取引</h2>
              <div className="space-y-2">
                {transactions.slice(0, 10).map(t => (
                  <div
                    key={t.id}
                    onClick={() => setEditingTransaction(t)}
                    className="flex items-center justify-between p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors group relative"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">{t.paymentMethod === 'credit' ? '💳' : '💵'}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{t.category}</p>
                        <p className="text-xs text-gray-500">{t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!t.settled && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">未確定</span>}
                      <p className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                      </p>
                      {deleteConfirmId === t.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs"
                          >
                            削除
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
                          >
                            戻る
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(t.id); }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!monthlyHistory[currentMonth] && currentBalance.balance > 0 && (
                <button
                  onClick={() => {
                    setCloseMonthData({ savedAmount: currentBalance.balance, investAmount: 0 });
                    setShowCloseMonthModal(true);
                  }}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl"
                >
                  今月を締める
                </button>
              )}
            </div>
          </div>
        )}

        {/* カレンダータブ */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const date = new Date(selectedMonth + '-01');
                    date.setMonth(date.getMonth() - 1);
                    setSelectedMonth(date.toISOString().slice(0, 7));
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ◀
                </button>
                <h2 className="text-lg font-bold text-gray-800">
                  {new Date(selectedMonth + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                </h2>
                <button
                  onClick={() => {
                    const date = new Date(selectedMonth + '-01');
                    date.setMonth(date.getMonth() + 1);
                    const nextMonth = date.toISOString().slice(0, 7);
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    if (nextMonth <= currentMonth) {
                      setSelectedMonth(nextMonth);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ▶
                </button>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                    <div key={day} className={`text-center text-xs font-bold py-2 ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-600'}`}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {[...Array(getFirstDayOfMonth(selectedMonth))].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}
                  
                  {[...Array(getDaysInMonth(selectedMonth))].map((_, i) => {
                    const day = i + 1;
                    const dayTransactions = getTransactionsForDay(selectedMonth, day);
                    const dayBalance = getDayBalance(selectedMonth, day);
                    const hasTransactions = dayTransactions.length > 0;
                    const isToday = selectedMonth === new Date().toISOString().slice(0, 7) && day === new Date().getDate();
                    
                    return (
                      <div
                        key={day}
                        className={`aspect-square border rounded-lg p-1 ${
                          isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                        } ${hasTransactions ? 'bg-blue-50' : 'bg-white'}`}
                      >
                        <div className={`text-xs font-semibold ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {day}
                        </div>
                        {hasTransactions && (
                          <div className="mt-0.5">
                            {dayBalance.income > 0 && (
                              <div className="text-[8px] text-green-600 leading-tight">+{(dayBalance.income / 1000).toFixed(0)}k</div>
                            )}
                            {dayBalance.expense > 0 && (
                              <div className="text-[8px] text-red-600 leading-tight">-{(dayBalance.expense / 1000).toFixed(0)}k</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">収入</div>
                    <div className="text-lg font-bold text-green-600">
                      ¥{calculateMonthlyBalance(selectedMonth).income.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">支出</div>
                    <div className="text-lg font-bold text-red-600">
                      ¥{calculateMonthlyBalance(selectedMonth).expense.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">収支</div>
                    <div className={`text-lg font-bold ${calculateMonthlyBalance(selectedMonth).balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {calculateMonthlyBalance(selectedMonth).balance >= 0 ? '+' : ''}¥{calculateMonthlyBalance(selectedMonth).balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 過去6ヶ月のトレンドグラフ */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">過去6ヶ月の推移</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={getLast6MonthsTrend()}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    formatter={(value) => `¥${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* シミュレーションタブ */}
        {activeTab === 'simulation' && (
          <div className="space-y-4">
            {/* 現在の資産 */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6">
              <p className="text-sm text-purple-100 mb-2">現在の資産</p>
              <p className="text-4xl font-bold text-white mb-4">
                ¥{(assetData.savings + assetData.investments + (assetData.nisa || 0)).toLocaleString()}
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-purple-100">貯金</p>
                  <p className="text-lg font-bold text-white">¥{assetData.savings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-indigo-100">投資</p>
                  <p className="text-lg font-bold text-white">¥{assetData.investments.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-pink-100">NISA</p>
                  <p className="text-lg font-bold text-white">¥{(assetData.nisa || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* シミュレーション設定 */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Target size={20} className="text-indigo-600" />
                シミュレーション設定
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目標金額: ¥{simulationSettings.targetAmount.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="1000000"
                    max="100000000"
                    step="1000000"
                    value={simulationSettings.targetAmount}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, targetAmount: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    運用期間: {simulationSettings.years}年
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={simulationSettings.years}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, years: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    月々の積立額: ¥{simulationSettings.monthlyInvestment.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="10000"
                    max="200000"
                    step="10000"
                    value={simulationSettings.monthlyInvestment}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, monthlyInvestment: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    想定利回り: {simulationSettings.returnRate}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={simulationSettings.returnRate}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, returnRate: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">※全世界株式インデックスの過去平均: 約5-7%</p>
                </div>

                {/* NISA設定 */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      新NISA制度を利用する
                    </label>
                    <button
                      onClick={() => setSimulationSettings({ ...simulationSettings, useNisa: !simulationSettings.useNisa })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        simulationSettings.useNisa ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          simulationSettings.useNisa ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {simulationSettings.useNisa && (
                    <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-800">
                      <p className="font-bold mb-1">🎯 新NISA制度</p>
                      <p>• つみたて投資枠: 年360万円まで非課税</p>
                      <p>• 成長投資枠: 年240万円まで非課税</p>
                      <p>• 生涯投資枠: 1,800万円</p>
                    </div>
                  )}
                </div>

                {/* 成長投資設定 */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      成長投資（一括投資）を追加
                    </label>
                    <button
                      onClick={() => setSimulationSettings({ ...simulationSettings, useLumpSum: !simulationSettings.useLumpSum })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        simulationSettings.useLumpSum ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          simulationSettings.useLumpSum ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {simulationSettings.useLumpSum && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          1回あたりの投資額: ¥{simulationSettings.lumpSumAmount.toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="100000"
                          max="2000000"
                          step="100000"
                          value={simulationSettings.lumpSumAmount}
                          onChange={(e) => setSimulationSettings({ ...simulationSettings, lumpSumAmount: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          投資タイミング（月を選択）
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                            <button
                              key={month}
                              onClick={() => {
                                const months = simulationSettings.lumpSumMonths || [];
                                const newMonths = months.includes(month)
                                  ? months.filter(m => m !== month)
                                  : [...months, month].sort((a, b) => a - b);
                                setSimulationSettings({ ...simulationSettings, lumpSumMonths: newMonths });
                              }}
                              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                (simulationSettings.lumpSumMonths || []).includes(month)
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {month}月
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          選択: {(simulationSettings.lumpSumMonths || []).length}回/年
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-800">
                        <p className="font-bold mb-1">💡 成長投資とは</p>
                        <p>ボーナスや臨時収入で年に数回、まとまった金額を投資する方法です。</p>
                        <p className="mt-1">年間合計: ¥{(simulationSettings.lumpSumAmount * (simulationSettings.lumpSumMonths?.length || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ライフイベント */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">ライフイベント</h2>
                <button
                  onClick={() => {
                    setEditingLifeEvent(null);
                    setShowLifeEventModal(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                >
                  + 追加
                </button>
              </div>

              {lifeEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">イベントを追加して、将来の計画を立てましょう</p>
              ) : (
                <div className="space-y-2">
                  {lifeEvents.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{event.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{event.name}</p>
                          <p className="text-xs text-gray-500">{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-red-600">¥{event.amount.toLocaleString()}</p>
                        <button
                          onClick={() => {
                            setEditingLifeEvent(event);
                            setShowLifeEventModal(true);
                          }}
                          className="text-indigo-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteLifeEvent(event.id)}
                          className="text-red-500"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* シミュレーション結果 */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {simulationSettings.years}年後の予測
              </h2>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-4">
                <p className="text-sm text-gray-600 mb-2">予想資産額</p>
                <p className="text-4xl font-bold text-green-600 mb-2">
                  ¥{finalValue.toLocaleString()}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                    style={{ width: `${achievement}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  目標達成率: {achievement.toFixed(1)}%
                </p>

                {simulationSettings.useNisa && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-sm text-green-700 font-bold">
                      💰 NISA節税効果: 約¥{totalTaxSaved.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      通常の課税口座と比較して、これだけ税金を節約できます
                    </p>
                  </div>
                )}
              </div>

              {achievement >= 100 ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center mb-4">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="font-bold text-green-800">目標達成可能！</p>
                </div>
              ) : (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-4">
                  <p className="font-bold text-orange-800 mb-2">💡 アドバイス</p>
                  <p className="text-sm text-orange-700">
                    目標達成には、月々の投資額を約
                    <span className="font-bold"> ¥{Math.ceil((simulationSettings.targetAmount - finalValue) / (simulationSettings.years * 12) / 1000) * 1000}</span>
                    円増やすことをおすすめします。
                  </p>
                </div>
              )}

              {/* 資産推移グラフ */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">資産推移グラフ</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNisa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="年" 
                      stroke="#6b7280" 
                      style={{ fontSize: '10px' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      style={{ fontSize: '10px' }}
                      tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value) => `¥${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="貯金" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="url(#colorSavings)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="課税口座" 
                      stackId="1"
                      stroke="#a855f7" 
                      fill="url(#colorInvest)" 
                    />
                    {simulationSettings.useNisa && (
                      <Area 
                        type="monotone" 
                        dataKey="NISA" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="url(#colorNisa)" 
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="合計" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 年ごとの詳細 */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800">年ごとの推移</h3>
                {simulationResults.map(result => (
                  <div key={result.year}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{result.year}年後</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-800">¥{result.totalValue.toLocaleString()}</span>
                        {simulationSettings.useNisa && (
                          <span className="text-xs text-green-600 ml-2">
                            (NISA: ¥{result.nisaInvestment.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${(result.totalValue / simulationSettings.targetAmount) * 100}%` }}
                      />
                    </div>
                    {result.events.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {result.events.map(event => (
                          <div key={event.id} className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{event.icon}</span>
                            <span>{event.name}</span>
                            <span className="text-red-600">-¥{event.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* オンボーディング（初回設定）モーダル */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💰</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                マネープランナーへ<br/>ようこそ！
              </h1>
              <p className="text-gray-600">
                まずは基本情報を入力しましょう
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前（ニックネーム）
                </label>
                <input
                  type="text"
                  placeholder="例：太郎"
                  value={userInfo?.name || ''}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年齢
                </label>
                <input
                  type="number"
                  placeholder="25"
                  value={userInfo?.age || ''}
                  onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在の貯金額
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="500000"
                  value={assetData.savings}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, savings: Number(value) });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  現在：¥{assetData.savings.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在の投資額（課税口座）
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="300000"
                  value={assetData.investments}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, investments: Number(value) });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  現在：¥{assetData.investments.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在のNISA投資額
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={assetData.nisa || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, nisa: Number(value) });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  現在：¥{(assetData.nisa || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!userInfo?.name || !userInfo?.age) {
                  alert('お名前と年齢を入力してください');
                  return;
                }
                setShowOnboarding(false);
              }}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:opacity-90"
            >
              始める
            </button>
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">設定</h2>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">ユーザー情報</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お名前
                  </label>
                  <input
                    type="text"
                    value={userInfo?.name || ''}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年齢
                  </label>
                  <input
                    type="number"
                    value={userInfo?.age || ''}
                    onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    貯金額
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={assetData.savings}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setAssetData({ ...assetData, savings: Number(value) });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ¥{assetData.savings.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    投資額（課税口座）
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={assetData.investments}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setAssetData({ ...assetData, investments: Number(value) });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ¥{assetData.investments.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NISA投資額
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={assetData.nisa || 0}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setAssetData({ ...assetData, nisa: Number(value) });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ¥{(assetData.nisa || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">データ管理</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    💾 データは自動的にこのブラウザに保存されています
                  </p>
                  <p className="text-xs text-blue-600">
                    取引数: {transactions.length}件<br/>
                    月次履歴: {Object.keys(monthlyHistory).length}ヶ月<br/>
                    ライフイベント: {lifeEvents.length}件
                  </p>
                </div>

                <button
                  onClick={resetAllData}
                  className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600"
                >
                  🗑️ 全てのデータを削除
                </button>
                <p className="text-xs text-gray-500 text-center">
                  ※この操作は取り消せません
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 月締めモーダル */}
      {showCloseMonthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">今月を締める</h2>
            <p className="text-gray-600 mb-4">
              今月の収支: <span className="font-bold text-indigo-600">¥{currentBalance.balance.toLocaleString()}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  投資に回す金額: ¥{closeMonthData.investAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max={currentBalance.balance}
                  step="1000"
                  value={closeMonthData.investAmount}
                  onChange={(e) => setCloseMonthData({
                    ...closeMonthData,
                    investAmount: Number(e.target.value),
                    savedAmount: currentBalance.balance - Number(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">貯金へ</span>
                  <span className="font-bold text-blue-600">¥{closeMonthData.savedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">投資へ</span>
                  <span className="font-bold text-purple-600">¥{closeMonthData.investAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseMonthModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold"
              >
                キャンセル
              </button>
              <button
                onClick={closeMonth}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 取引編集モーダル */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">取引を編集</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense', amount: -Math.abs(editingTransaction.amount) })}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    editingTransaction.type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income', amount: Math.abs(editingTransaction.amount) })}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    editingTransaction.type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  収入
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, paymentMethod: 'credit' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    editingTransaction.paymentMethod === 'credit' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  💳 クレジット
                </button>
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, paymentMethod: 'cash' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    editingTransaction.paymentMethod === 'cash' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  💵 現金
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={Math.abs(editingTransaction.amount)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const amount = editingTransaction.type === 'expense' ? -Math.abs(Number(value)) : Math.abs(Number(value));
                    setEditingTransaction({ ...editingTransaction, amount });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                <select
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                <input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-6">
              <button
                onClick={() => {
                  deleteTransaction(editingTransaction.id);
                  setEditingTransaction(null);
                }}
                className="px-4 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                🗑️
              </button>
              <button
                onClick={() => setEditingTransaction(null)}
                className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold"
              >
                ✕
              </button>
              <button
                onClick={() => updateTransaction(editingTransaction)}
                className="col-span-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ライフイベントモーダル */}
      {showLifeEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingLifeEvent?.id ? 'イベントを編集' : 'ライフイベントを追加'}
            </h2>

            {!editingLifeEvent?.id && !editingLifeEvent?.name && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">テンプレートを選択</p>
                <div className="grid grid-cols-2 gap-2">
                  {lifeEventTemplates.map(template => (
                    <button
                      key={template.name}
                      onClick={() => {
                        setEditingLifeEvent({
                          name: template.name,
                          amount: template.estimatedAmount,
                          icon: template.icon,
                          date: new Date().toISOString().slice(0, 7),
                          type: template.type
                        });
                      }}
                      className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50"
                    >
                      <div className="text-2xl mb-1">{template.icon}</div>
                      <div className="text-sm font-medium text-gray-800">{template.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingLifeEvent?.name && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">イベント名</label>
                  <input
                    type="text"
                    value={editingLifeEvent.name}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">アイコン</label>
                  <div className="grid grid-cols-8 gap-2">
                    {eventIcons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setEditingLifeEvent({ ...editingLifeEvent, icon })}
                        className={`text-2xl p-2 rounded-lg ${
                          editingLifeEvent.icon === icon ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">予定時期</label>
                  <input
                    type="month"
                    value={editingLifeEvent.date}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">予想費用</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingLifeEvent.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditingLifeEvent({ ...editingLifeEvent, amount: Number(value) });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowLifeEventModal(false);
                      setEditingLifeEvent(null);
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => addOrUpdateLifeEvent(editingLifeEvent)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold"
                  >
                    {editingLifeEvent.id ? '更新' : '追加'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <DollarSign size={24} />
            <span className="text-xs font-medium">家計簿</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'calendar' ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <Calendar size={24} />
            <span className="text-xs font-medium">履歴</span>
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'simulation' ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <TrendingUp size={24} />
            <span className="text-xs font-medium">シミュレーション</span>
          </button>
        </div>
      </div>
    </div>
  );
}
