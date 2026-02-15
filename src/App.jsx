import './index.css'
import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, Calendar, DollarSign, PieChart, Target, Sun, Moon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function BudgetSimulator() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [darkMode, setDarkMode] = useState(() => loadFromStorage('darkMode', true));
  
  function loadFromStorage(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

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
      monthlySavings: 20000,
      savingsInterestRate: 0.2,
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

  useEffect(() => {
    saveToStorage('darkMode', darkMode);
  }, [darkMode]);

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
  // 新NISA制度 + 貯金シミュレーション対応
  const calculateSimulation = () => {
    const { targetAmount, years, monthlyInvestment, monthlySavings, savingsInterestRate, returnRate, useNisa, useLumpSum, lumpSumAmount, lumpSumMonths } = simulationSettings;
    const monthlyRate = returnRate / 100 / 12;
    const savingsMonthlyRate = savingsInterestRate / 100 / 12;

    let results = [];
    let regularInvestment = assetData.investments;
    let nisaInvestment = assetData.nisa || 0;
    let savings = assetData.savings;
    
    const NISA_TSUMITATE_LIMIT = 3600000;
    const NISA_GROWTH_LIMIT = 2400000;
    const NISA_TOTAL_LIMIT = 18000000;

    let nisaUsedThisYear = 0;
    let nisaTotalUsed = nisaInvestment;

    for (let year = 1; year <= years; year++) {
      nisaUsedThisYear = 0;
      let yearlyTaxSaved = 0;
      let yearlyProfit = 0;

      for (let month = 1; month <= 12; month++) {
        // 月次貯金増加
        if (monthlySavings > 0) {
          savings += monthlySavings;
        }

        // 貯金の利息
        const savingsInterest = savings * savingsMonthlyRate;
        savings += savingsInterest;

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

  const chartData = simulationResults.map(result => ({
    年: `${result.year}年`,
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

  // テーマカラー
  const theme = {
    bg: darkMode ? 'bg-black' : 'bg-gray-50',
    card: darkMode ? 'bg-gray-900' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    border: darkMode ? 'border-gray-800' : 'border-gray-200',
    green: darkMode ? '#0CD664' : '#10b981',
    red: darkMode ? '#FF453A' : '#ef4444',
    chart: darkMode ? '#1C1C1E' : '#ffffff'
  };

  return (
    <div className={`min-h-screen ${theme.bg} pb-20 transition-colors duration-200`}>
      {/* ヘッダー */}
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border-b ${theme.border}`}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-xl font-bold ${theme.text}`}>
                マネープランナー
                {userInfo?.name && <span className={`text-sm ml-2 ${theme.textSecondary}`}>{userInfo.name}</span>}
              </h1>
              <p className={`text-xs ${theme.textSecondary}`}>
                {new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
              >
                {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
              >
                <span className={theme.text}>⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-3">
        {/* ホームタブ */}
        {activeTab === 'home' && (
          <div className="space-y-3">
            {/* 総資産カード - 株価アプリ風 */}
            <div className={`${theme.card} rounded-2xl p-4`}>
              <p className={`text-xs ${theme.textSecondary} mb-1`}>総資産</p>
              <p className={`text-4xl font-bold ${theme.text} mb-3`}>
                ¥{(assetData.savings + assetData.investments + (assetData.nisa || 0)).toLocaleString()}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className={`text-xs ${theme.textSecondary}`}>貯金</p>
                  <p className={`text-lg font-semibold ${theme.text}`}>¥{(assetData.savings / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary}`}>投資</p>
                  <p className={`text-lg font-semibold ${theme.text}`}>¥{(assetData.investments / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary}`}>NISA</p>
                  <p className={`text-lg font-semibold`} style={{ color: theme.green }}>¥{((assetData.nisa || 0) / 10000).toFixed(0)}万</p>
                </div>
              </div>
            </div>

            {/* 月次サマリー */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`${theme.card} rounded-xl p-3`}>
                <p className={`text-xs ${theme.textSecondary} mb-1`}>収入</p>
                <p className="text-lg font-bold" style={{ color: theme.green }}>
                  ¥{(currentBalance.income / 10000).toFixed(1)}万
                </p>
              </div>
              <div className={`${theme.card} rounded-xl p-3`}>
                <p className={`text-xs ${theme.textSecondary} mb-1`}>支出</p>
                <p className="text-lg font-bold" style={{ color: theme.red }}>
                  ¥{(currentBalance.expense / 10000).toFixed(1)}万
                </p>
              </div>
              <div className={`${theme.card} rounded-xl p-3`}>
                <p className={`text-xs ${theme.textSecondary} mb-1`}>収支</p>
                <p className={`text-lg font-bold`} style={{ color: currentBalance.balance >= 0 ? theme.green : theme.red }}>
                  {currentBalance.balance >= 0 ? '+' : ''}¥{(currentBalance.balance / 10000).toFixed(1)}万
                </p>
              </div>
            </div>

            {/* クレジット未確定 */}
            {unsettledCredit.length > 0 && (
              <div className={`${theme.card} rounded-xl p-4 border-2`} style={{ borderColor: '#FF9F0A' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-bold ${theme.text}`}>💳 未確定のクレジット</p>
                    <p className="text-2xl font-bold" style={{ color: '#FF9F0A' }}>
                      ¥{totalUnsettledCredit.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={settleCredit}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: '#FF9F0A' }}
                  >
                    確定
                  </button>
                </div>
              </div>
            )}

            {/* 取引入力フォーム */}
            <div className={`${theme.card} rounded-xl p-4`}>
              <h2 className={`text-base font-bold ${theme.text} mb-3 flex items-center gap-2`}>
                <PlusCircle size={18} style={{ color: theme.green }} />
                取引を追加
              </h2>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                      newTransaction.type === 'expense'
                        ? darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                        : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    支出
                  </button>
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                      newTransaction.type === 'income'
                        ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                        : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    収入
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: 'credit' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                      newTransaction.paymentMethod === 'credit'
                        ? darkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white'
                        : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    💳 クレジット
                  </button>
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: 'cash' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                      newTransaction.paymentMethod === 'cash'
                        ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                        : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
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
                  className={`w-full px-3 py-2 rounded-lg text-base ${
                    darkMode 
                      ? 'bg-gray-800 text-white border border-gray-700' 
                      : 'bg-white border-2 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-800 text-white border border-gray-700' 
                      : 'bg-white border-2 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">カテゴリを選択</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={addTransaction}
                  className="w-full py-3 rounded-lg font-bold text-white"
                  style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
                >
                  追加する
                </button>
              </div>
            </div>
            {/* カテゴリ別支出 */}
            {calculateCategoryExpenses().length > 0 && (
              <div className={`${theme.card} rounded-xl p-4`}>
                <h2 className={`text-base font-bold ${theme.text} mb-3`}>今月の支出内訳</h2>
                
                <div className="space-y-2">
                  {calculateCategoryExpenses().map((item, index) => {
                    const total = calculateCategoryExpenses().reduce((sum, i) => sum + i.amount, 0);
                    const percentage = (item.amount / total * 100).toFixed(1);
                    return (
                      <div key={item.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${theme.text}`}>{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${theme.textSecondary}`}>{percentage}%</span>
                            <span className={`text-sm font-bold ${theme.text}`}>
                              ¥{item.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: darkMode ? '#0CD664' : '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 前月比較 */}
            {calculateMonthlyComparison().expense.previous > 0 && (
              <div className={`${theme.card} rounded-xl p-4`}>
                <h2 className={`text-base font-bold ${theme.text} mb-3`}>前月との比較</h2>
                <div className="space-y-2">
                  {(() => {
                    const comparison = calculateMonthlyComparison();
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className={theme.textSecondary}>支出</span>
                          <div className="text-right">
                            <p className={`font-bold ${theme.text}`}>¥{comparison.expense.current.toLocaleString()}</p>
                            <p className={`text-xs`} style={{ color: comparison.expense.diff > 0 ? theme.red : theme.green }}>
                              {comparison.expense.diff > 0 ? '+' : ''}¥{comparison.expense.diff.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={theme.textSecondary}>収支</span>
                          <div className="text-right">
                            <p className={`font-bold ${theme.text}`}>
                              {comparison.balance.current >= 0 ? '+' : ''}¥{comparison.balance.current.toLocaleString()}
                            </p>
                            <p className={`text-xs`} style={{ color: comparison.balance.diff >= 0 ? theme.green : theme.red }}>
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
            <div className={`${theme.card} rounded-xl p-4`}>
              <h2 className={`text-base font-bold ${theme.text} mb-3`}>最近の取引</h2>
              <div className="space-y-1">
                {transactions.slice(0, 8).map(t => (
                  <div
                    key={t.id}
                    onClick={() => setEditingTransaction(t)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-base">{t.paymentMethod === 'credit' ? '💳' : '💵'}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${theme.text}`}>{t.category}</p>
                        <p className={`text-xs ${theme.textSecondary}`}>{t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!t.settled && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#FF9F0A', color: '#000' }}>
                          未確定
                        </span>
                      )}
                      <p className={`text-sm font-bold`} style={{ color: t.amount >= 0 ? theme.green : theme.red }}>
                        {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                      </p>
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
                  className="w-full mt-3 py-3 rounded-lg font-bold text-white"
                  style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
                >
                  今月を締める
                </button>
              )}
            </div>
          </div>
        )}

        {/* カレンダータブ */}
        {activeTab === 'calendar' && (
          <div className="space-y-3">
            <div className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    const date = new Date(selectedMonth + '-01');
                    date.setMonth(date.getMonth() - 1);
                    setSelectedMonth(date.toISOString().slice(0, 7));
                  }}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <span className={theme.text}>◀</span>
                </button>
                <h2 className={`text-base font-bold ${theme.text}`}>
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
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <span className={theme.text}>▶</span>
                </button>
              </div>

              <div className="mb-3">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                    <div key={day} className={`text-center text-xs font-bold py-1 ${
                      i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : theme.textSecondary
                    }`}>
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
                          isToday 
                            ? darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-20' : 'border-blue-500 bg-blue-50'
                            : darkMode ? 'border-gray-800' : 'border-gray-200'
                        } ${hasTransactions ? (darkMode ? 'bg-gray-800' : 'bg-gray-50') : ''}`}
                      >
                        <div className={`text-xs font-semibold ${isToday ? 'text-blue-500' : theme.text}`}>
                          {day}
                        </div>
                        {hasTransactions && (
                          <div className="mt-0.5">
                            {dayBalance.income > 0 && (
                              <div className="text-[8px] leading-tight" style={{ color: theme.green }}>
                                +{(dayBalance.income / 1000).toFixed(0)}k
                              </div>
                            )}
                            {dayBalance.expense > 0 && (
                              <div className="text-[8px] leading-tight" style={{ color: theme.red }}>
                                -{(dayBalance.expense / 1000).toFixed(0)}k
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3`}>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className={`text-xs ${theme.textSecondary} mb-1`}>収入</div>
                    <div className="text-base font-bold" style={{ color: theme.green }}>
                      ¥{calculateMonthlyBalance(selectedMonth).income.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs ${theme.textSecondary} mb-1`}>支出</div>
                    <div className="text-base font-bold" style={{ color: theme.red }}>
                      ¥{calculateMonthlyBalance(selectedMonth).expense.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs ${theme.textSecondary} mb-1`}>収支</div>
                    <div className={`text-base font-bold`} style={{ 
                      color: calculateMonthlyBalance(selectedMonth).balance >= 0 ? theme.green : theme.red 
                    }}>
                      {calculateMonthlyBalance(selectedMonth).balance >= 0 ? '+' : ''}
                      ¥{calculateMonthlyBalance(selectedMonth).balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 過去6ヶ月のトレンドグラフ */}
            <div className={`${theme.card} rounded-xl p-4`}>
              <h2 className={`text-base font-bold ${theme.text} mb-3`}>過去6ヶ月の推移</h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={getLast6MonthsTrend()}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.green} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.green} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2C2C2E' : '#f0f0f0'} />
                  <XAxis 
                    dataKey="month" 
                    stroke={darkMode ? '#8E8E93' : '#6b7280'} 
                    style={{ fontSize: '11px' }} 
                  />
                  <YAxis 
                    stroke={darkMode ? '#8E8E93' : '#6b7280'} 
                    style={{ fontSize: '11px' }}
                    tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                  />
                  <Tooltip 
                    formatter={(value) => `¥${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1C1C1E' : '#fff', 
                      border: `1px solid ${darkMode ? '#2C2C2E' : '#e5e7eb'}`, 
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: darkMode ? '#fff' : '#000'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke={theme.green} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* シミュレーションタブ */}
        {activeTab === 'simulation' && (
          <div className="space-y-3">
            {/* 現在の資産 - 株価アプリ風 */}
            <div className={`${theme.card} rounded-xl p-4`}>
              <p className={`text-xs ${theme.textSecondary} mb-1`}>現在の資産</p>
              <p className={`text-4xl font-bold ${theme.text} mb-3`}>
                ¥{(assetData.savings + assetData.investments + (assetData.nisa || 0)).toLocaleString()}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className={`text-xs ${theme.textSecondary}`}>貯金</p>
                  <p className={`text-base font-semibold ${theme.text}`}>¥{(assetData.savings / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary}`}>投資</p>
                  <p className={`text-base font-semibold ${theme.text}`}>¥{(assetData.investments / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary}`}>NISA</p>
                  <p className={`text-base font-semibold`} style={{ color: theme.green }}>
                    ¥{((assetData.nisa || 0) / 10000).toFixed(0)}万
                  </p>
                </div>
              </div>
            </div>

            {/* シミュレーション設定 */}
            <div className={`${theme.card} rounded-xl p-4`}>
              <h2 className={`text-base font-bold ${theme.text} mb-3`}>シミュレーション設定</h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
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
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
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
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                    月々の貯金増加額: ¥{simulationSettings.monthlySavings.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="10000"
                    value={simulationSettings.monthlySavings}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, monthlySavings: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className={`flex justify-between text-xs ${theme.textSecondary} mt-1`}>
                    <span>年間: ¥{(simulationSettings.monthlySavings * 12).toLocaleString()}</span>
                    <span>利率: {simulationSettings.savingsInterestRate}%</span>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                    貯金の利率: {simulationSettings.savingsInterestRate}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={simulationSettings.savingsInterestRate}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, savingsInterestRate: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>
                    ※普通預金: 0.001%, 定期預金: 0.2%程度
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                    月々の積立投資額: ¥{simulationSettings.monthlyInvestment.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="10000"
                    value={simulationSettings.monthlyInvestment}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, monthlyInvestment: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
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
                </div>

                {/* NISA設定 */}
                <div className="border-t pt-3" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-medium ${theme.text}`}>
                      新NISA制度を利用
                    </label>
                    <button
                      onClick={() => setSimulationSettings({ ...simulationSettings, useNisa: !simulationSettings.useNisa })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        simulationSettings.useNisa ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
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
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-lg p-2 text-xs`}>
                      <p className={`${darkMode ? 'text-green-400' : 'text-green-800'} font-bold mb-1`}>🎯 新NISA</p>
                      <p className={darkMode ? 'text-gray-400' : 'text-green-700'}>
                        • つみたて: 年360万円<br/>
                        • 成長投資: 年240万円<br/>
                        • 生涯: 1,800万円
                      </p>
                    </div>
                  )}
                </div>

                {/* 成長投資設定 */}
                <div className="border-t pt-3" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-medium ${theme.text}`}>
                      成長投資（一括）
                    </label>
                    <button
                      onClick={() => setSimulationSettings({ ...simulationSettings, useLumpSum: !simulationSettings.useLumpSum })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        simulationSettings.useLumpSum ? 'bg-purple-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
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
                        <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                          1回あたり: ¥{simulationSettings.lumpSumAmount.toLocaleString()}
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
                        <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                          投資月を選択
                        </label>
                        <div className="grid grid-cols-6 gap-1">
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
                              className={`py-1 rounded text-xs font-medium transition-all ${
                                (simulationSettings.lumpSumMonths || []).includes(month)
                                  ? 'bg-purple-500 text-white'
                                  : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {month}月
                            </button>
                          ))}
                        </div>
                        <p className={`text-xs ${theme.textSecondary} mt-1`}>
                          年間合計: ¥{(simulationSettings.lumpSumAmount * (simulationSettings.lumpSumMonths?.length || 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ライフイベント */}
            <div className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-base font-bold ${theme.text}`}>ライフイベント</h2>
                <button
                  onClick={() => {
                    setEditingLifeEvent(null);
                    setShowLifeEventModal(true);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
                >
                  + 追加
                </button>
              </div>

              {lifeEvents.length === 0 ? (
                <p className={`${theme.textSecondary} text-center py-3 text-sm`}>
                  イベントを追加して将来の計画を立てましょう
                </p>
              ) : (
                <div className="space-y-2">
                  {lifeEvents.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
                    <div key={event.id} className={`flex items-center justify-between p-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{event.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${theme.text}`}>{event.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: theme.red }}>
                          ¥{event.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => {
                            setEditingLifeEvent(event);
                            setShowLifeEventModal(true);
                          }}
                          className="text-blue-500"
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
            <div className={`${theme.card} rounded-xl p-4`}>
              <h2 className={`text-base font-bold ${theme.text} mb-3`}>
                {simulationSettings.years}年後の予測
              </h2>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-xl p-4 mb-3`}>
                <p className={`text-xs ${theme.textSecondary} mb-1`}>予想資産額</p>
                <p className="text-3xl font-bold" style={{ color: theme.green }}>
                  ¥{finalValue.toLocaleString()}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2 my-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${achievement}%`,
                      backgroundColor: theme.green
                    }}
                  />
                </div>
                <p className={`text-xs ${theme.textSecondary}`}>
                  目標達成率: {achievement.toFixed(1)}%
                </p>

                {simulationSettings.useNisa && (
                  <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${darkMode ? '#2C2C2E' : '#d1fae5'}` }}>
                    <p className="text-xs font-bold" style={{ color: theme.green }}>
                      💰 NISA節税効果: 約¥{totalTaxSaved.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {achievement >= 100 ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} border-2 rounded-xl p-3 text-center mb-3`} style={{ borderColor: theme.green }}>
                  <p className="text-xl mb-1">🎉</p>
                  <p className="text-sm font-bold" style={{ color: theme.green }}>目標達成可能！</p>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-orange-50'} border-2 rounded-xl p-3 mb-3`} style={{ borderColor: '#FF9F0A' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#FF9F0A' }}>💡 アドバイス</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-orange-700'}`}>
                    目標達成には月々約
                    <span className="font-bold"> ¥{Math.ceil((simulationSettings.targetAmount - finalValue) / (simulationSettings.years * 12) / 1000) * 1000}</span>
                    円の追加投資が必要です
                  </p>
                </div>
              )}

              {/* 資産推移グラフ - 大きく表示 */}
              <div className="mb-4">
                <h3 className={`text-sm font-bold ${theme.text} mb-2`}>資産推移</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNisa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.green} stopOpacity={0.6}/>
                        <stop offset="95%" stopColor={theme.green} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2C2C2E' : '#f0f0f0'} />
                    <XAxis 
                      dataKey="年" 
                      stroke={darkMode ? '#8E8E93' : '#6b7280'} 
                      style={{ fontSize: '10px' }}
                    />
                    <YAxis 
                      stroke={darkMode ? '#8E8E93' : '#6b7280'} 
                      style={{ fontSize: '10px' }}
                      tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value) => `¥${value.toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1C1C1E' : '#fff', 
                        border: `1px solid ${darkMode ? '#2C2C2E' : '#e5e7eb'}`, 
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
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
                        stroke={theme.green} 
                        fill="url(#colorNisa)" 
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 年ごとの詳細 - コンパクト表示 */}
              <div className="space-y-2">
                <h3 className={`text-sm font-bold ${theme.text}`}>年ごとの推移</h3>
                {simulationResults.filter((_, i) => i % 2 === 0 || i === simulationResults.length - 1).map(result => (
                  <div key={result.year}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>{result.year}年後</span>
                      <span className={`font-bold ${theme.text}`}>¥{result.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="h-1 rounded-full"
                        style={{ 
                          width: `${(result.totalValue / simulationSettings.targetAmount) * 100}%`,
                          background: `linear-gradient(to right, ${theme.green}, #a855f7)`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* オンボーディングモーダル */}
      {showOnboarding && (
        <div className={`fixed inset-0 ${darkMode ? 'bg-black' : 'bg-gradient-to-br from-indigo-600 to-purple-600'} flex items-center justify-center p-4 z-50`}>
          <div className={`${theme.card} rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto`}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💰</div>
              <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>
                マネープランナーへ<br/>ようこそ！
              </h1>
              <p className={theme.textSecondary}>
                まずは基本情報を入力しましょう
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  お名前（ニックネーム）
                </label>
                <input
                  type="text"
                  placeholder="例：太郎"
                  value={userInfo?.name || ''}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  年齢
                </label>
                <input
                  type="number"
                  placeholder="25"
                  value={userInfo?.age || ''}
                  onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
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
                  className={`w-full px-4 py-3 rounded-xl ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  ¥{assetData.savings.toLocaleString()}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
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
                  className={`w-full px-4 py-3 rounded-xl ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  ¥{assetData.investments.toLocaleString()}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
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
                  className={`w-full px-4 py-3 rounded-xl ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  ¥{(assetData.nisa || 0).toLocaleString()}
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
              className="w-full mt-6 py-4 rounded-xl font-bold text-white"
              style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
            >
              始める
            </button>
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-6`}>設定</h2>

            <div className="mb-6">
              <h3 className={`text-base font-bold ${theme.text} mb-4`}>ユーザー情報</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>お名前</label>
                  <input
                    type="text"
                    value={userInfo?.name || ''}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>年齢</label>
                  <input
                    type="number"
                    value={userInfo?.age || ''}
                    onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>貯金額</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={assetData.savings}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setAssetData({ ...assetData, savings: Number(value) });
                    }}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>
                    ¥{assetData.savings.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>投資額</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={assetData.investments}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setAssetData({ ...assetData, investments: Number(value) });
                    }}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>
                    ¥{assetData.investments.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>NISA投資額</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={assetData.nisa || 0}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setAssetData({ ...assetData, nisa: Number(value) });
                    }}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>
                    ¥{(assetData.nisa || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className={`text-base font-bold ${theme.text} mb-4`}>データ管理</h3>
              <div className="space-y-3">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} border-2 rounded-xl p-4`} style={{ borderColor: darkMode ? '#2C2C2E' : '#bfdbfe' }}>
                  <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-800'} mb-2`}>
                    💾 データは自動保存されています
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                    取引数: {transactions.length}件<br/>
                    月次履歴: {Object.keys(monthlyHistory).length}ヶ月<br/>
                    ライフイベント: {lifeEvents.length}件
                  </p>
                </div>

                <button
                  onClick={resetAllData}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ backgroundColor: theme.red }}
                >
                  🗑️ 全てのデータを削除
                </button>
                <p className={`text-xs ${theme.textSecondary} text-center`}>
                  ※この操作は取り消せません
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 月締めモーダル */}
      {showCloseMonthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>今月を締める</h2>
            <p className={`${theme.textSecondary} mb-4`}>
              今月の収支: <span className="font-bold" style={{ color: theme.green }}>¥{currentBalance.balance.toLocaleString()}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
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

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 space-y-2`}>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>貯金へ</span>
                  <span className="font-bold" style={{ color: '#3b82f6' }}>¥{closeMonthData.savedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>投資へ</span>
                  <span className="font-bold" style={{ color: '#a855f7' }}>¥{closeMonthData.investAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseMonthModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-bold ${
                  darkMode ? 'bg-gray-800 text-white' : 'border-2 border-gray-300 text-gray-700'
                }`}
              >
                キャンセル
              </button>
              <button
                onClick={closeMonth}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
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
          <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>取引を編集</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense', amount: -Math.abs(editingTransaction.amount) })}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    editingTransaction.type === 'expense' 
                      ? darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white' 
                      : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income', amount: Math.abs(editingTransaction.amount) })}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    editingTransaction.type === 'income' 
                      ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white' 
                      : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  収入
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, paymentMethod: 'credit' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    editingTransaction.paymentMethod === 'credit' 
                      ? darkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white' 
                      : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  💳 クレジット
                </button>
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, paymentMethod: 'cash' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    editingTransaction.paymentMethod === 'cash' 
                      ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white' 
                      : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  💵 現金
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={Math.abs(editingTransaction.amount)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const amount = editingTransaction.type === 'expense' ? -Math.abs(Number(value)) : Math.abs(Number(value));
                    setEditingTransaction({ ...editingTransaction, amount });
                  }}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>カテゴリ</label>
                <select
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>日付</label>
                <input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  className={`w-full px-2 py-2.5 rounded-lg text-sm ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-6">
              <button
                onClick={() => {
                  deleteTransaction(editingTransaction.id);
                  setEditingTransaction(null);
                }}
                className="px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.red }}
              >
                🗑️
              </button>
              <button
                onClick={() => setEditingTransaction(null)}
                className={`px-4 py-3 rounded-xl font-bold ${
                  darkMode ? 'bg-gray-800 text-white' : 'border-2 border-gray-300 text-gray-700'
                }`}
              >
                ✕
              </button>
              <button
                onClick={() => updateTransaction(editingTransaction)}
                className="col-span-2 px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
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
          <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>
              {editingLifeEvent?.id ? 'イベントを編集' : 'ライフイベントを追加'}
            </h2>

            {!editingLifeEvent?.id && !editingLifeEvent?.name && (
              <div className="mb-6">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-3`}>テンプレートを選択</p>
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
                      className={`p-3 border-2 rounded-lg ${
                        darkMode 
                          ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-800' 
                          : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{template.icon}</div>
                      <div className={`text-sm font-medium ${theme.text}`}>{template.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingLifeEvent?.name && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>イベント名</label>
                  <input
                    type="text"
                    value={editingLifeEvent.name}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>アイコン</label>
                  <div className="grid grid-cols-8 gap-2">
                    {eventIcons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setEditingLifeEvent({ ...editingLifeEvent, icon })}
                        className={`text-2xl p-2 rounded-lg ${
                          editingLifeEvent.icon === icon 
                            ? darkMode ? 'bg-blue-900 ring-2 ring-blue-500' : 'bg-indigo-100 ring-2 ring-indigo-500' 
                            : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>予定時期</label>
                  <input
                    type="month"
                    value={editingLifeEvent.date}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>予想費用</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingLifeEvent.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditingLifeEvent({ ...editingLifeEvent, amount: Number(value) });
                    }}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border-2 border-gray-200'
                    }`}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowLifeEventModal(false);
                      setEditingLifeEvent(null);
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold ${
                      darkMode ? 'bg-gray-800 text-white' : 'border-2 border-gray-300 text-gray-700'
                    }`}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => addOrUpdateLifeEvent(editingLifeEvent)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white"
                    style={{ backgroundColor: darkMode ? '#0A84FF' : '#007AFF' }}
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
      <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-t ${theme.border}`}>
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home' ? darkMode ? 'text-blue-500' : 'text-indigo-600' : theme.textSecondary
            }`}
          >
            <DollarSign size={22} />
            <span className="text-xs font-medium">家計簿</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'calendar' ? darkMode ? 'text-blue-500' : 'text-indigo-600' : theme.textSecondary
            }`}
          >
            <Calendar size={22} />
            <span className="text-xs font-medium">履歴</span>
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'simulation' ? darkMode ? 'text-blue-500' : 'text-indigo-600' : theme.textSecondary
            }`}
          >
            <TrendingUp size={22} />
            <span className="text-xs font-medium">シミュレーション</span>
          </button>
        </div>
      </div>
    </div>
  );
}
