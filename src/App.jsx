import './index.css'
import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, TrendingUp, Calendar, DollarSign, Sun, Moon, Zap, Droplets, Target, Settings, Edit2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';

export default function BudgetSimulator() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(null);
  const [darkMode, setDarkMode] = useState(() => loadFromStorage('darkMode', true));
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showAssetEditModal, setShowAssetEditModal] = useState(false);
  const [showDateTransactionsModal, setShowDateTransactionsModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('expense');
  const [editingRecurring, setEditingRecurring] = useState(null);

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
      { id: 3, date: '2026-02-10', category: '給料', amount: 250000, type: 'income', settled: true },
    ])
  );

  const [assetData, setAssetData] = useState(() => 
    loadFromStorage('assetData', {
      savings: 500000,
      investments: 300000,
      nisa: 0,
      dryPowder: 0
    })
  );

  const [monthlyHistory, setMonthlyHistory] = useState(() => 
    loadFromStorage('monthlyHistory', {})
  );

  const [lifeEvents, setLifeEvents] = useState(() =>
    loadFromStorage('lifeEvents', [])
  );

  const [monthlyBudget, setMonthlyBudget] = useState(() =>
    loadFromStorage('monthlyBudget', {
      income: 300000,
      expenses: {
        食費: 40000,
        住居費: 80000,
        光熱費: 15000,
        通信費: 10000,
        交通費: 10000,
        娯楽費: 20000,
        医療費: 5000,
        教育費: 0,
        被服費: 10000,
        その他: 10000
      }
    })
  );

  const [recurringTransactions, setRecurringTransactions] = useState(() =>
    loadFromStorage('recurringTransactions', [])
  );

  const [customCategories, setCustomCategories] = useState(() =>
    loadFromStorage('customCategories', {
      expense: [],
      income: []
    })
  );

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    type: 'expense',
    paymentMethod: 'credit',
    date: new Date().toISOString().slice(0, 10)
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
      useLumpSum: true,
      lumpSumAmount: 500000,
      lumpSumFrequency: 2,
      lumpSumMonths: [6, 12],
      riskProfile: 'standard',
      showMonteCarloSimulation: false
    })
  );

  const riskProfiles = {
    conservative: {
      label: '保守的',
      icon: '🛡️',
      description: '安全性重視',
      returnRate: 3,
      monthlyInvestment: 20000,
      monthlySavings: 50000,
      useLumpSum: false,
      volatility: 0.05
    },
    standard: {
      label: '標準的',
      icon: '⚖️',
      description: 'バランス重視',
      returnRate: 5,
      monthlyInvestment: 30000,
      monthlySavings: 30000,
      useLumpSum: true,
      volatility: 0.10
    },
    aggressive: {
      label: '積極的',
      icon: '🚀',
      description: '成長重視',
      returnRate: 7,
      monthlyInvestment: 50000,
      monthlySavings: 20000,
      useLumpSum: true,
      volatility: 0.15
    }
  };

  const applyRiskProfile = useCallback((profile) => {
    const preset = riskProfiles[profile];
    setSimulationSettings(prev => ({
      ...prev,
      riskProfile: profile,
      returnRate: preset.returnRate,
      monthlyInvestment: preset.monthlyInvestment,
      monthlySavings: preset.monthlySavings,
      useLumpSum: preset.useLumpSum
    }));
  }, []);

  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false);
  const [closeMonthData, setCloseMonthData] = useState({ savedAmount: 0, investAmount: 0, dryPowderAmount: 0 });
  const [editingTransaction, setEditingTransaction] = useState(null);
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

  useEffect(() => {
    saveToStorage('monthlyBudget', monthlyBudget);
  }, [monthlyBudget]);

  useEffect(() => {
    saveToStorage('customCategories', customCategories);
  }, [customCategories]);

  useEffect(() => {
    saveToStorage('recurringTransactions', recurringTransactions);
  }, [recurringTransactions]);

  useEffect(() => {
    generateRecurringTransactions();
  }, [recurringTransactions]);

  const expenseCategories = ['食費', '住居費', '光熱費', '通信費', '交通費', '娯楽費', '医療費', '教育費', '被服費', 'その他', ...customCategories.expense];
  const incomeCategories = ['給料', 'ボーナス', '副業', '投資収益', '年金', 'その他', ...customCategories.income];

  // 金融広報中央委員会「家計の金融行動に関する世論調査」2023年データ（単身世帯）
  const benchmarkData = {
    '20s': {
      median: 1000000,      // 中央値: 100万円
      average: 1850000,     // 平均値: 185万円
      savings: 1400000,     // 貯蓄想定: 140万
      investments: 300000,  // 投資想定: 30万
      nisa: 100000,         // NISA想定: 10万
      dryPowder: 50000      // 待機資金想定: 5万
    },
    '30s': {
      median: 3500000,      // 中央値: 350万円
      average: 6060000,     // 平均値: 606万円
      savings: 4500000,     // 貯蓄想定: 450万
      investments: 1000000, // 投資想定: 100万
      nisa: 400000,         // NISA想定: 40万
      dryPowder: 160000     // 待機資金想定: 16万
    },
    '40s': {
      median: 5500000,      // 中央値: 550万円
      average: 10000000,    // 平均値: 1,000万円
      savings: 7500000,     // 貯蓄想定: 750万
      investments: 1800000, // 投資想定: 180万
      nisa: 600000,         // NISA想定: 60万
      dryPowder: 300000     // 待機資金想定: 30万
    },
    '50s': {
      median: 8000000,      // 中央値: 800万円
      average: 15000000,    // 平均値: 1,500万円
      savings: 11000000,    // 貯蓄想定: 1,100万
      investments: 2700000, // 投資想定: 270万
      nisa: 900000,         // NISA想定: 90万
      dryPowder: 400000     // 待機資金想定: 40万
    },
    '60s': {
      median: 12000000,     // 中央値: 1,200万円
      average: 20000000,    // 平均値: 2,000万円
      savings: 15000000,    // 貯蓄想定: 1,500万
      investments: 3500000, // 投資想定: 350万
      nisa: 1200000,        // NISA想定: 120万
      dryPowder: 300000     // 待機資金想定: 30万
    }
  };

  const getAgeGroup = (age = null) => {
    const targetAge = age !== null ? age : (userInfo?.age ? Number(userInfo.age) : 25);
    if (targetAge < 30) return '20s';
    if (targetAge < 40) return '30s';
    if (targetAge < 50) return '40s';
    if (targetAge < 60) return '50s';
    return '60s';
  };

  const calculateBenchmark = (targetAge = null) => {
    const ageGroup = getAgeGroup(targetAge);
    const benchmark = benchmarkData[ageGroup];
    
    const myTotal = assetData.savings + assetData.investments + assetData.nisa + assetData.dryPowder;
    const avgTotal = benchmark.average;
    const medianTotal = benchmark.median;
    const difference = myTotal - avgTotal;
    
    // より精密なパーセンタイル計算（正規分布を仮定）
    const percentile = myTotal >= avgTotal 
      ? 50 + Math.min((difference / avgTotal * 50), 49.9)
      : 50 - Math.min((Math.abs(difference) / avgTotal * 50), 49.9);
    
    return {
      myTotal,
      avgTotal,
      medianTotal,
      difference,
      percentile: Math.max(0.1, Math.min(99.9, percentile)),
      isAboveAverage: difference >= 0,
      isAboveMedian: myTotal >= medianTotal,
      ageGroup,
      benchmark
    };
  };

  const generateRecurringTransactions = () => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    recurringTransactions.forEach(recurring => {
      const targetDate = `${currentMonth}-${String(recurring.day).padStart(2, '0')}`;
      
      const exists = transactions.some(t => 
        t.date === targetDate && 
        t.category === recurring.category && 
        Math.abs(t.amount) === recurring.amount &&
        t.recurringId === recurring.id
      );
      
      if (!exists && new Date(targetDate) <= today) {
        const newTransaction = {
          id: Date.now() + Math.random(),
          date: targetDate,
          category: recurring.category,
          amount: -recurring.amount,
          type: recurring.type === 'investment' ? 'expense' : 'expense',
          paymentMethod: recurring.paymentMethod,
          settled: recurring.paymentMethod === 'cash',
          isRecurring: true,
          recurringId: recurring.id,
          recurringName: recurring.name
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
      }
    });
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) {
      alert('カテゴリ名を入力してください');
      return;
    }
    
    const existingCategories = newCategoryType === 'expense' ? expenseCategories : incomeCategories;
    if (existingCategories.includes(newCategoryName.trim())) {
      alert('このカテゴリは既に存在します');
      return;
    }
    
    setCustomCategories(prev => ({
      ...prev,
      [newCategoryType]: [...prev[newCategoryType], newCategoryName.trim()]
    }));
    
    if (newCategoryType === 'expense') {
      setMonthlyBudget(prev => ({
        ...prev,
        expenses: {
          ...prev.expenses,
          [newCategoryName.trim()]: 0
        }
      }));
    }
    
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  const deleteCustomCategory = (category, type) => {
    if (!confirm(`「${category}」を削除しますか？`)) return;
    
    setCustomCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(c => c !== category)
    }));
    
    if (type === 'expense' && monthlyBudget.expenses[category] !== undefined) {
      setMonthlyBudget(prev => {
        const newExpenses = { ...prev.expenses };
        delete newExpenses[category];
        return { ...prev, expenses: newExpenses };
      });
    }
  };
  const calculateMonthlyBalance = (yearMonth) => {
    const monthTransactions = transactions.filter(t => 
      t.date.startsWith(yearMonth)
    );
    
    // PL（発生主義）：クレジット引き落としを除く全取引
    const plIncome = monthTransactions
      .filter(t => t.amount > 0 && !t.isSettlement)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const plExpense = Math.abs(monthTransactions
      .filter(t => t.amount < 0 && !t.isSettlement)
      .reduce((sum, t) => sum + t.amount, 0));
    
    // CF（現金主義）：確定済み取引のみ
    const cfIncome = monthTransactions
      .filter(t => t.amount > 0 && t.settled)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const cfExpense = Math.abs(monthTransactions
      .filter(t => t.amount < 0 && t.settled)
      .reduce((sum, t) => sum + t.amount, 0));
    
    // 未確定のクレジット（翌月以降のCF）
    const unsettledCredit = Math.abs(monthTransactions
      .filter(t => t.amount < 0 && !t.settled && t.paymentMethod === 'credit' && !t.isSettlement)
      .reduce((sum, t) => sum + t.amount, 0));
    
    return {
      plIncome,
      plExpense,
      plBalance: plIncome - plExpense,
      cfIncome,
      cfExpense,
      cfBalance: cfIncome - cfExpense,
      unsettledCredit
    };
  };


  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentBalance = calculateMonthlyBalance(currentMonth);

  const calculateBudgetAnalysis = () => {
    const actualIncome = currentBalance.plIncome;
    const actualExpense = currentBalance.plExpense;
    const actualCF = currentBalance.cfBalance;
    
    const totalBudgetExpense = Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0);
    
    const plannedSurplus = monthlyBudget.income - totalBudgetExpense;
    const actualSurplus = actualIncome - actualExpense;
    
    const plannedInvestment = simulationSettings.monthlyInvestment;
    const plannedSavings = simulationSettings.monthlySavings;
    const plannedTotal = plannedInvestment + plannedSavings;
    
    const surplusGap = actualSurplus - plannedSurplus;
    const investmentGap = plannedTotal - actualCF;
    const needsWithdrawal = investmentGap > 0;
    
    const categoryComparison = {};
    Object.keys(monthlyBudget.expenses).forEach(category => {
      const budgeted = monthlyBudget.expenses[category];
      const actual = transactions
        .filter(t => t.date.startsWith(currentMonth) && t.category === category && t.amount < 0 && !t.isSettlement)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      categoryComparison[category] = {
        budgeted,
        actual,
        difference: actual - budgeted,
        percentage: budgeted > 0 ? (actual / budgeted * 100) : 0
      };
    });
    
    return {
      income: {
        budgeted: monthlyBudget.income,
        actual: actualIncome,
        difference: actualIncome - monthlyBudget.income
      },
      expense: {
        budgeted: totalBudgetExpense,
        actual: actualExpense,
        difference: actualExpense - totalBudgetExpense
      },
      surplus: {
        planned: plannedSurplus,
        actual: actualSurplus,
        gap: surplusGap
      },
      cashflow: {
        actual: actualCF,
        unsettledCredit: currentBalance.unsettledCredit
      },
      investment: {
        planned: plannedTotal,
        available: actualCF,
        gap: investmentGap,
        needsWithdrawal,
        withdrawalAmount: needsWithdrawal ? investmentGap : 0
      },
      categoryComparison
    };
  };

  const budgetAnalysis = calculateBudgetAnalysis();

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
      date: newTransaction.date,
      category: newTransaction.category,
      amount: amount,
      type: newTransaction.type,
      paymentMethod: newTransaction.type === 'income' ? undefined : newTransaction.paymentMethod,
      settled: newTransaction.type === 'income' ? true : (newTransaction.paymentMethod === 'cash'),
      isSettlement: false
    };

    setTransactions([transaction, ...transactions]);
    setNewTransaction({ 
      amount: '', 
      category: '', 
      type: 'expense', 
      paymentMethod: 'credit',
      date: new Date().toISOString().slice(0, 10)
    });
  };

  const closeMonth = () => {
    const cfBalance = currentBalance.cfBalance;
    const plannedInvestment = simulationSettings.monthlyInvestment;
    const plannedSavings = simulationSettings.monthlySavings;
    const totalPlanned = plannedInvestment + plannedSavings;
    
    let actualInvest = closeMonthData.investAmount;
    let actualDryPowder = closeMonthData.dryPowderAmount;
    let actualSavings = closeMonthData.savedAmount;
    let withdrawalFromSavings = 0;
    
    if (cfBalance < totalPlanned) {
      withdrawalFromSavings = totalPlanned - cfBalance;
      actualInvest = plannedInvestment;
      actualSavings = cfBalance - actualDryPowder;
    }

    setAssetData(prev => ({
      savings: prev.savings + actualSavings - withdrawalFromSavings,
      investments: prev.investments + actualInvest,
      dryPowder: prev.dryPowder + actualDryPowder,
      nisa: prev.nisa
    }));

    setMonthlyHistory(prev => ({
      ...prev,
      [currentMonth]: {
        plBalance: currentBalance.plBalance,
        cfBalance: cfBalance,
        savedAmount: actualSavings,
        investAmount: actualInvest,
        dryPowderAmount: actualDryPowder,
        withdrawalFromSavings
      }
    }));

    setShowCloseMonthModal(false);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const updateTransaction = (updatedTransaction) => {
    setTransactions(transactions.map(t => 
      t.id === updatedTransaction.id ? updatedTransaction : t
    ));
    setEditingTransaction(null);
  };

  const calculateCategoryExpenses = () => {
    const currentMonthTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth) && t.amount < 0 && !t.isSettlement
    );

    const categoryTotals = currentMonthTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
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
    const plTransactions = dayTransactions.filter(t => !t.isSettlement);
    const income = plTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = Math.abs(plTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    return { income, expense, balance: income - expense };
  };

  const getLast6MonthsTrend = () => {
    const trends = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      // ローカル時間で月の初日を取得
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      
      // タイムゾーンの影響を受けないように、手動で "YYYY-MM" 形式を作る
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${month}`;
      
      const balance = calculateMonthlyBalance(yearMonth);
      trends.push({ 
        month: date.toLocaleDateString('ja-JP', { month: 'short' }), 
        PL: balance.plBalance 
      });
    }
    return trends;
  };


  const addOrUpdateRecurring = (data) => {
    if (editingRecurring?.id) {
      setRecurringTransactions(recurringTransactions.map(r => 
        r.id === editingRecurring.id ? { ...data, id: r.id } : r
      ));
    } else {
      setRecurringTransactions([...recurringTransactions, { ...data, id: Date.now() }]);
    }
    setShowRecurringModal(false);
    setEditingRecurring(null);
  };

  const deleteRecurring = (id) => {
    if (!confirm('この定期支払いを削除しますか？')) return;
    setRecurringTransactions(recurringTransactions.filter(r => r.id !== id));
  };
  const runMonteCarloSimulation = (numSimulations = 100) => {
    const { years, monthlyInvestment, monthlySavings, savingsInterestRate, returnRate, useNisa, useLumpSum, lumpSumAmount, lumpSumMonths, riskProfile } = simulationSettings;
    
    const volatility = riskProfiles[riskProfile]?.volatility || 0.10;
    const monthlyRate = returnRate / 100 / 12;
    const savingsMonthlyRate = savingsInterestRate / 100 / 12;
    
    let allSimulations = [];
    
    for (let sim = 0; sim < numSimulations; sim++) {
      let regularInvestment = assetData.investments;
      let nisaInvestment = assetData.nisa || 0;
      let savings = assetData.savings;
      let dryPowder = assetData.dryPowder || 0;
      
      const NISA_TSUMITATE_LIMIT = 3600000;
      const NISA_GROWTH_LIMIT = 2400000;
      const NISA_TOTAL_LIMIT = 18000000;
      
      let nisaUsedThisYear = 0;
      let nisaTotalUsed = nisaInvestment;
      
      let simulationPath = [];
      
      for (let year = 1; year <= years; year++) {
        nisaUsedThisYear = 0;
        
        for (let month = 1; month <= 12; month++) {
          if (monthlySavings > 0) {
            savings += monthlySavings;
          }
          
          const savingsInterest = savings * savingsMonthlyRate;
          savings += savingsInterest;
          
          if (monthlyInvestment > 0) {
            if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < NISA_TSUMITATE_LIMIT) {
              const nisaSpace = Math.min(monthlyInvestment, NISA_TOTAL_LIMIT - nisaTotalUsed, NISA_TSUMITATE_LIMIT - nisaUsedThisYear);
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
          
          if (useLumpSum && lumpSumMonths.includes(month)) {
            if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < (NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT)) {
              const availableGrowth = NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT - nisaUsedThisYear;
              const nisaSpace = Math.min(lumpSumAmount, NISA_TOTAL_LIMIT - nisaTotalUsed, availableGrowth);
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
          
          const randomReturn = monthlyRate + (Math.random() - 0.5) * 2 * volatility / Math.sqrt(12);
          
          const nisaMonthlyProfit = nisaInvestment * randomReturn;
          const regularMonthlyProfit = regularInvestment * randomReturn;
          
          nisaInvestment += nisaMonthlyProfit;
          regularInvestment += regularMonthlyProfit;
          
          const currentDate = new Date();
          currentDate.setFullYear(currentDate.getFullYear() + year - 1);
          currentDate.setMonth(month - 1);
          const yearMonth = currentDate.toISOString().slice(0, 7);
          
          const eventsThisMonth = lifeEvents.filter(e => e.date === yearMonth);
          eventsThisMonth.forEach(event => {
            if (dryPowder >= event.amount) {
              dryPowder -= event.amount;
            } else if (savings >= event.amount) {
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
        
        const totalValue = savings + regularInvestment + nisaInvestment + dryPowder;
        simulationPath.push({
          year,
          totalValue: Math.round(totalValue)
        });
      }
      
      allSimulations.push(simulationPath);
    }
    
    const statistics = [];
    for (let year = 0; year < years; year++) {
      const yearValues = allSimulations.map(sim => sim[year].totalValue);
      statistics.push({
        year: year + 1,
        average: Math.round(yearValues.reduce((a, b) => a + b, 0) / numSimulations),
        min: Math.round(Math.min(...yearValues)),
        max: Math.round(Math.max(...yearValues)),
        p25: Math.round(yearValues.sort((a, b) => a - b)[Math.floor(numSimulations * 0.25)]),
        p75: Math.round(yearValues.sort((a, b) => a - b)[Math.floor(numSimulations * 0.75)])
      });
    }
    
    return statistics;
  };

  const calculateSimulation = () => {
    const { 
      years, monthlyInvestment, monthlySavings, 
      savingsInterestRate, returnRate, useNisa, 
      useLumpSum, lumpSumAmount, lumpSumMonths 
    } = simulationSettings;
    
    const monthlyRate = returnRate / 100 / 12;
    const savingsMonthlyRate = savingsInterestRate / 100 / 12;
    const TAX_RATE = 0.20315;
  
    let results = [];
    let regularInvestment = assetData.investments;
    let nisaInvestment = assetData.nisa || 0;
    let savings = assetData.savings;
    let dryPowder = assetData.dryPowder || 0;
    
    const NISA_TSUMITATE_LIMIT = 3600000;
    const NISA_GROWTH_LIMIT = 2400000;
    const NISA_TOTAL_LIMIT = 18000000;
  
    let nisaTotalUsed = nisaInvestment;
  
    for (let year = 1; year <= years; year++) {
      let nisaUsedThisYear = 0;
      let yearlyTaxSaved = 0;
      let yearlyProfit = 0;
  
      for (let month = 1; month <= 12; month++) {
        // 1. 預金の計算
        if (monthlySavings > 0) {
          savings += monthlySavings;
        }
        const savingsInterest = savings * savingsMonthlyRate;
        savings += savingsInterest;
  
        // 2. 投資元本の投入判定（NISA枠および生涯上限の管理）
        let currentMonthInvestment = 0;
        if (monthlyInvestment > 0) currentMonthInvestment += monthlyInvestment;
        if (useLumpSum && lumpSumMonths.includes(month)) currentMonthInvestment += lumpSumAmount;
  
        if (currentMonthInvestment > 0) {
          if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < (NISA_TSUMITATE_LIMIT + (useLumpSum ? NISA_GROWTH_LIMIT : 0))) {
            const availableYearlySpace = (NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT) - nisaUsedThisYear;
            const nisaSpace = Math.min(
              currentMonthInvestment, 
              NISA_TOTAL_LIMIT - nisaTotalUsed, 
              availableYearlySpace
            );
            
            nisaInvestment += nisaSpace;
            nisaTotalUsed += nisaSpace;
            nisaUsedThisYear += nisaSpace;
  
            const remaining = currentMonthInvestment - nisaSpace;
            if (remaining > 0) {
              regularInvestment += remaining;
            }
          } else {
            regularInvestment += currentMonthInvestment;
          }
        }
  
        // 3. 運用益の計算と税金の執行（特定口座のみ課税再投資）
        const nisaMonthlyProfit = nisaInvestment * monthlyRate;
        const regularMonthlyProfit = regularInvestment * monthlyRate;
        
        nisaInvestment += nisaMonthlyProfit;
        const regularTax = regularMonthlyProfit * TAX_RATE;
        regularInvestment += (regularMonthlyProfit - regularTax);
  
        yearlyProfit += nisaMonthlyProfit + regularMonthlyProfit;
        yearlyTaxSaved += regularTax;
  
        // 4. ライフイベントの控除（日付一致判定）
        const currentDate = new Date();
        currentDate.setFullYear(currentDate.getFullYear() + year - 1);
        currentDate.setMonth(month - 1);
        const yearMonth = currentDate.toISOString().slice(0, 7);
        
        const eventsThisMonth = lifeEvents.filter(e => e.date === yearMonth);
        eventsThisMonth.forEach(event => {
          if (dryPowder >= event.amount) {
            dryPowder -= event.amount;
          } else if (savings >= event.amount) {
            savings -= event.amount;
          } else {
            const fromSavings = savings;
            const remaining = event.amount - fromSavings;
            savings = 0;
            if (regularInvestment >= remaining) {
              regularInvestment -= remaining;
            } else {
              const fromRegular = regularInvestment;
              regularInvestment = 0;
              nisaInvestment = Math.max(0, nisaInvestment - (remaining - fromRegular));
            }
          }
        });
      }
  
      // --- ここからが「未来 vs 未来」の比較ロジック ---
      const totalValue = Number(savings) + Number(regularInvestment) + Number(nisaInvestment) + Number(dryPowder);
      
      // 同年代平均モデル：24歳(350万)をベースに、年6.5%で成長する層をベンチマーク（10年後で約660万）
      const peerAverage = 3500000 * Math.pow(1.065, year); 
      
      // 未来の予想資産額と、未来の平均との差額
      const diff = totalValue - peerAverage;
      const outperformRate = ((totalValue / peerAverage) - 1) * 100;
  
      // 順位ロジック（平均との比率の2乗で算出）
      const ratio = totalValue / peerAverage;
      let percentile = 50 / Math.pow(ratio, 2); 
      percentile = Math.max(0.1, Math.min(99, percentile));
  
      results.push({
        year,
        totalValue: Math.round(totalValue),
        savings: Math.round(savings),
        regularInvestment: Math.round(regularInvestment),
        nisaInvestment: Math.round(nisaInvestment),
        dryPowder: Math.round(dryPowder),
        peerAverage: Math.round(peerAverage),
        diff: Math.round(diff),
        outperformRate: outperformRate.toFixed(1),
        percentile: percentile.toFixed(1),
        nisaUsed: Math.round(nisaTotalUsed),
        taxSaved: Math.round(yearlyTaxSaved),
        yearlyProfit: Math.round(yearlyProfit)
      });
    }
  
    return results;
  };




  const simulationResults = calculateSimulation();
  const monteCarloResults = simulationSettings.showMonteCarloSimulation ? runMonteCarloSimulation(100) : [];
  const finalValue = simulationResults[simulationResults.length - 1]?.totalValue || 0;
  const achievement = Math.min((finalValue / simulationSettings.targetAmount) * 100, 100);
  const totalTaxSaved = simulationResults[simulationResults.length - 1]?.taxSaved || 0;

  // シミュレーション結果の年代別比較
  const futureAge = (userInfo?.age ? Number(userInfo.age) : 25) + simulationSettings.years;
  const futureBenchmark = calculateBenchmark(futureAge);

  const chartData = simulationResults.map(result => ({
    年: `${result.year}年`,
    貯金: result.savings,
    課税口座: result.regularInvestment,
    NISA: result.nisaInvestment,
    待機資金: result.dryPowder,
    合計: result.totalValue
  }));

  const monteCarloChartData = monteCarloResults.map(result => ({
    年: `${result.year}年`,
    平均: result.average,
    最小: result.min,
    最大: result.max,
    範囲下限: result.p25,
    範囲上限: result.p75
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

  const theme = {
    bg: darkMode ? 'bg-black' : 'bg-neutral-50',
    card: darkMode ? 'bg-neutral-900' : 'bg-white',
    cardGlass: darkMode ? 'glass-dark' : 'glass',
    text: darkMode ? 'text-neutral-100' : 'text-neutral-900',
    textSecondary: darkMode ? 'text-neutral-400' : 'text-neutral-500',
    border: darkMode ? 'border-neutral-800' : 'border-neutral-200',
    green: darkMode ? '#0CD664' : '#10b981',
    red: darkMode ? '#FF453A' : '#ef4444',
    accent: darkMode ? '#0A84FF' : '#3b82f6',
    purple: darkMode ? '#BF5AF2' : '#a855f7',
    orange: '#FF9F0A',
    chart: darkMode ? '#1C1C1E' : '#ffffff'
  };

  if (showSplash) {
    return (
      <div className={`fixed inset-0 ${darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-600 to-purple-600'} flex items-center justify-center z-50`}>
        <div className="text-center animate-fadeIn">
          <div className="mb-6 animate-pulse-once">
            <svg width="120" height="120" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#0A84FF', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#0CD664', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="115" fill="url(#grad)"/>
              <g transform="translate(256, 256)">
                <path d="M-140,-40 L-80,-60 L-20,20 L40,-80 L100,40 L140,0" stroke="white" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
                <path d="M-140,-40 L-80,-60 L-20,20 L40,-80 L100,40 L140,0 L140,120 L-140,120 Z" fill="white" opacity="0.15"/>
                <circle cx="-140" cy="-40" r="8" fill="white"/>
                <circle cx="-80" cy="-60" r="8" fill="white"/>
                <circle cx="-20" cy="20" r="8" fill="white"/>
                <circle cx="40" cy="-80" r="8" fill="white"/>
                <circle cx="100" cy="40" r="8" fill="white"/>
                <circle cx="140" cy="0" r="8" fill="white"/>
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Money Planner</h1>
          <p className="text-white text-opacity-80 text-sm">あなたの未来をデザインする</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} pb-20 transition-all duration-300`}>
      <div className={`${darkMode ? 'bg-neutral-900' : 'bg-white'} border-b ${theme.border} transition-colors duration-300`}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-xl font-semibold ${theme.text} tracking-tight`}>
                Money Planner
                {userInfo?.name && <span className={`text-sm ml-2 font-normal ${theme.textSecondary}`}>{userInfo.name}</span>}
              </h1>
              <p className={`text-xs ${theme.textSecondary} font-medium tabular-nums`}>
                {new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}
              >
                {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-neutral-600" />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}
              >
                <Settings size={18} className={theme.text} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-3">
        {activeTab === 'home' && (
          <div className="space-y-3 animate-fadeIn">
            <button
              onClick={() => setShowAssetEditModal(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs ${theme.textSecondary} font-medium uppercase tracking-wide`}>Total Assets</p>
                <Edit2 size={14} className={theme.textSecondary} />
              </div>
              <p className={`text-4xl font-bold ${theme.text} mb-3 tabular-nums tracking-tight`}>
                ¥{(assetData.savings + assetData.investments + (assetData.nisa || 0) + (assetData.dryPowder || 0)).toLocaleString()}
              </p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium`}>貯金</p>
                  <p className={`text-base font-semibold ${theme.text} tabular-nums`}>¥{(assetData.savings / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium`}>投資</p>
                  <p className={`text-base font-semibold ${theme.text} tabular-nums`}>¥{(assetData.investments / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium`}>NISA</p>
                  <p className={`text-base font-semibold tabular-nums`} style={{ color: theme.green }}>¥{((assetData.nisa || 0) / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium flex items-center gap-1`}>
                    <Droplets size={10} style={{ color: theme.accent }} />
                    待機
                  </p>
                  <p className={`text-base font-semibold tabular-nums`} style={{ color: theme.accent }}>¥{((assetData.dryPowder || 0) / 10000).toFixed(0)}万</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowBenchmark(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-xs ${theme.textSecondary} mb-1 font-medium uppercase tracking-wide`}>
                    {getAgeGroup() === '20s' ? '20代' : getAgeGroup() === '30s' ? '30代' : getAgeGroup() === '40s' ? '40代' : getAgeGroup() === '50s' ? '50代' : '60代以上'}平均と比較
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold tabular-nums`} style={{ 
                      color: calculateBenchmark().isAboveAverage ? theme.green : theme.red 
                    }}>
                      {calculateBenchmark().isAboveAverage ? '+' : ''}{(calculateBenchmark().difference / 10000).toFixed(0)}万円
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold`} style={{
                      backgroundColor: calculateBenchmark().isAboveAverage ? 'rgba(12, 214, 100, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                      color: calculateBenchmark().isAboveAverage ? theme.green : theme.red
                    }}>
                      上位{(100 - calculateBenchmark().percentile).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </button>

            <button
              onClick={() => setShowBudgetModal(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={16} style={{ color: theme.accent }} />
                  <p className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>今月の予算vs実績</p>
                </div>
                <Settings size={16} className={theme.textSecondary} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className={`text-xs ${theme.textSecondary} mb-1`}>収入（PL）</p>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-lg font-bold tabular-nums`} style={{ 
                      color: budgetAnalysis.income.difference >= 0 ? theme.green : theme.red 
                    }}>
                      ¥{(budgetAnalysis.income.actual / 10000).toFixed(0)}万
                    </p>
                    <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                      / {(budgetAnalysis.income.budgeted / 10000).toFixed(0)}万
                    </p>
                  </div>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary} mb-1`}>支出（PL）</p>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-lg font-bold tabular-nums`} style={{ 
                      color: budgetAnalysis.expense.difference <= 0 ? theme.green : theme.red 
                    }}>
                      ¥{(budgetAnalysis.expense.actual / 10000).toFixed(0)}万
                    </p>
                    <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                      / {(budgetAnalysis.expense.budgeted / 10000).toFixed(0)}万
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3 space-y-2`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme.textSecondary}`}>PL（発生ベース）</span>
                  <span className={`text-sm font-bold tabular-nums`} style={{ 
                    color: currentBalance.plBalance >= 0 ? theme.green : theme.red 
                  }}>
                    {currentBalance.plBalance >= 0 ? '+' : ''}¥{currentBalance.plBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme.textSecondary}`}>CF（現金ベース）</span>
                  <span className={`text-sm font-bold tabular-nums`} style={{ 
                    color: currentBalance.cfBalance >= 0 ? theme.green : theme.red 
                  }}>
                    {currentBalance.cfBalance >= 0 ? '+' : ''}¥{currentBalance.cfBalance.toLocaleString()}
                  </span>
                </div>
                {currentBalance.unsettledCredit > 0 && (
                  <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${darkMode ? '#2C2C2E' : '#e5e7eb'}` }}>
                    <span className={`text-xs ${theme.textSecondary}`}>未確定クレジット</span>
                    <span className={`text-xs font-semibold tabular-nums`} style={{ color: theme.orange }}>
                      ¥{currentBalance.unsettledCredit.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme.textSecondary}`}>投資計画額</span>
                    <span className={`text-sm font-bold tabular-nums ${theme.text}`}>
                      ¥{budgetAnalysis.investment.planned.toLocaleString()}
                    </span>
                  </div>
                  {budgetAnalysis.investment.needsWithdrawal && (
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs ${theme.textSecondary}`}>貯金から取り崩し</span>
                      <span className={`text-xs font-semibold tabular-nums`} style={{ color: theme.orange }}>
                        ¥{budgetAnalysis.investment.withdrawalAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${theme.textSecondary}`}>実行可能性</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold`} style={{
                      backgroundColor: budgetAnalysis.investment.needsWithdrawal ? 'rgba(255, 159, 10, 0.2)' : 'rgba(12, 214, 100, 0.2)',
                      color: budgetAnalysis.investment.needsWithdrawal ? theme.orange : theme.green
                    }}>
                      {budgetAnalysis.investment.needsWithdrawal ? '⚠ 貯金取崩' : '✓ CF内で可能'}
                    </span>
                  </div>
                </div>
              </div>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <div className={`${theme.cardGlass} rounded-xl p-3 transition-all duration-200 hover-scale`}>
                <p className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>収入</p>
                <p className="text-base font-bold tabular-nums" style={{ color: theme.green }}>
                  ¥{(currentBalance.plIncome / 10000).toFixed(1)}万
                </p>
              </div>
              <div className={`${theme.cardGlass} rounded-xl p-3 transition-all duration-200 hover-scale`}>
                <p className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>支出</p>
                <p className="text-base font-bold tabular-nums" style={{ color: theme.red }}>
                  ¥{(currentBalance.plExpense / 10000).toFixed(1)}万
                </p>
              </div>
              <div className={`${theme.cardGlass} rounded-xl p-3 transition-all duration-200 hover-scale`}>
                <p className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>収支</p>
                <p className={`text-base font-bold tabular-nums`} style={{ color: currentBalance.plBalance >= 0 ? theme.green : theme.red }}>
                  {currentBalance.plBalance >= 0 ? '+' : ''}¥{(currentBalance.plBalance / 10000).toFixed(1)}万
                </p>
              </div>
            </div>

            {unsettledCredit.length > 0 && (
              <div className={`${theme.cardGlass} rounded-xl p-4 border transition-all duration-200 animate-slideUp`} style={{ borderColor: theme.orange }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${theme.text}`}>💳 未確定のクレジット</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: theme.orange }}>
                      ¥{totalUnsettledCredit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} flex items-center gap-2 uppercase tracking-wide`}>
                  <PlusCircle size={16} style={{ color: theme.accent }} />
                  Add Transaction
                </h2>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition-all duration-200 hover-scale ${
                    darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  + カテゴリ
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category: '' })}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      newTransaction.type === 'expense' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: newTransaction.type === 'expense' ? theme.red : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: newTransaction.type === 'expense' ? '#fff' : theme.textSecondary
                    }}
                  >
                    支出
                  </button>
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category: '' })}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      newTransaction.type === 'income' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: newTransaction.type === 'income' ? theme.green : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: newTransaction.type === 'income' ? '#fff' : theme.textSecondary
                    }}
                  >
                    収入
                  </button>
                </div>

                {newTransaction.type === 'expense' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: 'credit' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover-scale ${
                        newTransaction.paymentMethod === 'credit'
                          ? 'bg-orange-500 text-white'
                          : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      💳 クレジット
                    </button>
                    <button
                      onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: 'cash' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover-scale ${
                        newTransaction.paymentMethod === 'cash'
                          ? 'bg-green-500 text-white'
                          : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      💵 現金
                    </button>
                  </div>
                )}

                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-base appearance-none transition-all duration-200 ${
                    darkMode 
                      ? 'bg-neutral-800 text-white border border-neutral-700' 
                      : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                />

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="金額"
                  value={newTransaction.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewTransaction({ ...newTransaction, amount: value });
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-base tabular-nums transition-all duration-200 focus:scale-105 ${
                    darkMode 
                      ? 'bg-neutral-800 text-white border border-neutral-700 focus:border-blue-500' 
                      : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />

                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    darkMode 
                      ? 'bg-neutral-800 text-white border border-neutral-700' 
                      : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                >
                  <option value="">カテゴリを選択</option>
                  {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={addTransaction}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  追加する
                </button>
              </div>
            </div>

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>定期支払い</h2>
                <button
                  onClick={() => {
                    setEditingRecurring(null);
                    setShowRecurringModal(true);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  + 追加
                </button>
              </div>

              {recurringTransactions.length === 0 ? (
                <p className={`${theme.textSecondary} text-center py-3 text-sm`}>定期支払いを追加</p>
              ) : (
                <div className="space-y-2">
                  {recurringTransactions.map((recurring, idx) => (
                    <div key={recurring.id} className={`flex items-center justify-between p-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg animate-fadeIn`} style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-base">{recurring.type === 'investment' ? '📈' : '🔄'}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${theme.text}`}>{recurring.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>毎月{recurring.day}日</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold tabular-nums ${theme.text}`}>
                          ¥{recurring.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => {
                            setEditingRecurring(recurring);
                            setShowRecurringModal(true);
                          }}
                          className="text-blue-500 transition-transform duration-200 hover:scale-110"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteRecurring(recurring.id)}
                          className="text-red-500 transition-transform duration-200 hover:scale-110"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {calculateCategoryExpenses().length > 0 && (
              <div className={`${theme.cardGlass} rounded-xl p-4 transition-all duration-200`}>
                <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>今月の支出内訳（PL）</h2>
                
                <div className="space-y-2">
                  {calculateCategoryExpenses().map((item, index) => {
                    const total = calculateCategoryExpenses().reduce((sum, i) => sum + i.amount, 0);
                    const percentage = (item.amount / total * 100).toFixed(1);
                    const budgetData = budgetAnalysis.categoryComparison[item.category];
                    
                    return (
                      <div key={item.category} className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${theme.text} font-medium`}>{item.category}</span>
                          <div className="flex items-center gap-2">
                            {budgetData && (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium`} style={{
                                backgroundColor: budgetData.difference <= 0 ? 'rgba(12, 214, 100, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                                color: budgetData.difference <= 0 ? theme.green : theme.red
                              }}>
                                {budgetData.percentage.toFixed(0)}%
                              </span>
                            )}
                            <span className={`text-xs ${theme.textSecondary} tabular-nums`}>{percentage}%</span>
                            <span className={`text-sm font-semibold ${theme.text} tabular-nums`}>
                              ¥{item.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className={`w-full ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'} rounded-full h-1.5 overflow-hidden`}>
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: budgetData && budgetData.difference > 0 ? theme.red : theme.green
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>最近の取引</h2>
              <div className="space-y-1">
                {transactions.slice(0, 8).map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => setEditingTransaction(t)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 hover-scale animate-fadeIn ${
                      darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'
                    }`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-base">
                        {t.isRecurring ? '🔄' : t.isSettlement ? '💸' : t.type === 'income' ? '💰' : (t.paymentMethod === 'credit' ? '💳' : '💵')}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${theme.text}`}>{t.category}</p>
                        <p className={`text-xs ${theme.textSecondary} tabular-nums`}>{t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!t.settled && t.type === 'expense' && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: theme.orange, color: '#000' }}>
                          未確定
                        </span>
                      )}
                      <p className={`text-sm font-bold tabular-nums`} style={{ color: t.amount >= 0 ? theme.green : theme.red }}>
                        {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {!monthlyHistory[currentMonth] && currentBalance.cfBalance !== 0 && (
                <button
                  onClick={() => {
                    const cfBalance = currentBalance.cfBalance;
                    const plannedTotal = simulationSettings.monthlyInvestment + simulationSettings.monthlySavings;
                    
                    if (cfBalance >= plannedTotal) {
                      setCloseMonthData({ 
                        savedAmount: cfBalance - simulationSettings.monthlyInvestment, 
                        investAmount: simulationSettings.monthlyInvestment, 
                        dryPowderAmount: 0 
                      });
                    } else {
                      setCloseMonthData({ 
                        savedAmount: 0, 
                        investAmount: simulationSettings.monthlyInvestment, 
                        dryPowderAmount: 0 
                      });
                    }
                    setShowCloseMonthModal(true);
                  }}
                  className="w-full mt-3 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  今月を締める
                </button>
              )}
            </div>
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="space-y-3 animate-fadeIn">
            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    const date = new Date(selectedMonth + '-01');
                    date.setMonth(date.getMonth() - 1);
                    setSelectedMonth(date.toISOString().slice(0, 7));
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                >
                  <span className={theme.text}>◀</span>
                </button>
                <h2 className={`text-base font-semibold ${theme.text} tracking-tight`}>
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
                  className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                >
                  <span className={theme.text}>▶</span>
                </button>
              </div>

              <div className="mb-3">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                    <div key={day} className={`text-center text-xs font-semibold py-1 ${
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
                      <button
                        key={day}
                        onClick={() => {
                          if (hasTransactions) {
                            setSelectedDate(`${selectedMonth}-${String(day).padStart(2, '0')}`);
                            setShowDateTransactionsModal(true);
                          }
                        }}
                        className={`aspect-square border rounded-lg p-1 transition-all duration-200 ${
                          hasTransactions ? 'hover-scale cursor-pointer' : ''
                        } ${
                          isToday 
                            ? darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-20' : 'border-blue-500 bg-blue-50'
                            : darkMode ? 'border-neutral-800' : 'border-neutral-200'
                        } ${hasTransactions ? (darkMode ? 'bg-neutral-800' : 'bg-neutral-50') : ''}`}
                      >
                        <div className={`text-xs font-semibold ${isToday ? 'text-blue-500' : theme.text}`}>
                          {day}
                        </div>
                        {hasTransactions && (
                          <div className="mt-0.5">
                            {dayBalance.income > 0 && (
                              <div className="text-[8px] leading-tight tabular-nums" style={{ color: theme.green }}>
                                +{(dayBalance.income / 1000).toFixed(0)}k
                              </div>
                            )}
                            {dayBalance.expense > 0 && (
                              <div className="text-[8px] leading-tight tabular-nums" style={{ color: theme.red }}>
                                -{(dayBalance.expense / 1000).toFixed(0)}k
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="text-center mb-2">
                  <div className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>PL（発生ベース）</div>
                  <div className="text-xl font-bold tabular-nums" style={{ 
                    color: calculateMonthlyBalance(selectedMonth).plBalance >= 0 ? theme.green : theme.red 
                  }}>
                    {calculateMonthlyBalance(selectedMonth).plBalance >= 0 ? '+' : ''}
                    ¥{calculateMonthlyBalance(selectedMonth).plBalance.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center border-t pt-2" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div>
                    <div className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>収入</div>
                    <div className="text-sm font-bold tabular-nums" style={{ color: theme.green }}>
                      ¥{calculateMonthlyBalance(selectedMonth).plIncome.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>支出</div>
                    <div className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>
                      ¥{calculateMonthlyBalance(selectedMonth).plExpense.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>過去6ヶ月の推移（PL）</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={getLast6MonthsTrend()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                  <XAxis 
                    dataKey="month" 
                    stroke={darkMode ? '#737373' : '#a3a3a3'} 
                    style={{ fontSize: '11px', fontWeight: 500 }} 
                  />
                  <YAxis 
                    stroke={darkMode ? '#737373' : '#a3a3a3'} 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                  />
                  <Tooltip 
                    formatter={(value) => `¥${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#171717' : '#fff', 
                      border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, 
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: darkMode ? '#fff' : '#000'
                    }}
                  />
                  <Bar dataKey="PL" fill={theme.accent} name="PL（発生）" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="space-y-3 animate-fadeIn">
            <button
              onClick={() => setShowAssetEditModal(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs ${theme.textSecondary} font-medium uppercase tracking-wide`}>Current Assets</p>
                <Edit2 size={14} className={theme.textSecondary} />
              </div>
              <p className={`text-4xl font-bold ${theme.text} mb-3 tabular-nums tracking-tight`}>
                ¥{(assetData.savings + assetData.investments + (assetData.nisa || 0) + (assetData.dryPowder || 0)).toLocaleString()}
              </p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium`}>貯金</p>
                  <p className={`text-base font-semibold ${theme.text} tabular-nums`}>¥{(assetData.savings / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium`}>投資</p>
                  <p className={`text-base font-semibold ${theme.text} tabular-nums`}>¥{(assetData.investments / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium`}>NISA</p>
                  <p className={`text-base font-semibold tabular-nums`} style={{ color: theme.green }}>¥{((assetData.nisa || 0) / 10000).toFixed(0)}万</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.textSecondary} font-medium flex items-center gap-1`}>
                    <Droplets size={10} style={{ color: theme.accent }} />
                    待機
                  </p>
                  <p className={`text-base font-semibold tabular-nums`} style={{ color: theme.accent }}>¥{((assetData.dryPowder || 0) / 10000).toFixed(0)}万</p>
                </div>
              </div>
            </button>

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide flex items-center gap-2`}>
                <Zap size={16} style={{ color: theme.accent }} />
                投資スタイル
              </h2>
              
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(riskProfiles).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => applyRiskProfile(key)}
                    className={`p-3 rounded-lg transition-all duration-200 hover-scale ${
                      simulationSettings.riskProfile === key ? 'ring-2 scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: simulationSettings.riskProfile === key 
                        ? (darkMode ? '#262626' : '#f5f5f5')
                        : (darkMode ? '#171717' : '#fafafa'),
                      ringColor: theme.accent
                    }}
                  >
                    <div className="text-2xl mb-1">{profile.icon}</div>
                    <div className={`text-xs font-semibold ${theme.text}`}>{profile.label}</div>
                    <div className={`text-xs ${theme.textSecondary} mt-1`}>{profile.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>設定</h2>
              
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
                    月々の貯金: ¥{simulationSettings.monthlySavings.toLocaleString()}
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
                </div>

                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                    月々の積立投資: ¥{simulationSettings.monthlyInvestment.toLocaleString()}
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

                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                    預金金利: {simulationSettings.savingsInterestRate}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={simulationSettings.savingsInterestRate}
                    onChange={(e) => setSimulationSettings({ ...simulationSettings, savingsInterestRate: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>普通預金・定期預金の金利を設定</p>
                </div>

                <div className="border-t pt-3" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-medium ${theme.text}`}>新NISA制度を利用</label>
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

                <div className="border-t pt-3" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-medium ${theme.text}`}>成長投資（一括）</label>
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
                        <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>投資月を選択</label>
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
                        <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                          年間合計: ¥{(simulationSettings.lumpSumAmount * (simulationSettings.lumpSumMonths?.length || 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className={`text-xs font-medium ${theme.text}`}>100通りの未来予測</label>
                      <p className={`text-xs ${theme.textSecondary}`}>相場の荒波を考慮</p>
                    </div>
                    <button
                      onClick={() => setSimulationSettings({ ...simulationSettings, showMonteCarloSimulation: !simulationSettings.showMonteCarloSimulation })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        simulationSettings.showMonteCarloSimulation ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          simulationSettings.showMonteCarloSimulation ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {simulationSettings.showMonteCarloSimulation && (
                    <div className={`${darkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'} rounded-lg p-2 text-xs`}>
                      <p className={`${darkMode ? 'text-blue-400' : 'text-blue-800'} font-bold mb-1`}>📊 相場の振れ幅</p>
                      <p className={darkMode ? 'text-gray-400' : 'text-blue-700'}>
                        市場の変動を100回シミュレーション。<br/>
                        最も起こりそうな範囲を表示します。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>Life Events</h2>
                <button
                  onClick={() => {
                    setEditingLifeEvent(null);
                    setShowLifeEventModal(true);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  + 追加
                </button>
              </div>

              {lifeEvents.length === 0 ? (
                <p className={`${theme.textSecondary} text-center py-3 text-sm`}>イベントを追加</p>
              ) : (
                <div className="space-y-2">
                  {lifeEvents.sort((a, b) => a.date.localeCompare(b.date)).map((event, idx) => (
                    <div key={event.id} className={`flex items-center justify-between p-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg animate-fadeIn`} style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{event.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${theme.text}`}>{event.name}</p>
                          <p className={`text-xs ${theme.textSecondary} tabular-nums`}>{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>
                          ¥{event.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => {
                            setEditingLifeEvent(event);
                            setShowLifeEventModal(true);
                          }}
                          className="text-blue-500 transition-transform duration-200 hover:scale-110"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteLifeEvent(event.id)}
                          className="text-red-500 transition-transform duration-200 hover:scale-110"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>
                {simulationSettings.years}年後の予測
              </h2>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-green-50'} rounded-xl p-4 mb-3`}>
                <p className={`text-xs ${theme.textSecondary} mb-1 font-medium uppercase tracking-wide`}>予想資産額</p>
                <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: theme.green }}>
                  ¥{finalValue.toLocaleString()}
                </p>
                <div className={`w-full ${darkMode ? 'bg-neutral-700' : 'bg-neutral-200'} rounded-full h-2 my-2 overflow-hidden`}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${achievement}%`,
                      backgroundColor: theme.green
                    }}
                  />
                </div>
                <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                  目標達成率: {achievement.toFixed(1)}%
                </p>

                {simulationSettings.useNisa && (
                  <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${darkMode ? '#262626' : '#d1fae5'}` }}>
                    <p className="text-xs font-semibold tabular-nums" style={{ color: theme.green }}>
                      💰 NISA節税効果: 約¥{totalTaxSaved.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {achievement >= 100 ? (
                <div className={`${darkMode ? 'bg-neutral-800' : 'bg-green-50'} border-2 rounded-xl p-3 text-center mb-3 animate-pulse-once`} style={{ borderColor: theme.green }}>
                  <p className="text-xl mb-1">🎉</p>
                  <p className="text-sm font-semibold" style={{ color: theme.green }}>目標達成可能</p>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-neutral-800' : 'bg-orange-50'} border-2 rounded-xl p-3 mb-3`} style={{ borderColor: theme.orange }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: theme.orange }}>💡 追加投資が必要</p>
                  <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-orange-700'}`}>
                    月々約<span className="font-bold tabular-nums"> ¥{Math.ceil((simulationSettings.targetAmount - finalValue) / (simulationSettings.years * 12) / 1000) * 1000}</span>円
                  </p>
                </div>
              )}

              <div className="mb-4">
                {!simulationSettings.showMonteCarloSimulation && (
                  <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3 mb-3`}>
                    <h3 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide`}>
                      {simulationSettings.years}年後の資産構成
                    </h3>
                    <div className="flex gap-2 mb-2">
                      {(() => {
                        const lastResult = simulationResults[simulationResults.length - 1];
                        const total = lastResult?.totalValue || 1;
                        const savingsPercent = ((lastResult?.savings || 0) / total * 100).toFixed(1);
                        const investPercent = ((lastResult?.regularInvestment || 0) / total * 100).toFixed(1);
                        const nisaPercent = ((lastResult?.nisaInvestment || 0) / total * 100).toFixed(1);
                        const dryPowderPercent = ((lastResult?.dryPowder || 0) / total * 100).toFixed(1);
                        
                        return (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                                <span className={`text-xs ${theme.textSecondary}`}>貯金</span>
                              </div>
                              <p className="text-sm font-bold tabular-nums" style={{ color: '#3b82f6' }}>
                                {savingsPercent}%
                              </p>
                              <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                ¥{((lastResult?.savings || 0) / 10000).toFixed(0)}万
                              </p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#a855f7' }}></div>
                                <span className={`text-xs ${theme.textSecondary}`}>投資</span>
                              </div>
                              <p className="text-sm font-bold tabular-nums" style={{ color: '#a855f7' }}>
                                {investPercent}%
                              </p>
                              <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                ¥{((lastResult?.regularInvestment || 0) / 10000).toFixed(0)}万
                              </p>
                            </div>
                            {simulationSettings.useNisa && (
                              <div className="flex-1">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.green }}></div>
                                  <span className={`text-xs ${theme.textSecondary}`}>NISA</span>
                                </div>
                                <p className="text-sm font-bold tabular-nums" style={{ color: theme.green }}>
                                  {nisaPercent}%
                                </p>
                                <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                  ¥{((lastResult?.nisaInvestment || 0) / 10000).toFixed(0)}万
                                </p>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.accent }}></div>
                                <span className={`text-xs ${theme.textSecondary}`}>待機</span>
                              </div>
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>
                                {dryPowderPercent}%
                              </p>
                              <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                ¥{((lastResult?.dryPowder || 0) / 10000).toFixed(0)}万
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden flex">
                      {(() => {
                        const lastResult = simulationResults[simulationResults.length - 1];
                        const total = lastResult?.totalValue || 1;
                        const savingsPercent = ((lastResult?.savings || 0) / total * 100);
                        const investPercent = ((lastResult?.regularInvestment || 0) / total * 100);
                        const nisaPercent = ((lastResult?.nisaInvestment || 0) / total * 100);
                        const dryPowderPercent = ((lastResult?.dryPowder || 0) / total * 100);
                        
                        return (
                          <>
                            <div style={{ width: `${savingsPercent}%`, backgroundColor: '#3b82f6' }}></div>
                            <div style={{ width: `${investPercent}%`, backgroundColor: '#a855f7' }}></div>
                            {simulationSettings.useNisa && (
                              <div style={{ width: `${nisaPercent}%`, backgroundColor: theme.green }}></div>
                            )}
                            <div style={{ width: `${dryPowderPercent}%`, backgroundColor: theme.accent }}></div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <h3 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide`}>
                  {simulationSettings.showMonteCarloSimulation ? '100通りの未来予測' : '資産推移'}
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  {simulationSettings.showMonteCarloSimulation ? (
                    <AreaChart data={monteCarloChartData}>
                      <defs>
                        <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.accent} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={theme.accent} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                      <XAxis dataKey="年" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} />
                      <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip 
                        formatter={(value) => `¥${value.toLocaleString()}`}
                        contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 500 }}
                      />
                      <Area type="monotone" dataKey="最大" stroke="none" fill="none" />
                      <Area type="monotone" dataKey="範囲上限" stroke="none" fill={theme.accent} fillOpacity={0.2} />
                      <Area type="monotone" dataKey="範囲下限" stroke="none" fill={theme.accent} fillOpacity={0.2} />
                      <Line type="monotone" dataKey="平均" stroke={theme.accent} strokeWidth={3} dot={false} />
                    </AreaChart>
                  ) : (
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
                        <linearGradient id="colorDryPowder" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.accent} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={theme.accent} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                      <XAxis dataKey="年" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} />
                      <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 500 }} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                      <Area type="monotone" dataKey="貯金" stackId="1" stroke="#3b82f6" fill="url(#colorSavings)" />
                      <Area type="monotone" dataKey="課税口座" stackId="1" stroke="#a855f7" fill="url(#colorInvest)" />
                      {simulationSettings.useNisa && <Area type="monotone" dataKey="NISA" stackId="1" stroke={theme.green} fill="url(#colorNisa)" />}
                      <Area type="monotone" dataKey="待機資金" stackId="1" stroke={theme.accent} fill="url(#colorDryPowder)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      {showAssetEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>資産額を編集</h2>
              <button onClick={() => setShowAssetEditModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-4">
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
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{assetData.savings.toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>投資額（課税口座）</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.investments}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, investments: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{assetData.investments.toLocaleString()}</p>
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
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.nisa || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-1`}>
                  <Droplets size={14} style={{ color: theme.accent }} />
                  投資待機資金
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.dryPowder || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, dryPowder: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.dryPowder || 0).toLocaleString()}</p>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textSecondary}`}>総資産</span>
                  <span className={`text-lg font-bold ${theme.text} tabular-nums`}>
                    ¥{(assetData.savings + assetData.investments + (assetData.nisa || 0) + (assetData.dryPowder || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowAssetEditModal(false)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                style={{ backgroundColor: theme.accent }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>月間予算設定</h2>
              <button onClick={() => setShowBudgetModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>月間収入予定</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthlyBudget.income}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setMonthlyBudget({ ...monthlyBudget, income: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{monthlyBudget.income.toLocaleString()}</p>
              </div>

              <div className="border-t pt-4" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                <h3 className={`text-sm font-semibold ${theme.text} mb-3`}>カテゴリ別予算</h3>
                <div className="space-y-3">
                  {Object.entries(monthlyBudget.expenses).map(([category, amount]) => (
                    <div key={category}>
                      <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                        {category}: ¥{amount.toLocaleString()}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200000"
                        step="5000"
                        value={amount}
                        onChange={(e) => {
                          setMonthlyBudget({
                            ...monthlyBudget,
                            expenses: {
                              ...monthlyBudget.expenses,
                              [category]: Number(e.target.value)
                            }
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${theme.textSecondary}`}>予算合計</span>
                  <span className={`text-sm font-bold ${theme.text} tabular-nums`}>
                    ¥{Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textSecondary}`}>計画余剰</span>
                  <span className={`text-sm font-bold tabular-nums`} style={{ 
                    color: (monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0)) >= 0 ? theme.green : theme.red 
                  }}>
                    ¥{(monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBudgetModal(false)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                style={{ backgroundColor: theme.accent }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>カテゴリ管理</h2>
              <button onClick={() => setShowCategoryModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setNewCategoryType('expense')}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    newCategoryType === 'expense' ? 'scale-105 shadow-md' : 'hover-scale'
                  }`}
                  style={{
                    backgroundColor: newCategoryType === 'expense' ? theme.red : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                    color: newCategoryType === 'expense' ? '#fff' : theme.textSecondary
                  }}
                >
                  支出
                </button>
                <button
                  onClick={() => setNewCategoryType('income')}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    newCategoryType === 'income' ? 'scale-105 shadow-md' : 'hover-scale'
                  }`}
                  style={{
                    backgroundColor: newCategoryType === 'income' ? theme.green : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                    color: newCategoryType === 'income' ? '#fff' : theme.textSecondary
                  }}
                >
                  収入
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>新しいカテゴリ名</label>
                <input
                  type="text"
                  placeholder="例：サブスク"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <button
                onClick={addCustomCategory}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                style={{ backgroundColor: theme.accent }}
              >
                追加
              </button>

              {customCategories[newCategoryType].length > 0 && (
                <div className="border-t pt-4" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <h3 className={`text-sm font-semibold ${theme.text} mb-2`}>カスタムカテゴリ</h3>
                  <div className="space-y-2">
                    {customCategories[newCategoryType].map(cat => (
                      <div key={cat} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                        <span className={`text-sm ${theme.text}`}>{cat}</span>
                        <button
                          onClick={() => deleteCustomCategory(cat, newCategoryType)}
                          className="text-red-500 hover:scale-110 transition-transform"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {editingRecurring ? '定期支払いを編集' : '定期支払いを追加'}
              </h2>
              <button
                onClick={() => {
                  setShowRecurringModal(false);
                  setEditingRecurring(null);
                }}
                className={`text-2xl ${theme.textSecondary}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>名称</label>
                <input
                  type="text"
                  placeholder="例：家賃"
                  value={editingRecurring?.name || ''}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="80000"
                  value={editingRecurring?.amount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setEditingRecurring({ ...editingRecurring, amount: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                  ¥{(editingRecurring?.amount || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>カテゴリ</label>
                <select
                  value={editingRecurring?.category || ''}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, category: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                >
                  <option value="">選択してください</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>支払日（毎月）</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1"
                  value={editingRecurring?.day || ''}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, day: Number(e.target.value) })}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>種類</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'expense', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'expense' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'expense' ? theme.red : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'expense' ? '#fff' : theme.textSecondary
                    }}
                  >
                    固定費
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'investment', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'investment' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'investment' ? theme.purple : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'investment' ? '#fff' : theme.textSecondary
                    }}
                  >
                    投資積立
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!editingRecurring?.name || !editingRecurring?.amount || !editingRecurring?.category || !editingRecurring?.day) {
                    alert('全ての項目を入力してください');
                    return;
                  }
                  addOrUpdateRecurring(editingRecurring);
                }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                style={{ backgroundColor: theme.accent }}
              >
                {editingRecurring?.id ? '更新' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDateTransactionsModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {new Date(selectedDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}の取引
              </h2>
              <button onClick={() => {
                setShowDateTransactionsModal(false);
                setSelectedDate(null);
              }} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-2">
              {getTransactionsForDay(selectedDate.slice(0, 7), Number(selectedDate.slice(-2))).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setEditingTransaction(t);
                    setShowDateTransactionsModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover-scale ${
                    darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-base">
                      {t.isRecurring ? '🔄' : t.isSettlement ? '💸' : t.type === 'income' ? '💰' : (t.paymentMethod === 'credit' ? '💳' : '💵')}
                    </span>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${theme.text}`}>{t.category}</p>
                      {!t.settled && t.type === 'expense' && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block" style={{ backgroundColor: theme.orange, color: '#000' }}>
                          未確定
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-base font-bold tabular-nums`} style={{ color: t.amount >= 0 ? theme.green : theme.red }}>
                    {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowDateTransactionsModal(false);
                setSelectedDate(null);
              }}
              className="w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
              style={{ backgroundColor: theme.accent }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {showBenchmark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {getAgeGroup() === '20s' ? '20代' : getAgeGroup() === '30s' ? '30代' : getAgeGroup() === '40s' ? '40代' : getAgeGroup() === '50s' ? '50代' : '60代以上'}平均との比較
              </h2>
              <button onClick={() => setShowBenchmark(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-xl p-4 mb-4`}>
              <p className={`text-xs ${theme.textSecondary} mb-2 uppercase tracking-wide`}>あなたの順位</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-5xl font-bold tabular-nums`} style={{ 
                  color: calculateBenchmark().isAboveAverage ? theme.green : theme.red 
                }}>
                  {(100 - calculateBenchmark().percentile).toFixed(1)}
                </p>
                <span className={`text-2xl font-bold ${theme.text}`}>%</span>
              </div>
              <p className={`text-sm ${theme.textSecondary} mt-1`}>
                {calculateBenchmark().isAboveAverage ? '同世代の上位に位置しています' : 'まだ伸びしろがあります'}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${theme.textSecondary}`}>総資産</span>
                  <span className={`text-xs font-semibold`} style={{ 
                    color: calculateBenchmark().isAboveAverage ? theme.green : theme.red 
                  }}>
                    {calculateBenchmark().isAboveAverage ? '+' : ''}{(calculateBenchmark().difference / 10000).toFixed(0)}万円
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className={`text-xs ${theme.textSecondary} mb-1`}>あなた</p>
                    <p className={`text-base font-bold ${theme.text} tabular-nums`}>
                      ¥{(calculateBenchmark().myTotal / 10000).toFixed(0)}万
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme.textSecondary} mb-1`}>平均</p>
                    <p className={`text-base font-bold ${theme.text} tabular-nums`}>
                      ¥{(calculateBenchmark().avgTotal / 10000).toFixed(0)}万
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme.textSecondary} mb-1`}>中央値</p>
                    <p className={`text-base font-bold ${theme.text} tabular-nums`}>
                      ¥{(calculateBenchmark().medianTotal / 10000).toFixed(0)}万
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <p className={`text-sm ${theme.textSecondary} mb-2`}>資産構成の比較</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>貯金</span>
                      <span className={theme.text}>¥{(assetData.savings / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.savings / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full bg-blue-500" style={{ width: `${Math.min((assetData.savings / calculateBenchmark().benchmark.savings * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>投資</span>
                      <span className={theme.text}>¥{(assetData.investments / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.investments / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full bg-purple-500" style={{ width: `${Math.min((assetData.investments / calculateBenchmark().benchmark.investments * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>NISA</span>
                      <span className={theme.text}>¥{((assetData.nisa || 0) / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.nisa / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: theme.green, width: `${Math.min(((assetData.nisa || 0) / calculateBenchmark().benchmark.nisa * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>待機資金</span>
                      <span className={theme.text}>¥{((assetData.dryPowder || 0) / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.dryPowder / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: theme.accent, width: `${Math.min(((assetData.dryPowder || 0) / calculateBenchmark().benchmark.dryPowder * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBenchmark(false)}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
              style={{ backgroundColor: theme.accent }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      {showLifeEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {editingLifeEvent ? 'イベントを編集' : 'ライフイベントを追加'}
              </h2>
              <button
                onClick={() => {
                  setShowLifeEventModal(false);
                  setEditingLifeEvent(null);
                }}
                className={`text-2xl ${theme.textSecondary}`}
              >
                ✕
              </button>
            </div>

            {!editingLifeEvent && (
              <div className="mb-4">
                <p className={`text-sm ${theme.textSecondary} mb-3`}>テンプレートを選択</p>
                <div className="grid grid-cols-2 gap-2">
                  {lifeEventTemplates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => {
                        setEditingLifeEvent({
                          name: template.name,
                          amount: template.estimatedAmount,
                          icon: template.icon,
                          date: new Date().toISOString().slice(0, 7)
                        });
                      }}
                      className={`p-3 rounded-lg text-left transition-all duration-200 hover-scale ${
                        darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{template.icon}</div>
                      <p className={`text-xs font-semibold ${theme.text}`}>{template.name}</p>
                      {template.estimatedAmount > 0 && (
                        <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                          ¥{(template.estimatedAmount / 10000).toFixed(0)}万
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingLifeEvent && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>アイコン</label>
                  <div className="grid grid-cols-6 gap-2">
                    {eventIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setEditingLifeEvent({ ...editingLifeEvent, icon })}
                        className={`text-2xl p-2 rounded-lg transition-all duration-200 hover-scale ${
                          editingLifeEvent.icon === icon
                            ? 'bg-blue-500 scale-110'
                            : darkMode ? 'bg-neutral-800' : 'bg-neutral-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>イベント名</label>
                  <input
                    type="text"
                    value={editingLifeEvent.name || ''}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                    }`}
                    placeholder="例：結婚"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>予定金額</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingLifeEvent.amount || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditingLifeEvent({ ...editingLifeEvent, amount: Number(value) });
                    }}
                    className={`w-full px-4 py-2 rounded-lg tabular-nums ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                    }`}
                    placeholder="3000000"
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                    ¥{(editingLifeEvent.amount || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>予定時期</label>
                  <input
                    type="month"
                    value={editingLifeEvent.date || ''}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                    }`}
                  />
                </div>

                <button
                  onClick={() => {
                    if (!editingLifeEvent.name || !editingLifeEvent.date) {
                      alert('イベント名と予定時期を入力してください');
                      return;
                    }
                    addOrUpdateLifeEvent(editingLifeEvent);
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  {editingLifeEvent.id ? '更新' : '追加'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className={`fixed inset-0 ${darkMode ? 'bg-black' : 'bg-neutral-900'} flex items-center justify-center p-4 z-50 animate-fadeIn`}>
          <div className={`${theme.cardGlass} rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp`}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💰</div>
              <h1 className={`text-3xl font-bold ${theme.text} mb-2 tracking-tight`}>Money Planner</h1>
              <p className={theme.textSecondary}>基本情報を入力</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>お名前</label>
                <input
                  type="text"
                  placeholder="例：太郎"
                  value={userInfo?.name || ''}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>年齢</label>
                <input
                  type="number"
                  placeholder="25"
                  value={userInfo?.age || ''}
                  onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>現在の貯金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="500000"
                  value={assetData.savings}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, savings: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{assetData.savings.toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>投資額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="300000"
                  value={assetData.investments}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, investments: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{assetData.investments.toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>NISA投資額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={assetData.nisa || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, nisa: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.nisa || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-1`}>
                  <Droplets size={14} style={{ color: theme.accent }} />
                  投資待機資金
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={assetData.dryPowder || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, dryPowder: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.dryPowder || 0).toLocaleString()}</p>
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
              className="w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
              style={{ backgroundColor: theme.accent }}
            >
              始める
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>設定</h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>お名前</label>
                <input
                  type="text"
                  value={userInfo?.name || ''}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  }`}
                />
              </div>

              <div className="border-t pt-4" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                <h3 className={`text-sm font-semibold ${theme.text} mb-3`}>データのインポート</h3>
                <p className={`text-xs ${theme.textSecondary} mb-3`}>
                  他の家計簿アプリからCSVファイルをインポートできます
                </p>
                
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target.result;
                        
                        if (file.name.endsWith('.json')) {
                          const data = JSON.parse(content);
                          if (data.transactions) setTransactions(data.transactions);
                          if (data.assetData) setAssetData(data.assetData);
                          alert('インポートが完了しました！');
                        } else if (file.name.endsWith('.csv')) {
                          const lines = content.split('\n');
                          const imported = [];
                          
                          for (let i = 1; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (!line) continue;
                            
                            const [date, category, amount, type] = line.split(',');
                            if (!date || !category || !amount) continue;
                            
                            imported.push({
                              id: Date.now() + i,
                              date: date.trim(),
                              category: category.trim(),
                              amount: parseFloat(amount.trim()),
                              type: type?.trim() === 'income' ? 'income' : 'expense',
                              settled: true
                            });
                          }
                          
                          if (imported.length > 0) {
                            setTransactions([...imported, ...transactions]);
                            alert(`${imported.length}件の取引をインポートしました！`);
                          }
                        }
                      } catch (error) {
                        alert('ファイルの読み込みに失敗しました: ' + error.message);
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className={`w-full px-4 py-2 rounded-lg text-sm ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  }`}
                />
                
                <details className="mt-3">
                  <summary className={`text-xs ${theme.textSecondary} cursor-pointer hover:underline`}>
                    CSVフォーマット例
                  </summary>
                  <div className={`mt-2 p-2 rounded text-xs ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                    <code className={theme.text}>
                      date,category,amount,type<br/>
                      2026-02-01,食費,-1200,expense<br/>
                      2026-02-05,給料,250000,income<br/>
                      2026-02-10,交通費,-500,expense
                    </code>
                  </div>
                </details>

                <button
                  onClick={() => {
                    const exportData = {
                      transactions,
                      assetData,
                      userInfo,
                      monthlyHistory,
                      lifeEvents,
                      monthlyBudget,
                      customCategories,
                      recurringTransactions,
                      exportDate: new Date().toISOString()
                    };
                    
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `money-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover-scale ${
                    darkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  📥 データをエクスポート
                </button>
              </div>

              <button
                onClick={resetAllData}
                className="w-full px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.red }}
              >
                全データを削除
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 px-4 py-3 rounded-xl font-bold"
              style={{ backgroundColor: theme.accent, color: 'white' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {showCloseMonthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>今月を締める</h2>
            <p className={`${theme.textSecondary} mb-2`}>
              今月のPL（発生ベース）: <span className="font-bold" style={{ color: currentBalance.plBalance >= 0 ? theme.green : theme.red }}>¥{currentBalance.plBalance.toLocaleString()}</span>
            </p>
            <p className={`${theme.textSecondary} mb-4`}>
              今月のCF（現金ベース）: <span className="font-bold" style={{ color: currentBalance.cfBalance >= 0 ? theme.green : theme.red }}>¥{currentBalance.cfBalance.toLocaleString()}</span>
            </p>

            {budgetAnalysis.investment.needsWithdrawal && (
              <div className={`${darkMode ? 'bg-orange-900 bg-opacity-20' : 'bg-orange-50'} rounded-lg p-3 mb-4 border`} style={{ borderColor: theme.orange }}>
                <p className={`text-sm font-semibold mb-1`} style={{ color: theme.orange }}>⚠ 投資計画のお知らせ</p>
                <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-orange-700'}`}>
                  今月のCFだけでは投資計画を達成できません。<br/>
                  貯金から<span className="font-bold">¥{budgetAnalysis.investment.withdrawalAmount.toLocaleString()}</span>を取り崩して投資します。
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  投資に回す金額: ¥{closeMonthData.investAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(currentBalance.cfBalance, simulationSettings.monthlyInvestment)}
                  step="1000"
                  value={closeMonthData.investAmount}
                  onChange={(e) => {
                    const investAmount = Number(e.target.value);
                    const remaining = currentBalance.cfBalance - investAmount - closeMonthData.dryPowderAmount;
                    setCloseMonthData({
                      ...closeMonthData,
                      investAmount,
                      savedAmount: remaining
                    });
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-1`}>
                  <Droplets size={14} style={{ color: theme.accent }} />
                  待機資金に回す金額: ¥{closeMonthData.dryPowderAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max={currentBalance.cfBalance - closeMonthData.investAmount}
                  step="1000"
                  value={closeMonthData.dryPowderAmount}
                  onChange={(e) => {
                    const dryPowderAmount = Number(e.target.value);
                    const remaining = currentBalance.cfBalance - closeMonthData.investAmount - dryPowderAmount;
                    setCloseMonthData({
                      ...closeMonthData,
                      dryPowderAmount,
                      savedAmount: remaining
                    });
                  }}
                  className="w-full"
                />
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-4 space-y-2`}>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>貯金へ</span>
                  <span className="font-bold tabular-nums" style={{ color: '#3b82f6' }}>
                    {closeMonthData.savedAmount >= 0 ? '+' : ''}¥{closeMonthData.savedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>投資へ</span>
                  <span className="font-bold tabular-nums" style={{ color: '#a855f7' }}>¥{closeMonthData.investAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>待機資金へ</span>
                  <span className="font-bold tabular-nums" style={{ color: theme.accent }}>¥{closeMonthData.dryPowderAmount.toLocaleString()}</span>
                </div>
                {closeMonthData.savedAmount < 0 && (
                  <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${darkMode ? '#2C2C2E' : '#e5e7eb'}` }}>
                    <span className={`text-xs ${theme.textSecondary}`}>貯金から取崩</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: theme.orange }}>
                      ¥{Math.abs(closeMonthData.savedAmount).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseMonthModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-bold ${
                  darkMode ? 'bg-neutral-800 text-white' : 'border-2 border-neutral-300 text-neutral-700'
                }`}
              >
                キャンセル
              </button>
              <button
                onClick={closeMonth}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.accent }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>取引を編集</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense', amount: -Math.abs(editingTransaction.amount) })}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    editingTransaction.type === 'expense' 
                      ? darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white' 
                      : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income', amount: Math.abs(editingTransaction.amount) })}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    editingTransaction.type === 'income' 
                      ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white' 
                      : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  収入
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
                  className={`w-full px-4 py-2 rounded-lg tabular-nums ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>カテゴリ</label>
                <select
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  }`}
                >
                  {(editingTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
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
                  className={`w-full px-2 py-2 rounded-lg text-sm ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'
                  }`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }}
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
                  darkMode ? 'bg-neutral-800 text-white' : 'border-2 border-neutral-300 text-neutral-700'
                }`}
              >
                ✕
              </button>
              <button
                onClick={() => updateTransaction(editingTransaction)}
                className="col-span-2 px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.accent }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-neutral-900' : 'bg-white'} border-t ${theme.border} transition-colors duration-300`}>
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200 ${
              activeTab === 'home' ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{ color: activeTab === 'home' ? theme.accent : theme.textSecondary }}
          >
            <DollarSign size={22} />
            <span className="text-xs font-medium">家計簿</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200 ${
              activeTab === 'calendar' ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{ color: activeTab === 'calendar' ? theme.accent : theme.textSecondary }}
          >
            <Calendar size={22} />
            <span className="text-xs font-medium">履歴</span>
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200 ${
              activeTab === 'simulation' ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{ color: activeTab === 'simulation' ? theme.accent : theme.textSecondary }}
          >
            <TrendingUp size={22} />
            <span className="text-xs font-medium">シミュレーション</span>
          </button>
        </div>
      </div>
    </div>
  );
}
