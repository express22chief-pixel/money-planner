import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, TrendingUp, Calendar, DollarSign, Sun, Moon, Zap, Droplets, Target, Settings, Edit2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';

// 設定タブ用アコーディオン（コンポーネント外定義でパフォーマンス最適化）
function AccSection({ id, title, icon, children, expanded, onToggle, darkMode, theme }) {
  return (
    <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{icon}</span>
          <span className={`text-sm font-semibold ${theme.text}`}>{title}</span>
        </div>
        <span
          className={`text-xs transition-transform duration-200 ${theme.textSecondary}`}
          style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >▼</span>
      </button>
      {expanded && (
        <div className={`px-4 pb-4 border-t ${theme.border} animate-fadeIn`}>
          {children}
        </div>
      )}
    </div>
  );
}

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

  // iOSズーム防止: inputのfont-sizeを16px以上に固定 + viewport設定
  useEffect(() => {
    // viewport meta を maximum-scale=1 に更新
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = document.createElement('meta');
      vp.name = 'viewport';
      document.head.appendChild(vp);
    }
    vp.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

    // input/select/textarea の font-size を 16px に固定するスタイルを注入
    const styleId = 'ios-zoom-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        input, select, textarea {
          font-size: 16px !important;
        }
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          select, textarea, input {
            font-size: 16px !important;
          }
        }

        /* === スムーズアニメーション強化 === */

        /* フェードイン（少し上から） */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* モーダルのスライドアップ */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* ホバー・タップ時のスケール */
        .hover-scale {
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.15s ease;
        }
        .hover-scale:active {
          transform: scale(0.95);
          opacity: 0.85;
        }

        /* ボタン全般のタップフィードバック */
        button {
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button:active {
          transform: scale(0.96);
          opacity: 0.82;
        }

        /* カードのhover */
        .glass, .glass-dark {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        /* transition-all の duration を統一 */
        .transition-all {
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* トグル展開のスムーズさ */
        .duration-200 {
          transition-duration: 220ms !important;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .duration-300 {
          transition-duration: 320ms !important;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
        }

        /* スクロールの慣性 */
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* 数値のフォント統一 */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }
      `;
      document.head.appendChild(style);
    }
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialPage, setTutorialPage] = useState(0);
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showAssetEditModal, setShowAssetEditModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
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

  const DEFAULT_EXPENSE_CATEGORIES = ['食費', '住居費', '光熱費', '通信費', '交通費', '娯楽費', '医療費', '教育費', '被服費', 'その他'];
  const DEFAULT_INCOME_CATEGORIES = ['給料', 'ボーナス', '副業', '投資収益', '年金', 'その他'];

  const [customCategories, setCustomCategories] = useState(() =>
    loadFromStorage('customCategories', {
      expense: [],
      income: [],
      // デフォルトカテゴリの削除・名前変更を管理
      deletedDefaults: { expense: [], income: [] },
      renamedDefaults: { expense: {}, income: {} }
    })
  );

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    type: 'expense',
    paymentMethod: 'credit',
    date: new Date().toISOString().slice(0, 10),
    memo: '',
    isSplit: false,
    splitMembers: [],
    cardId: null
  });

  // クレジットカード設定 state: { id, name, closingDay, paymentDay }
  // closingDay: 締め日, paymentDay: 引き落とし日（翌月or翌々月かも設定）
  const [creditCards, setCreditCards] = useState(() => loadFromStorage('creditCards', [
    { id: 1, name: 'メインカード', closingDay: 15, paymentMonth: 1, paymentDay: 10 }
  ]));
  const [selectedCardId, setSelectedCardId] = useState(1);

  // 立替管理 state: { id, date, person, amount, category, memo, transactionId, settled }
  const [splitPayments, setSplitPayments] = useState(() => loadFromStorage('splitPayments', []));
  const [showSplitList, setShowSplitList] = useState(false);
  const [showRecurringList, setShowRecurringList] = useState(false);
  const [showCFList, setShowCFList] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [recentTxnLimit, setRecentTxnLimit] = useState(5);
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState('all');
  const [settingsExpanded, setSettingsExpanded] = useState({ appearance: true, profile: true, budget: false, investment: false, category: false, creditcard: false, data: false }); // FABからの取引入力モーダル
  const [expandedCreditGroups, setExpandedCreditGroups] = useState({});
  const [summaryMonthOffset, setSummaryMonthOffset] = useState(0); // 0=今月, -1=先月...

  useEffect(() => { saveToStorage('creditCards', creditCards); }, [creditCards]);
  useEffect(() => { saveToStorage('splitPayments', splitPayments); }, [splitPayments]);

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
  const [closingTargetMonth, setClosingTargetMonth] = useState(null);
  const [closeMonthData, setCloseMonthData] = useState({ savedAmount: 0, investAmount: 0, dryPowderAmount: 0 });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showLifeEventModal, setShowLifeEventModal] = useState(false);
  const [editingLifeEvent, setEditingLifeEvent] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investForm, setInvestForm] = useState({ fromSource: 'savings', amount: '', targetAccount: 'investments' });

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
    updateRecurringSettlementStatus();
  }, [recurringTransactions, transactions]);  // transactionsも監視
  
  // モーダル表示時に背景のスクロールを無効化
  useEffect(() => {
    const isModalOpen = showRecurringModal || showCategoryModal || showBudgetModal || 
                        showAssetEditModal || showDateTransactionsModal || showBenchmark ||
                        showLifeEventModal || showSettings || showOnboarding || 
                        showCloseMonthModal || editingTransaction || showInvestModal;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // クリーンアップ
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRecurringModal, showCategoryModal, showBudgetModal, showAssetEditModal, 
      showDateTransactionsModal, showBenchmark, showLifeEventModal, showSettings, 
      showOnboarding, showCloseMonthModal, editingTransaction, showInvestModal]);


  // デフォルトカテゴリに削除・名前変更を適用してから結合
  const deletedExp = customCategories.deletedDefaults?.expense || [];
  const deletedInc = customCategories.deletedDefaults?.income || [];
  const renamedExp = customCategories.renamedDefaults?.expense || {};
  const renamedInc = customCategories.renamedDefaults?.income || {};
  const expenseCategories = [
    ...DEFAULT_EXPENSE_CATEGORIES
      .filter(c => !deletedExp.includes(c))
      .map(c => renamedExp[c] || c),
    ...customCategories.expense
  ];
  const incomeCategories = [
    ...DEFAULT_INCOME_CATEGORIES
      .filter(c => !deletedInc.includes(c))
      .map(c => renamedInc[c] || c),
    ...customCategories.income
  ];

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
    
    // NaN/undefinedを0として安全に計算
    const safeSavings = isNaN(Number(assetData.savings)) ? 0 : Number(assetData.savings);
    const safeInvestments = isNaN(Number(assetData.investments)) ? 0 : Number(assetData.investments);
    const safeNisa = isNaN(Number(assetData.nisa)) ? 0 : Number(assetData.nisa);
    const safeDryPowder = isNaN(Number(assetData.dryPowder)) ? 0 : Number(assetData.dryPowder);
    
    const myTotal = safeSavings + safeInvestments + safeNisa + safeDryPowder;
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
      percentile: Math.max(0.1, Math.min(99.9, isNaN(percentile) ? 0 : percentile)),
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
      // 開始日チェック
      if (recurring.startDate && currentMonth < recurring.startDate.slice(0, 7)) {
        return; // まだ開始していない
      }
      
      // 終了日チェック
      if (recurring.endDate && currentMonth > recurring.endDate.slice(0, 7)) {
        return; // 既に終了している
      }
      
      let targetDates = [];
      
      // 繰り返しタイプに応じて日付を計算
      const recurrenceType = recurring.recurrenceType || 'monthly-date';
      
      if (recurrenceType === 'monthly-date') {
        // 日付指定（既存）
        targetDates.push(`${currentMonth}-${String(recurring.day).padStart(2, '0')}`);
        
      } else if (recurrenceType === 'monthly-weekday') {
        // 曜日指定（第N週の月曜日など）
        const [year, month] = currentMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const weekdayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        const targetWeekday = weekdayMap[recurring.weekday];
        
        // 第N週の計算
        let occurrenceCount = 0;
        for (let day = 1; day <= 31; day++) {
          const date = new Date(year, month - 1, day);
          if (date.getMonth() !== month - 1) break; // 月を超えた
          
          if (date.getDay() === targetWeekday) {
            occurrenceCount++;
            if (recurring.weekNumber === -1) {
              // 最終週の場合は後で処理
              continue;
            } else if (occurrenceCount === recurring.weekNumber) {
              targetDates.push(date.toISOString().slice(0, 10));
              break;
            }
          }
        }
        
        // 最終週の処理
        if (recurring.weekNumber === -1 && occurrenceCount > 0) {
          for (let day = 31; day >= 1; day--) {
            const date = new Date(year, month - 1, day);
            if (date.getMonth() !== month - 1) continue;
            if (date.getDay() === targetWeekday) {
              targetDates.push(date.toISOString().slice(0, 10));
              break;
            }
          }
        }
        
      } else if (recurrenceType === 'weekly') {
        // 週指定
        const [year, month] = currentMonth.split('-').map(Number);
        const weekdayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        const targetWeekday = weekdayMap[recurring.weekday];
        
        for (let day = 1; day <= 31; day++) {
          const date = new Date(year, month - 1, day);
          if (date.getMonth() !== month - 1) break;
          
          if (date.getDay() === targetWeekday) {
            // 間隔チェック（例: 隔週なら2週ごと）
            const startDate = new Date(recurring.startDate || '2026-01-01');
            const weeksDiff = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
            if (weeksDiff % (recurring.interval || 1) === 0) {
              targetDates.push(date.toISOString().slice(0, 10));
            }
          }
        }
      }
      
      // 各日付に対して取引を生成
      targetDates.forEach(targetDate => {
        const exists = transactions.some(t => 
          t.date === targetDate && 
          t.category === recurring.category && 
          Math.abs(t.amount) === recurring.amount &&
          t.recurringId === recurring.id
        );
        
        if (!exists) {
          const isPast = new Date(targetDate) <= today;
          
          const isInvestType = recurring.type === 'investment' || recurring.type === 'fund';
          const newTransaction = {
            id: Date.now() + Math.random(),
            date: targetDate,
            category: recurring.category,
            amount: -recurring.amount,
            type: 'expense',
            paymentMethod: recurring.paymentMethod,
            settled: recurring.paymentMethod === 'cash' ? isPast : false,
            isRecurring: true,
            recurringId: recurring.id,
            recurringName: recurring.name,
            isInvestment: isInvestType,
            investTarget: recurring.type === 'fund' ? 'fund' : 'investments'
          };
          
          const newTxns = [newTransaction];

          // クレカ払いの場合、引き落とし予約（isSettlement）を追加生成
          if (recurring.paymentMethod === 'credit') {
            const cardId = recurring.cardId || ((creditCards[0] && creditCards[0].id));
            const card = creditCards.find(c => c.id === cardId) || creditCards[0];
            if (card) {
              const settlementDate = getSettlementDate(targetDate, cardId);
              // 引き落とし予約の重複チェック
              const settlementExists = transactions.some(t =>
                t.isSettlement && t.parentTransactionId === newTransaction.id
              );
              if (!settlementExists && settlementDate) {
                const toLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                newTxns.push({
                  id: Date.now() + Math.random() + 0.5,
                  date: toLocalDate(settlementDate),
                  category: `クレジット引き落とし（${card.name}）`,
                  amount: -recurring.amount,
                  type: 'expense',
                  paymentMethod: 'cash',
                  settled: settlementDate <= new Date(),
                  isSettlement: true,
                  parentTransactionId: newTransaction.id,
                  cardId,
                  isRecurring: true,
                  recurringId: recurring.id,
                });
              }
            }
          }

          setTransactions(prev => [...newTxns, ...prev]);
        }
      });
    });
  };

  
    // 定期支払いの確定状態を自動更新
  const updateRecurringSettlementStatus = () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    setTransactions(prev => prev.map(t => {
      // 未確定の定期支払いで、支払日が今日以前なら確定に変更
      if (t.isRecurring && !t.settled && t.paymentMethod === 'cash' && t.date <= todayStr) {
        return { ...t, settled: true };
      }
      // クレジット引き落とし予約で引き落とし日が今日以前なら確定に変更（CFに反映）
      if (t.isSettlement && !t.settled && t.date <= todayStr) {
        return { ...t, settled: true };
      }
      return t;
    }));
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
  }

  const handleRenameDefaultCategory = (origName, newName, type) => {
    if (!newName.trim() || newName === origName) return;
    setCustomCategories(prev => ({
      ...prev,
      renamedDefaults: {
        ...prev.renamedDefaults,
        [type]: { ...(prev.renamedDefaults?.[type] || {}), [origName]: newName.trim() }
      }
    }));
  };

  const handleDeleteDefaultCategory = (origName, type) => {
    setCustomCategories(prev => ({
      ...prev,
      deletedDefaults: {
        ...prev.deletedDefaults,
        [type]: [...(prev.deletedDefaults?.[type] || []), origName]
      }
    }));
  };
  // カードIDから引き落とし日を計算するヘルパー
  const getSettlementDate = (txDate, cardId) => {
    const resolvedId = cardId ? String(cardId) : (creditCards[0] ? String(creditCards[0].id) : null);
    const card = creditCards.find(c => String(c.id) === String(resolvedId)) || creditCards[0];
    const d = new Date(txDate + 'T00:00:00');
    if (!card) return new Date(d.getFullYear(), d.getMonth() + 1, 26);
  
    const closingDay = card.closingDay;
    const paymentMonth = card.paymentMonth !== undefined ? card.paymentMonth : 1;
    const paymentDay = card.paymentDay;
  
    let year = d.getFullYear();
    let month = d.getMonth(); // 0-indexed
    // 末締め(31)の場合は常に翌月扱い、それ以外は締め日を超えたら翌月
    const isEndOfMonth = closingDay >= 28;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const effectiveClosingDay = isEndOfMonth ? lastDayOfMonth : closingDay;
    if (d.getDate() > effectiveClosingDay) {
      month += 1;
      if (month > 11) { month = 0; year += 1; }
    }
    month += paymentMonth;
    if (month > 11) { month -= 12; year += 1; }
  
    return new Date(year, month, paymentDay);
  };

  const calculateMonthlyBalance = (yearMonth) => {
    const monthTransactions = transactions.filter(t => 
      t.date.startsWith(yearMonth)
    );
    
    // 投資積立・積立保険タイプの定期支払いIDセット（支出から除外し資産に計上）
    const investingRecurringIds = new Set(
      recurringTransactions
        .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
        .map(r => r.id)
    );
    
    // PL（発生主義）：クレジット引き落とし・投資積立を除く全取引
    const plIncome = monthTransactions
      .filter(t => t.amount > 0 && !t.isSettlement)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // 立替分（他人の支払い部分）は自分の支出ではないのでPLから除外
    // まだ精算されていないメンバーの分だけ除外
    const plExpense = Math.abs(monthTransactions
      .filter(t => t.amount < 0 && !t.isSettlement && !investingRecurringIds.has(t.recurringId))
      .reduce((sum, t) => {
        let unsettledSplit = 0;
        if (t.isSplit && t.splitMembers) {
          unsettledSplit = t.splitMembers
            .filter(m => !m.settled)
            .reduce((s, m) => s + Number(m.amount), 0);
        } else if (t.isSplit && !t.splitSettled) {
          unsettledSplit = t.splitAmount || 0;
        }
        return sum + t.amount + unsettledSplit;
      }, 0));
    
    // 投資積立（定期）：支出ではなく資産振替としてカウント
    const investmentTransfer = Math.abs(monthTransactions
      .filter(t => t.amount < 0 && t.recurringId && investingRecurringIds.has(t.recurringId))
      .reduce((sum, t) => sum + t.amount, 0));
    
    // CF（現金主義）：確定済み取引のみ（投資積立除く）
    const cfIncome = monthTransactions
      .filter(t => t.amount > 0 && t.settled)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const cfExpense = Math.abs(monthTransactions
      .filter(t => t.amount < 0 && t.settled && !investingRecurringIds.has(t.recurringId))
      .reduce((sum, t) => sum + t.amount, 0));
    
    // 未確定のクレジット（翌月以降のCF）
    const unsettledCredit = Math.abs(monthTransactions
      .filter(t => t.amount < 0 && !t.settled && t.paymentMethod === 'credit' && !t.isSettlement && !investingRecurringIds.has(t.recurringId))
      .reduce((sum, t) => sum + t.amount, 0));
    
    return {
      plIncome,
      plExpense,
      plBalance: plIncome - plExpense,
      cfIncome,
      cfExpense,
      cfBalance: cfIncome - cfExpense,
      unsettledCredit,
      investmentTransfer
    };
  };


  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentBalance = useMemo(() => calculateMonthlyBalance(currentMonth), [transactions, currentMonth]);

  // 過去6ヶ月のうち、取引があるのに未締めの月を返す
  const getUnclosedMonths = () => {
    const result = [];
    const today = new Date();
    for (let i = 1; i <= 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      if (monthlyHistory[ym]) continue; // 締め済み
      const hasTxn = transactions.some(t => t.date.startsWith(ym));
      if (hasTxn) result.push(ym);
    }
    return result;
  };
  const unclosedMonths = getUnclosedMonths();

  const openCloseMonthModal = (targetMonth) => {
    const tMonth = targetMonth || currentMonth;
    const tBalance = calculateMonthlyBalance(tMonth);
    const cfBalance = isNaN(tBalance.cfBalance) ? 0 : tBalance.cfBalance;
    const plannedTotal = simulationSettings.monthlyInvestment + simulationSettings.monthlySavings;
    setClosingTargetMonth(tMonth);
    setCloseMonthData(cfBalance >= plannedTotal
      ? { savedAmount: cfBalance - simulationSettings.monthlyInvestment, investAmount: simulationSettings.monthlyInvestment, dryPowderAmount: 0 }
      : { savedAmount: 0, investAmount: simulationSettings.monthlyInvestment, dryPowderAmount: 0 }
    );
    setShowCloseMonthModal(true);
  };

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

  const budgetAnalysis = useMemo(() => calculateBudgetAnalysis(), [transactions, monthlyBudget, currentMonth, simulationSettings]);



  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) return;
  
    const amount = newTransaction.type === 'expense' 
      ? -Math.abs(Number(newTransaction.amount))
      : Math.abs(Number(newTransaction.amount));
  
    // 立替がある場合：全メンバーの合計立替額を計算
    const validMembers = (newTransaction.isSplit ? newTransaction.splitMembers : [])
      .filter(m => m.name.trim() && Number(m.amount) > 0);
    const splitTotalAmt = validMembers.reduce((sum, m) => sum + Number(m.amount), 0);
    const transaction = {
      id: Date.now(),
      date: newTransaction.date,
      category: newTransaction.category,
      memo: newTransaction.memo || '',
      amount: amount,
      type: newTransaction.type,
      paymentMethod: newTransaction.type === 'income' ? undefined : newTransaction.paymentMethod,
      settled: newTransaction.type === 'income' ? true : (newTransaction.paymentMethod === 'cash'),
      isSettlement: false,
      cardId: newTransaction.paymentMethod === 'credit' ? (newTransaction.cardId || ((creditCards[0] && creditCards[0].id))) : undefined,
      isSplit: validMembers.length > 0,
      splitAmount: splitTotalAmt,
      splitMembers: validMembers
    };
  
    // クレジット取引の場合、カード設定に基づいて引き落とし予約を自動作成
    if (newTransaction.type === 'expense' && newTransaction.paymentMethod === 'credit') {
      const resolvedCardId = newTransaction.cardId ? String(newTransaction.cardId) : (creditCards[0] ? String(creditCards[0].id) : null);
      const settlementDate = getSettlementDate(newTransaction.date, resolvedCardId);
      const card = creditCards.find(c => String(c.id) === String(resolvedCardId));
      const settlementTransaction = {
        id: Date.now() + 1,
        date: settlementDate.getFullYear() + '-' + String(settlementDate.getMonth()+1).padStart(2,'0') + '-' + String(settlementDate.getDate()).padStart(2,'0'),
        category: 'クレジット引き落とし' + (card ? '（' + card.name + '）' : ''),
        amount: amount,
        type: 'expense',
        paymentMethod: 'cash',
        settled: settlementDate <= new Date(),
        isSettlement: true,
        parentTransactionId: transaction.id,
        cardId: resolvedCardId
      };
      setTransactions([transaction, settlementTransaction, ...transactions]);
    } else {
      setTransactions([transaction, ...transactions]);
    }
  
    // 立替がある場合、人ごとに未回収リストに追加
    if (validMembers.length > 0) {
      setSplitPayments(prev => [
        ...prev,
        ...validMembers.map((m, i) => ({
          id: Date.now() + 2 + i,
          date: newTransaction.date,
          person: m.name.trim(),
          amount: Number(m.amount),
          category: newTransaction.category,
          memo: newTransaction.memo || '',
          transactionId: transaction.id,
          settled: false
        }))
      ]);
    }

    setNewTransaction({ 
      amount: '', 
      category: '', 
      type: 'expense', 
      paymentMethod: 'credit',
      date: new Date().toISOString().slice(0, 10),
      memo: '',
      isSplit: false,
      splitMembers: [],
      cardId: null
    });
  };


  const closeMonth = (targetMonth) => {
    const tMonth = targetMonth || currentMonth;
    const tBalance = calculateMonthlyBalance(tMonth);
    const cfBalance = isNaN(tBalance.cfBalance) ? 0 : tBalance.cfBalance;
    const plannedInvestment = simulationSettings.monthlyInvestment;
    const plannedSavings = simulationSettings.monthlySavings;
    const totalPlanned = plannedInvestment + plannedSavings;
    
    let actualInvest = isNaN(closeMonthData.investAmount) ? 0 : closeMonthData.investAmount;
    let actualDryPowder = isNaN(closeMonthData.dryPowderAmount) ? 0 : closeMonthData.dryPowderAmount;
    let actualSavings = isNaN(closeMonthData.savedAmount) ? 0 : closeMonthData.savedAmount;
    let withdrawalFromSavings = 0;
    
    if (cfBalance < totalPlanned) {
      withdrawalFromSavings = totalPlanned - cfBalance;
      actualInvest = plannedInvestment;
      actualSavings = cfBalance - actualDryPowder;
    }

    // 今月の定期投資（確定済み）を自動的に資産に反映
    const recurringInvestIds = new Set(
      recurringTransactions
        .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
        .map(r => r.id)
    );
    const settledInvestments = transactions.filter(t =>
      t.date.startsWith(tMonth) && t.settled && t.recurringId && recurringInvestIds.has(t.recurringId)
    );
    const autoInvestAmount = settledInvestments
      .filter(t => {
        const r = recurringTransactions.find(r => r.id === t.recurringId);
        return r && r.type === 'investment';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const autoFundAmount = settledInvestments
      .filter(t => {
        const r = recurringTransactions.find(r => r.id === t.recurringId);
        return r && r.type === 'fund';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const autoInsuranceAmount = settledInvestments
      .filter(t => {
        const r = recurringTransactions.find(r => r.id === t.recurringId);
        return r && r.type === 'insurance';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    setAssetData(prev => {
      const prevSavings = isNaN(Number(prev.savings)) ? 0 : Number(prev.savings);
      const prevInvestments = isNaN(Number(prev.investments)) ? 0 : Number(prev.investments);
      const prevDryPowder = isNaN(Number(prev.dryPowder)) ? 0 : Number(prev.dryPowder);
      const prevNisa = isNaN(Number(prev.nisa)) ? 0 : Number(prev.nisa);
      return {
        savings: prevSavings + actualSavings - withdrawalFromSavings + autoInsuranceAmount,
        investments: prevInvestments + actualInvest + autoInvestAmount,
        dryPowder: prevDryPowder + actualDryPowder,
        nisa: prevNisa + autoFundAmount
      };
    });

    setMonthlyHistory(prev => ({
      ...prev,
      [tMonth]: {
        plBalance: tBalance.plBalance,
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
    setTransactions(transactions.filter(t => t.id !== id && t.parentTransactionId !== id));
    setSplitPayments(prev => prev.filter(s => s.transactionId !== id));
  };

  const updateTransaction = (updatedTransaction) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === updatedTransaction.id) return updatedTransaction;
      // 元取引に紐づく引き落とし予約を金額・カード情報に合わせて更新
      if (t.isSettlement && t.parentTransactionId === updatedTransaction.id) {
        const newSettlementDate = getSettlementDate(
          updatedTransaction.date,
          updatedTransaction.cardId
        );
        const card = creditCards.find(c => String(c.id) === String(updatedTransaction.cardId));
        return {
          ...t,
          amount: updatedTransaction.amount, // 元取引の金額変更に追従
          date: newSettlementDate.getFullYear() + '-' + String(newSettlementDate.getMonth()+1).padStart(2,'0') + '-' + String(newSettlementDate.getDate()).padStart(2,'0'),
          category: 'クレジット引き落とし' + (card ? '（' + card.name + '）' : ''),
          settled: newSettlementDate <= new Date(),
          cardId: updatedTransaction.cardId
        };
      }
      return t;
    }));
    setEditingTransaction(null);
  };

  const calculateCategoryExpenses = () => {
    // 投資積立・投資信託の定期支払いIDセット
    const investRecurringIds = new Set(
      recurringTransactions
        .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
        .map(r => r.id)
    );
    const currentMonthTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth) && t.amount < 0 && !t.isSettlement
      && !(t.recurringId && investRecurringIds.has(t.recurringId))
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

  // 投資実行：現預金または待機資金から投資口座に資金を移動
  const executeInvestment = () => {
    const amount = Number(investForm.amount);
    if (!amount || amount <= 0) {
      alert('金額を入力してください');
      return;
    }
    const sourceBalance = investForm.fromSource === 'savings' 
      ? (isNaN(assetData.savings) ? 0 : assetData.savings)
      : (isNaN(assetData.dryPowder) ? 0 : (assetData.dryPowder || 0));
    if (amount > sourceBalance) {
      alert('残高が不足しています');
      return;
    }
    setAssetData(prev => {
      const newData = { ...prev };
      if (investForm.fromSource === 'savings') {
        newData.savings = (isNaN(prev.savings) ? 0 : prev.savings) - amount;
      } else {
        newData.dryPowder = (isNaN(prev.dryPowder) ? 0 : (prev.dryPowder || 0)) - amount;
      }
      if (investForm.targetAccount === 'investments') {
        newData.investments = (isNaN(prev.investments) ? 0 : prev.investments) + amount;
      } else if (investForm.targetAccount === 'nisa') {
        newData.nisa = (isNaN(prev.nisa) ? 0 : (prev.nisa || 0)) + amount;
      } else {
        newData.dryPowder = (isNaN(prev.dryPowder) ? 0 : (prev.dryPowder || 0)) + amount;
      }
      return newData;
    });
    setInvestForm({ fromSource: 'savings', amount: '', targetAccount: 'investments' });
    setShowInvestModal(false);
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
    let cumulativeTaxSaved = 0;
    
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
        // NISA節税効果 = NISA運用益に対してかかるはずだった税金（非課税のため節約できた額）
        yearlyTaxSaved += nisaMonthlyProfit * TAX_RATE;
        cumulativeTaxSaved += nisaMonthlyProfit * TAX_RATE;
  
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
        taxSaved: Math.round(cumulativeTaxSaved),  // 累積節税効果
        yearlyProfit: Math.round(yearlyProfit)
      });
    }
  
    return results;
  };




  const simulationResults = useMemo(() => calculateSimulation(), [simulationSettings, assetData]);
  const monteCarloResults = useMemo(() => simulationSettings.showMonteCarloSimulation ? runMonteCarloSimulation(100) : [], [simulationSettings, assetData]);
  const finalValue = simulationResults[simulationResults.length - 1]?.totalValue || 0;
  const achievement = Math.min((finalValue / simulationSettings.targetAmount) * 100, 100);
  const totalTaxSaved = simulationResults[simulationResults.length - 1]?.taxSaved || 0;

  // シミュレーション結果の年代別比較
  const futureAge = (userInfo?.age ? Number(userInfo.age) : 25) + simulationSettings.years;
  const futureBenchmark = calculateBenchmark(futureAge);

  const chartData = useMemo(() => simulationResults.map(result => ({
    年: `${result.year}年`,
    貯金: result.savings,
    課税口座: result.regularInvestment,
    NISA: result.nisaInvestment,
    待機資金: result.dryPowder,
    合計: result.totalValue
  })), [simulationResults]);

  const monteCarloChartData = useMemo(() => monteCarloResults.map(result => ({
    年: `${result.year}年`,
    平均: result.average,
    最小: result.min,
    最大: result.max,
    範囲下限: result.p25,
    範囲上限: result.p75
  })), [monteCarloResults]);

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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-3">
        {activeTab === 'home' && (
          <div className="space-y-3 animate-fadeIn">

            {/* 未締め月バナー */}
            {unclosedMonths.length > 0 && (
              <div className={`rounded-xl p-4 border-l-4`} style={{ backgroundColor: darkMode ? 'rgba(255,159,10,0.12)' : 'rgba(255,159,10,0.08)', borderColor: theme.orange }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-1" style={{ color: theme.orange }}>⚠ 未締めの月があります</p>
                    <p className={`text-xs ${theme.textSecondary} mb-2`}>以下の月の収支がまだ確定していません。</p>
                    <div className="flex flex-wrap gap-2">
                      {unclosedMonths.map(ym => (
                        <button
                          key={ym}
                          onClick={() => openCloseMonthModal(ym)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover-scale transition-all"
                          style={{ backgroundColor: theme.orange }}
                        >
                          {ym} を締める
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 今月サマリー：スワイプで月切替 + 収支バー */}
            {(() => {
              const today = new Date();
              // toISOString()はUTC変換でJSTが1日ずれるためローカル時刻で計算
              const toYM = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              const targetDate = new Date(today.getFullYear(), today.getMonth() + summaryMonthOffset, 1);
              const targetMonth = toYM(targetDate);
              const currentMonth = toYM(today);
              const isCurrentMonth = targetMonth === currentMonth;

              const bal = calculateMonthlyBalance(targetMonth);
              const inc = bal.plIncome || 0;
              const exp = bal.plExpense || 0;
              const diff = inc - exp;
              const isPositive = diff >= 0;
              const spendRatio = inc > 0 ? Math.min(exp / inc, 1) : (exp > 0 ? 1 : 0);
              const overRatio = inc > 0 && exp > inc ? Math.min((exp - inc) / inc, 0.5) : 0;

              // スワイプ処理
              const handleTouchStart = (e) => { e._swipeStartX = e.touches[0].clientX; };
              const handleTouchEnd = (e) => {
                const dx = e.changedTouches[0].clientX - (e._swipeStartX || e.changedTouches[0].clientX);
                if (Math.abs(dx) > 40) setSummaryMonthOffset(o => Math.max(-11, Math.min(0, o + (dx < 0 ? -1 : 1))));
              };

              // 表示月ラベル
              const monthLabel = targetDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

              return (
                <div
                  className={`${theme.cardGlass} rounded-2xl overflow-hidden select-none`}
                  onTouchStart={e => { e.currentTarget._startX = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    const dx = e.changedTouches[0].clientX - (e.currentTarget._startX || 0);
                    // 右スワイプ=前月へ(offset-1)、左スワイプ=翌月へ(offset+1)
                    if (Math.abs(dx) > 40) setSummaryMonthOffset(o => Math.max(-11, Math.min(0, o + (dx > 0 ? -1 : 1))));
                  }}
                >
                  {/* 上段：月ラベル + 収支差額 */}
                  <div className="px-5 pt-5 pb-4" style={{
                    background: darkMode
                      ? isPositive
                        ? 'linear-gradient(145deg, rgba(10,132,255,0.10) 0%, transparent 70%)'
                        : 'linear-gradient(145deg, rgba(255,69,58,0.10) 0%, transparent 70%)'
                      : isPositive
                        ? 'linear-gradient(145deg, rgba(59,130,246,0.06) 0%, transparent 70%)'
                        : 'linear-gradient(145deg, rgba(239,68,68,0.06) 0%, transparent 70%)'
                  }}>
                    {/* ヘッダー行 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* 前月へ */}
                        <button
                          onClick={() => setSummaryMonthOffset(o => Math.max(-11, o - 1))}
                          className={`text-xs px-1.5 py-1 rounded-lg transition-all ${darkMode ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-300 hover:text-neutral-500'}`}
                        >◀</button>
                        <span className={`text-[11px] font-bold tracking-wide ${isCurrentMonth ? theme.text : theme.textSecondary}`}>
                          {monthLabel}
                        </span>
                        {monthlyHistory[targetMonth] && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-green-500/15 text-green-500">締済</span>
                        )}
                        {/* 次月へ（今月より先はNG） */}
                        <button
                          onClick={() => setSummaryMonthOffset(o => Math.min(0, o + 1))}
                          className={`text-xs px-1.5 py-1 rounded-lg transition-all ${summaryMonthOffset >= 0 ? 'opacity-20 pointer-events-none' : (darkMode ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-300 hover:text-neutral-500')}`}
                        >▶</button>
                        {!isCurrentMonth && (
                          <button
                            onClick={() => setSummaryMonthOffset(0)}
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}
                          >今月</button>
                        )}
                      </div>
                      <button
                        onClick={() => { setShowTutorial(true); setTutorialPage(0); }}
                        className={`text-xs px-2 py-0.5 rounded-full transition-all ${darkMode ? 'text-neutral-700 hover:text-neutral-500' : 'text-neutral-300 hover:text-neutral-500'}`}
                      >❓</button>
                    </div>

                    {/* 収支差額（大きく） */}
                    <div className="mb-1">
                      <p className={`text-[10px] font-medium ${theme.textSecondary} mb-1`}>収支</p>
                      <p className="text-3xl font-black tabular-nums" style={{
                        color: isPositive ? theme.green : theme.red,
                        letterSpacing: '-0.03em'
                      }}>
                        {isPositive ? '+' : '−'}¥{Math.abs(diff).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 収支バー */}
                  <div className="px-5 py-4" style={{
                    borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                  }}>
                    {inc > 0 || exp > 0 ? (() => {
                      const savingsPct = inc > 0 ? Math.max(0, Math.round((1 - exp / inc) * 100)) : 0;
                      const expBarPct = inc > 0 ? Math.min((exp / inc) * 100, 100) : 100;
                      return (
                        <div>
                          {/* 収入・支出 数字行 */}
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: theme.green }}>↑ 収入</p>
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.green }}>¥{inc.toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="px-3 py-1 rounded-full text-[11px] font-black tabular-nums text-white"
                                style={{ backgroundColor: isPositive ? theme.green : theme.red }}>
                                {isPositive ? `▲ ¥${diff.toLocaleString()}` : `▼ ¥${Math.abs(diff).toLocaleString()}`}
                              </div>
                              <p className="text-[9px] mt-0.5 font-semibold" style={{ color: isPositive ? theme.green : theme.red }}>
                                {isPositive ? `貯蓄率 ${savingsPct}%` : '赤字'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: theme.red }}>↓ 支出</p>
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>¥{exp.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* 1本の積み上げ比較バー */}
                          <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                            {/* 収入（緑）バー：常に左から100% */}
                            <div className="absolute inset-0 rounded-full" style={{ backgroundColor: theme.green, opacity: 0.25 }} />
                            {/* 支出バー：収入に対する割合で左から */}
                            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${expBarPct}%`,
                                background: expBarPct < 70
                                  ? `linear-gradient(90deg, ${theme.green}, ${theme.green})`
                                  : expBarPct < 90
                                    ? `linear-gradient(90deg, ${theme.green}, ${theme.orange})`
                                    : `linear-gradient(90deg, ${theme.green}99, ${theme.red})`,
                              }}
                            />
                            {/* 赤字時：超過分を赤く点滅 */}
                            {!isPositive && (
                              <div className="absolute top-0 right-0 h-full w-2 rounded-r-full animate-pulse" style={{ backgroundColor: theme.red }} />
                            )}
                          </div>

                          {/* バー下ラベル */}
                          <div className="flex justify-between mt-1.5">
                            <p className="text-[9px] font-semibold" style={{ color: theme.green }}>¥0</p>
                            <p className="text-[9px] font-semibold" style={{ color: isPositive ? theme.green : theme.orange }}>
                              {isPositive ? `残 ¥${diff.toLocaleString()}` : `収入 ¥${inc.toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                      );
                    })() : (
                      <p className={`text-xs text-center py-1 ${theme.textSecondary}`}>取引なし</p>
                    )}

                    {/* ページドット */}
                    <div className="flex justify-center gap-1 mt-3">
                      {[-5,-4,-3,-2,-1,0].map(o => (
                        <button
                          key={o}
                          onClick={() => setSummaryMonthOffset(o)}
                          className="rounded-full transition-all duration-200"
                          style={{
                            width: summaryMonthOffset === o ? 16 : 5,
                            height: 5,
                            backgroundColor: summaryMonthOffset === o
                              ? (isCurrentMonth ? theme.accent : theme.textSecondary)
                              : (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* 定期支払い */}
            <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
              {/* ヘッダー（常時表示）+ 折りたたみ時の合計表示 */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => setShowRecurringList(!showRecurringList)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>定期支払い</span>
                    {recurringTransactions.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>
                        {recurringTransactions.length}件
                      </span>
                    )}
                    <span className={`text-xs ${theme.textSecondary} ml-auto mr-2`} style={{ display:'inline-block', transform: showRecurringList ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▼</span>
                  </button>
                  <button onClick={() => { setEditingRecurring(null); setShowRecurringModal(true); }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white hover-scale shrink-0"
                    style={{ backgroundColor: theme.accent }}>+ 追加</button>
                </div>
                {recurringTransactions.length > 0 && (() => {
                  const fixedTotal = recurringTransactions
                    .filter(r => r.type === 'expense')
                    .reduce((s, r) => s + Number(r.amount || 0), 0);
                  const investTotal = recurringTransactions
                    .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
                    .reduce((s, r) => s + Number(r.amount || 0), 0);
                  return (
                    <div className="flex items-center gap-3 pb-1">
                      {fixedTotal > 0 && (
                        <span className="text-xs tabular-nums" style={{ color: theme.red }}>
                          固定費 <span className="font-bold">¥{fixedTotal.toLocaleString()}</span>
                        </span>
                      )}
                      {investTotal > 0 && (
                        <span className="text-xs tabular-nums" style={{ color: theme.green }}>
                          積立 <span className="font-bold">¥{investTotal.toLocaleString()}</span>
                        </span>
                      )}
                      <span className={`text-xs tabular-nums ml-auto font-black ${theme.text}`}>
                        月計 ¥{(fixedTotal + investTotal).toLocaleString()}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* 展開コンテンツ */}
              {showRecurringList && (
                <div className={`border-t ${theme.border} animate-fadeIn`}>
                  {recurringTransactions.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${theme.textSecondary}`}>定期支払いを追加してください</p>
                  ) : (
                    <div className="divide-y" style={{ borderColor: darkMode ? '#2a2a2a' : '#f0f0f0' }}>
                      {recurringTransactions.map((r) => (
                        <div key={r.id} className={`flex items-center px-4 py-3 ${darkMode ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50'} transition-all`}>
                          <span className="text-base mr-3">
                            {r.type==='investment' ? '📈' : r.type==='fund' ? '📊' : r.type==='insurance' ? '🛡️' : '🔄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme.text} truncate`}>{r.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-xs ${theme.textSecondary}`}>毎月{r.day}日</span>
                              {r.type === 'investment' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor:'rgba(168,85,247,0.15)', color:'#a855f7' }}>投資積立</span>
                              )}
                              {r.type === 'fund' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor:'rgba(16,185,129,0.15)', color:'#10b981' }}>投資信託</span>
                              )}
                              {r.type === 'insurance' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor:'rgba(59,130,246,0.15)', color:'#3b82f6' }}>積立保険</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-bold tabular-nums mr-3" style={{
                            color: r.type==='investment' ? '#a855f7' : r.type==='fund' ? '#10b981' : r.type==='insurance' ? '#3b82f6' : (darkMode ? '#e5e5e5' : '#171717')
                          }}>
                            ¥{r.amount.toLocaleString()}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingRecurring(r); setShowRecurringModal(true); }} className="p-1.5 rounded-lg text-blue-500 hover:scale-110 transition-transform">✏️</button>
                            <button onClick={() => deleteRecurring(r.id)} className="p-1.5 rounded-lg text-red-500 hover:scale-110 transition-transform">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* 予定CF：今月の引き落とし・支払い予定 */}
            {(() => {
              const today = new Date();
              const toYM = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              const thisYearMonth = toYM(today);
              const todayDay = today.getDate();

              // クレカ：カード×引落日でグループ化（通常取引 + クレカ払い定期支払いの実績取引）
              const creditGroups = [];
              creditCards.forEach(card => {
                const cardTxns = transactions.filter(t => {
                  if (t.amount >= 0 || t.settled || t.paymentMethod !== 'credit') return false;
                  // cardIdが一致するか、cardId未設定なら先頭カード扱い
                  const matchCard = t.cardId ? t.cardId === card.id : card.id === (creditCards[0] && creditCards[0].id);
                  if (!matchCard) return false;
                  const sd = getSettlementDate(t.date, card.id);
                  return sd && toYM(sd) === thisYearMonth;
                });
                if (cardTxns.length === 0) return;
                const day = card.paymentDay || 10;
                const amount = cardTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
                const isPast = day <= todayDay;
                const details = [...cardTxns]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(t => ({ date: t.date, category: t.category || '—', memo: t.memo, amount: Math.abs(t.amount) }));
                creditGroups.push({ kind: 'credit', name: card.name, cardId: card.id, amount, day, isPast, details });
              });

              // 定期支払い：クレカ払い→引落日でcreditGroupsに合算、現金払い→固定費リスト
              const fixedItems = [];
              recurringTransactions
                .filter(r => r.type === 'expense' || r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
                .forEach(r => {
                  const day = (!r.recurrenceType || r.recurrenceType === 'monthly-date') ? (r.day || 1) : null;
                  const amount = Number(r.amount || 0);
                  if (amount === 0) return;

                  if (r.paymentMethod === 'credit' && r.cardId) {
                    // クレカ払いの定期支払い → 対象カードのcreditGroupに合算
                    const card = creditCards.find(c => c.id === r.cardId) || creditCards[0];
                    if (card) {
                      const payDay = card.paymentDay || 10;
                      const existing = creditGroups.find(g => g.cardId === card.id);
                      const detail = { date: `毎月${day || '?'}日`, category: r.category || r.name, memo: r.name + '（定期）', amount };
                      if (existing) {
                        existing.amount += amount;
                        existing.details.push(detail);
                      } else {
                        creditGroups.push({ kind: 'credit', name: card.name, cardId: card.id, amount, day: payDay, isPast: payDay <= todayDay, details: [detail] });
                      }
                    }
                  } else {
                    // 現金・振替払い → 固定費リスト
                    const icon = r.type === 'investment' ? '📈' : r.type === 'fund' ? '📊' : r.type === 'insurance' ? '🛡️' : '🔄';
                    fixedItems.push({ kind: 'fixed', name: r.name, amount, day, category: r.category, isPast: day !== null && day <= todayDay, icon });
                  }
                });

              const allItems = [...creditGroups, ...fixedItems]
                .filter(i => i.amount > 0)
                .sort((a, b) => (a.day ?? 99) - (b.day ?? 99));

              if (allItems.length === 0) return null;

              const remainingTotal = allItems.filter(i => !i.isPast).reduce((s, i) => s + i.amount, 0);
              const totalAll = allItems.reduce((s, i) => s + i.amount, 0);

              return (
                <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
                  {/* ヘッダー */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => setShowCFList(!showCFList)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>今月の支払い予定</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>{allItems.length}件</span>
                        <span className={`text-xs ${theme.textSecondary} ml-auto mr-2`} style={{ display: 'inline-block', transform: showCFList ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {remainingTotal > 0 && (
                        <span className="text-xs tabular-nums flex items-center gap-1" style={{ color: theme.red }}>
                          <span className={`text-[10px] ${theme.textSecondary}`}>未払い</span>
                          <span className="font-bold">¥{remainingTotal.toLocaleString()}</span>
                        </span>
                      )}
                      <span className={`text-xs tabular-nums ml-auto font-black ${theme.text}`}>
                        月計 ¥{totalAll.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 展開リスト */}
                  {showCFList && (
                    <div className="border-t animate-fadeIn" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <div className="divide-y" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                        {allItems.map((item, i) => {
                          const groupKey = item.kind === 'credit' ? `credit-${item.cardId}` : `fixed-${i}`;
                          const isExpanded = !!expandedCreditGroups[groupKey];
                          const canExpand = item.kind === 'credit' && item.details && item.details.length > 1;
                          return (
                            <div key={i}>
                              {/* メイン行 */}
                              <div
                                className={`flex items-center px-4 py-2.5 transition-colors ${canExpand ? 'cursor-pointer active:opacity-70' : ''}`}
                                style={{ opacity: item.isPast ? 0.4 : 1 }}
                                onClick={() => canExpand && setExpandedCreditGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                              >
                                <div className="w-9 shrink-0 text-center">
                                  {item.day !== null ? (
                                    <>
                                      <p className={`text-sm font-black tabular-nums leading-tight ${item.isPast ? theme.textSecondary : theme.text}`}>{item.day}</p>
                                      <p className={`text-[8px] ${theme.textSecondary} leading-none`}>日</p>
                                    </>
                                  ) : (
                                    <span className={`text-xs ${theme.textSecondary}`}>—</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mx-2">
                                  <span className="text-sm">{item.kind === 'credit' ? '💳' : (item.icon || '🔄')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-sm font-medium truncate ${theme.text}`}>{item.name}</p>
                                    {canExpand && (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>
                                        {item.details.length}件
                                      </span>
                                    )}
                                  </div>
                                  {item.kind === 'credit' && (
                                    <p className={`text-[10px] ${theme.textSecondary}`}>クレジット引き落とし</p>
                                  )}
                                  {item.category && item.kind !== 'credit' && (
                                    <p className={`text-[10px] ${theme.textSecondary}`}>{item.category}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <p className="text-sm font-bold tabular-nums" style={{ color: item.isPast ? (darkMode ? '#555' : '#bbb') : theme.red }}>
                                      ¥{item.amount.toLocaleString()}
                                    </p>
                                    {item.isPast && <p className="text-[9px] text-green-500 font-bold">完了</p>}
                                  </div>
                                  {canExpand && (
                                    <span className={`text-xs ${theme.textSecondary} transition-transform duration-200`} style={{ display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                  )}
                                </div>
                              </div>

                              {/* 内訳（展開時） */}
                              {canExpand && isExpanded && (
                                <div className="animate-fadeIn" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                                  {item.details.map((d, di) => (
                                    <div key={di} className="flex items-center pl-14 pr-4 py-2" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-medium truncate ${theme.text}`}>{d.category}</p>
                                        {d.memo && <p className={`text-[10px] truncate ${theme.textSecondary}`}>{d.memo}</p>}
                                        <p className={`text-[10px] ${theme.textSecondary}`}>{d.date}</p>
                                      </div>
                                      <p className="text-xs font-bold tabular-nums shrink-0 ml-3" style={{ color: darkMode ? '#888' : '#aaa' }}>
                                        ¥{d.amount.toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* 立替待ち */}
            {splitPayments.filter(s => !s.settled).length > 0 && (
              <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
                {/* ヘッダー：常時表示 */}
                <button
                  onClick={() => setShowSplitList(!showSplitList)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">👥</span>
                    <span className={`text-sm font-semibold ${theme.text}`}>立替待ち</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500 text-white">
                      {splitPayments.filter(s => !s.settled).length}人
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>
                      合計 ¥{splitPayments.filter(s => !s.settled).reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs ${theme.textSecondary}`} style={{ display:'inline-block', transform: showSplitList ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▼</span>
                </button>

                {showSplitList && (
                  <div className={`border-t ${theme.border} animate-fadeIn`}>
                    {splitPayments.filter(s => !s.settled).map(sp => (
                      <div key={sp.id} className={`px-4 py-3 border-b ${theme.border} last:border-b-0`}>
                        {/* 人名と金額行 */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-bold ${theme.text}`}>{sp.person}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>{sp.category}</span>
                              <span className={`text-xs ${theme.textSecondary}`}>{sp.date}</span>
                            </div>
                            {sp.memo && (
                              <p className={`text-xs ${theme.textSecondary} mt-0.5 truncate`}>{sp.memo}</p>
                            )}
                            <p className="text-base font-bold tabular-nums mt-1" style={{ color: theme.accent }}>
                              ¥{sp.amount.toLocaleString()}
                            </p>
                          </div>

                          {/* 精算ボタン */}
                          <button
                            onClick={() => {
                              const settleTransaction = {
                                id: Date.now(),
                                date: new Date().toISOString().slice(0, 10),
                                category: '立替回収',
                                memo: `${sp.person}からの返金（${sp.category}）`,
                                amount: sp.amount,
                                type: 'income',
                                settled: true,
                                isSettlement: false
                              };
                              // 精算収入を記録 + 元取引のsplitMembersを更新
                              setTransactions(prev => [
                                settleTransaction,
                                ...prev.map(t => {
                                  if (t.id !== sp.transactionId) return t;
                                  const updatedMembers = (t.splitMembers || []).map(m =>
                                    m.name === sp.person && !m.settled
                                      ? { ...m, settled: true, settledDate: new Date().toISOString().slice(0, 10) }
                                      : m
                                  );
                                  const allSettled = updatedMembers.every(m => m.settled);
                                  return { ...t, splitMembers: updatedMembers, splitSettled: allSettled };
                                })
                              ]);
                              setSplitPayments(prev => prev.map(s =>
                                s.id === sp.id
                                  ? { ...s, settled: true, settledDate: new Date().toISOString().slice(0, 10) }
                                  : s
                              ));
                              // editingTransactionを同期（精算後の表示崩れ防止）
                              setEditingTransaction(prev => {
                                if (!prev) return prev;
                                const updatedMembers = (prev.splitMembers || []).map(m =>
                                  m.name === sp.person && !m.settled
                                    ? { ...m, settled: true, settledDate: new Date().toISOString().slice(0, 10) }
                                    : m
                                );
                                return { ...prev, splitMembers: updatedMembers, splitSettled: updatedMembers.every(m => m.settled) };
                              });
                            }}
                            className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white hover-scale transition-all"
                            style={{ backgroundColor: theme.green }}
                          >
                            精算 ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* 最近の取引 */}
            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>最近の取引</h2>
                {!monthlyHistory[currentMonth] && currentBalance.cfBalance !== 0 && (
                  <button
                    onClick={() => openCloseMonthModal()}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover-scale"
                    style={{ backgroundColor: theme.accent }}>
                    今月を締める
                  </button>
                )}
              </div>
              {transactions.length === 0 ? (
                <p className={`text-sm text-center py-8 ${theme.textSecondary}`}>まだ取引がありません</p>
              ) : (
                <div className="space-y-1">
                  {transactions.slice(0, recentTxnLimit).map((t, idx) => (
                    <div key={t.id} onClick={() => setEditingTransaction(t)}
                      className={`flex items-center gap-3 px-1 py-2.5 rounded-xl cursor-pointer transition-all duration-200 animate-fadeIn ${darkMode ? 'hover:bg-neutral-700/30' : 'hover:bg-neutral-50'}`}
                      style={{ animationDelay: `${idx * 0.03}s` }}>
                      {/* アイコン */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                        t.isSettlement ? (darkMode?'bg-orange-500/15':'bg-orange-50') :
                        t.type==='income' ? (darkMode?'bg-green-500/15':'bg-green-50') :
                        t.paymentMethod==='credit' ? (darkMode?'bg-blue-500/15':'bg-blue-50') :
                        (darkMode?'bg-neutral-800':'bg-neutral-100')
                      }`}>
                        {t.isRecurring ? (t.isInvestment ? '📈' : '🔄') : t.isSettlement ? '💸' : t.type === 'income' ? '💰' : (t.paymentMethod === 'credit' ? '💳' : '💵')}
                      </div>
                      {/* 中央テキスト */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                          {!t.settled && t.type === 'expense' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: t.isSettlement ? 'rgba(255,159,10,0.2)' : 'rgba(255,159,10,0.15)', color: theme.orange }}>
                              {t.isSettlement ? '引落予定' : '未確定'}
                            </span>
                          )}
                          {t.isSplit && (() => {
                            const members = t.splitMembers || [];
                            const allSettled = members.length > 0 && members.every(m => m.settled);
                            const settledCount = members.filter(m => m.settled).length;
                            return (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${allSettled ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-400'}`}>
                                {allSettled ? '👥精算済' : `👥${settledCount}/${members.length}人`}
                              </span>
                            );
                          })()}
                        </div>
                        <p className={`text-xs ${theme.textSecondary} mt-0.5 truncate`}>
                          {t.memo ? t.memo : t.date}
                          {t.memo && <span className="ml-1.5 opacity-60">{t.date.slice(5)}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                          <p className="text-sm font-bold tabular-nums" style={{ color: t.amount >= 0 ? theme.green : (t.isSettlement ? theme.orange : t.isInvestment ? '#a855f7' : theme.red) }}>
                            {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                          </p>
                          {t.memo && <p className={`text-[10px] tabular-nums ${theme.textSecondary}`}>{t.date.slice(5)}</p>}
                      </div>
                    </div>
                  ))}
                  {transactions.length > recentTxnLimit && (
                    <button
                      onClick={() => setRecentTxnLimit(prev => prev + 10)}
                      className={`w-full mt-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${darkMode ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                    >
                      もっと見る（残り {transactions.length - recentTxnLimit} 件）
                    </button>
                  )}
                </div>
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
                    setSelectedMonth(nextMonth);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                >
                  <span className={theme.text}>▶</span>
                </button>
              </div>

              {/* 検索・フィルター */}
              <div className="flex flex-col gap-2 mb-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'}`}>
                  <span className={`text-xs ${theme.textSecondary}`}>🔍</span>
                  <input
                    type="text"
                    placeholder="キーワード検索..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    className={`flex-1 text-xs bg-transparent focus:outline-none ${theme.text}`}
                  />
                  {historySearch && (
                    <button onClick={() => setHistorySearch('')} className={`text-xs ${theme.textSecondary}`}>✕</button>
                  )}
                </div>
                <select
                  value={historyCategory}
                  onChange={e => setHistoryCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none ${darkMode ? 'bg-neutral-800 border border-neutral-700 text-neutral-300' : 'bg-neutral-50 border border-neutral-200 text-neutral-700'}`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                >
                  <option value="all">全カテゴリ</option>
                  {[...expenseCategories, ...incomeCategories].filter((c,i,a)=>a.indexOf(c)===i).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
                          setSelectedDate(`${selectedMonth}-${String(day).padStart(2, '0')}`);
                          setShowDateTransactionsModal(true);
                        }}
                        className={`aspect-square border rounded-lg p-1 transition-all duration-200 hover-scale cursor-pointer ${
                          isToday 
                            ? darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-30' : 'border-blue-500 bg-blue-50'
                            : hasTransactions
                              ? darkMode ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-300 bg-neutral-50'
                              : darkMode ? 'border-neutral-800 hover:border-neutral-600' : 'border-neutral-200 hover:border-neutral-300'
                        }`}
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

            {/* フィルター適用時：検索結果リスト */}
            {(historySearch || historyCategory !== 'all') && (() => {
              const filtered = transactions.filter(t => {
                const matchMonth = t.date.startsWith(selectedMonth);
                const matchCat = historyCategory === 'all' || t.category === historyCategory;
                const matchSearch = !historySearch || 
                  t.category?.includes(historySearch) || 
                  t.memo?.includes(historySearch) ||
                  String(Math.abs(t.amount)).includes(historySearch);
                return matchMonth && matchCat && matchSearch;
              });
              return (
                <div className={`${theme.cardGlass} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className={`text-sm font-semibold ${theme.text}`}>
                      検索結果
                      <span className={`ml-2 text-xs font-normal ${theme.textSecondary}`}>{filtered.length}件</span>
                    </h2>
                    <button
                      onClick={() => { setHistorySearch(''); setHistoryCategory('all'); }}
                      className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}
                    >クリア</button>
                  </div>
                  {filtered.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${theme.textSecondary}`}>該当する取引がありません</p>
                  ) : (
                    <div className="space-y-1">
                      {filtered.map(t => (
                        <div key={t.id}
                          onClick={() => setEditingTransaction(t)}
                          className={`flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer transition-all ${darkMode ? 'hover:bg-neutral-700/40' : 'hover:bg-neutral-50'}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                            t.type === 'income' ? (darkMode ? 'bg-green-500/15' : 'bg-green-50') :
                            t.isSettlement ? (darkMode ? 'bg-orange-500/15' : 'bg-orange-50') :
                            t.paymentMethod === 'credit' ? (darkMode ? 'bg-blue-500/15' : 'bg-blue-50') :
                            (darkMode ? 'bg-neutral-800' : 'bg-neutral-100')
                          }`}>
                            {t.type === 'income' ? '💰' : t.isSettlement ? '💸' : t.paymentMethod === 'credit' ? '💳' : '💵'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                            <p className={`text-xs ${theme.textSecondary} truncate`}>{t.memo || t.date}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold tabular-nums" style={{ color: t.amount >= 0 ? theme.green : (t.isSettlement ? theme.orange : theme.red) }}>
                              {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                            </p>
                            <p className={`text-[10px] ${theme.textSecondary}`}>{t.date.slice(5)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 未締め月の締めるボタン（履歴タブ） */}
            {!monthlyHistory[selectedMonth] && calculateMonthlyBalance(selectedMonth).cfBalance !== 0 && selectedMonth < currentMonth && (
              <button
                onClick={() => openCloseMonthModal(selectedMonth)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover-scale flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.orange }}
              >
                ⚠ {selectedMonth} を締める
              </button>
            )}

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
                      color: darkMode ? '#e5e5e5' : '#171717',
                      color: darkMode ? '#fff' : '#000'
                    }}
                  />
                  <Bar dataKey="PL" fill={theme.accent} name="PL（発生）" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-3 animate-fadeIn">

            {/* 総資産 */}
            <button
              onClick={() => setShowAssetEditModal(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs ${theme.textSecondary} font-medium uppercase tracking-wide`}>Total Assets</p>
                <Edit2 size={13} className={theme.textSecondary} />
              </div>
              <p className={`text-3xl font-bold ${theme.text} mb-3 tabular-nums tracking-tight`}>
                ¥{((isNaN(assetData.savings)?0:assetData.savings)+(isNaN(assetData.investments)?0:assetData.investments)+(isNaN(assetData.nisa)?0:(assetData.nisa||0))+(isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0))).toLocaleString()}
              </p>
              {(() => {
                const total = (isNaN(assetData.savings)?0:assetData.savings)+(isNaN(assetData.investments)?0:assetData.investments)+(isNaN(assetData.nisa)?0:(assetData.nisa||0))+(isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0));
                if (total === 0) return null;
                return (
                  <div className="w-full h-2 rounded-full overflow-hidden flex mb-3">
                    <div style={{ width: `${(isNaN(assetData.savings)?0:assetData.savings)/total*100}%`, backgroundColor: '#3b82f6' }}></div>
                    <div style={{ width: `${(isNaN(assetData.investments)?0:assetData.investments)/total*100}%`, backgroundColor: '#a855f7' }}></div>
                    <div style={{ width: `${(isNaN(assetData.nisa)?0:(assetData.nisa||0))/total*100}%`, backgroundColor: theme.green }}></div>
                    <div style={{ width: `${(isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0))/total*100}%`, backgroundColor: theme.accent }}></div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '現預金', value: isNaN(assetData.savings)?0:assetData.savings, color: '#3b82f6' },
                  { label: '投資', value: isNaN(assetData.investments)?0:assetData.investments, color: '#a855f7' },
                  { label: 'NISA', value: isNaN(assetData.nisa)?0:(assetData.nisa||0), color: theme.green },
                  { label: '投資待機', value: isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0), color: theme.accent },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={`text-[10px] ${theme.textSecondary} mb-0.5`}>{label}</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color }}>¥{(value/10000).toFixed(0)}万</p>
                  </div>
                ))}
              </div>
            </button>

            {/* 投資実行 */}
            <button
              onClick={() => setShowInvestModal(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-3.5 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[10px] ${theme.textSecondary} mb-0.5 uppercase tracking-wide font-medium`}>振替・投資実行</p>
                  <p className={`text-sm font-semibold ${theme.text}`}>現預金・待機資金 → 投資口座</p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </button>

            {/* 同世代比較 */}
            <button
              onClick={() => setShowBenchmark(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-3.5 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-[10px] ${theme.textSecondary} mb-1 font-medium uppercase tracking-wide`}>
                    {userInfo?.age ? `同世代比較（${getAgeGroup()==='20s'?'20代':getAgeGroup()==='30s'?'30代':getAgeGroup()==='40s'?'40代':getAgeGroup()==='50s'?'50代':'60代以上'}）` : '同世代比較'}
                  </p>
                  <div className="flex items-center gap-2">
                    {!userInfo?.age && (
                      <button onClick={() => setActiveTab('settings')} className={`text-xs px-2 py-1 rounded-lg mb-1 ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        ⚙ 年齢を設定すると同世代と比較できます
                      </button>
                    )}
                    <p className="text-xl font-bold tabular-nums" style={{ color: calculateBenchmark().isAboveAverage ? theme.green : theme.red }}>
                      {calculateBenchmark().isAboveAverage?'+':''}{(calculateBenchmark().difference/10000).toFixed(0)}万円
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                      backgroundColor: calculateBenchmark().isAboveAverage ? 'rgba(12,214,100,0.15)' : 'rgba(255,69,58,0.15)',
                      color: calculateBenchmark().isAboveAverage ? theme.green : theme.red
                    }}>
                      上位{(100-calculateBenchmark().percentile).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl ml-2">📊</div>
              </div>
            </button>

            {/* 今月の収支 */}
            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>今月の収支</h2>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}
                >
                  予算設定 →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className={`${darkMode ? 'bg-neutral-900 border border-neutral-700' : 'bg-neutral-50'} rounded-lg p-3`}>
                  <p className={`text-xs ${theme.textSecondary} mb-1`}>収入 (PL)</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: theme.green }}>¥{(budgetAnalysis.income.actual/10000).toFixed(1)}万</p>
                  <p className={`text-xs ${theme.textSecondary} tabular-nums`}>予算 ¥{(budgetAnalysis.income.budgeted/10000).toFixed(0)}万</p>
                </div>
                <div className={`${darkMode ? 'bg-neutral-900 border border-neutral-700' : 'bg-neutral-50'} rounded-lg p-3`}>
                  <p className={`text-xs ${theme.textSecondary} mb-1`}>支出 (PL)</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: budgetAnalysis.expense.difference<=0?theme.green:theme.red }}>
                    ¥{(budgetAnalysis.expense.actual/10000).toFixed(1)}万
                  </p>
                  <p className={`text-xs ${theme.textSecondary} tabular-nums`}>予算 ¥{(budgetAnalysis.expense.budgeted/10000).toFixed(0)}万</p>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-neutral-900 border border-neutral-700' : 'bg-neutral-50'} rounded-lg p-3 space-y-1.5`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme.textSecondary}`}>PL残高（発生ベース）</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: currentBalance.plBalance>=0?theme.green:theme.red }}>
                    {currentBalance.plBalance>=0?'+':''}¥{currentBalance.plBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme.textSecondary}`}>CF残高（現金ベース）</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: currentBalance.cfBalance>=0?theme.green:theme.red }}>
                    {currentBalance.cfBalance>=0?'+':''}¥{currentBalance.cfBalance.toLocaleString()}
                  </span>
                </div>
                {currentBalance.investmentTransfer > 0 && (
                  <div className="flex justify-between items-center pt-1" style={{ borderTop: `1px solid ${darkMode?'#2C2C2E':'#e5e7eb'}` }}>
                    <span className={`text-xs ${theme.textSecondary}`}>📈 投資積立（除外済）</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#a855f7' }}>¥{currentBalance.investmentTransfer.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {!monthlyHistory[currentMonth] && currentBalance.cfBalance !== 0 && (
                <button
                  onClick={() => openCloseMonthModal()}
                  className="w-full mt-3 py-2.5 rounded-xl font-semibold text-white transition-all hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  今月を締める
                </button>
              )}
            </div>

            {/* 支出内訳（投資除外） */}
            {(() => {
              const investIds = new Set(recurringTransactions.filter(r => r.type==='investment'||r.type==='fund').map(r => r.id));
              const catMap = transactions
                .filter(t => t.date.startsWith(currentMonth) && t.amount < 0 && !t.isSettlement && !(t.recurringId && investIds.has(t.recurringId)) && !t.isInvestment)
                .reduce((acc, t) => { acc[t.category] = (acc[t.category]||0) + Math.abs(t.amount); return acc; }, {});
              const items = Object.entries(catMap).map(([category, amount]) => ({ category, amount })).sort((a,b) => b.amount - a.amount);
              const total = items.reduce((s, i) => s + i.amount, 0);
              if (items.length === 0) return null;
              return (
                <div className={`${theme.cardGlass} rounded-xl p-4`}>
                  <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>今月の支出内訳</h2>
                  <div className="space-y-2.5">
                    {items.map((item, idx) => {
                      const pct = item.amount / total * 100;
                      const bd = budgetAnalysis.categoryComparison[item.category];
                      return (
                        <div key={item.category} className="animate-fadeIn" style={{ animationDelay: `${idx*0.04}s` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${theme.text}`}>{item.category}</span>
                            <div className="flex items-center gap-2">
                              {bd && bd.budgeted > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{
                                  backgroundColor: bd.difference<=0?'rgba(12,214,100,0.15)':'rgba(255,69,58,0.15)',
                                  color: bd.difference<=0?theme.green:theme.red
                                }}>{bd.percentage.toFixed(0)}%</span>
                              )}
                              <span className={`text-xs font-semibold ${theme.text} tabular-nums`}>¥{item.amount.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className={`w-full ${darkMode?'bg-neutral-800':'bg-neutral-200'} rounded-full h-1.5 overflow-hidden`}>
                            <div className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: bd&&bd.difference>0?theme.red:theme.accent }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="space-y-3 animate-fadeIn">


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
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 flex items-center justify-between hover-scale transition-all`}
            >
              <div className="text-left">
                <p className={`text-sm font-semibold ${theme.text}`}>積立・投資目標の設定</p>
                <p className={`text-xs ${theme.textSecondary} mt-0.5`}>目標金額・運用期間・利回りなど</p>
              </div>
              <span className={`text-lg ${theme.textSecondary}`}>›</span>
            </button>

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

        {activeTab === 'settings' && (
          <div className="space-y-2 animate-fadeIn pb-6">

            <AccSection id="appearance" icon="🌙" title="外観" expanded={settingsExpanded['appearance']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className={`text-sm font-semibold ${theme.text}`}>ダークモード</p>
                  <p className={`text-xs ${theme.textSecondary} mt-0.5`}>{darkMode ? 'ON' : 'OFF'}</p>
                </div>
                <button onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-neutral-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </AccSection>

            <AccSection id="profile" icon="👤" title="プロフィール" expanded={settingsExpanded['profile']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1.5`}>名前</label>
                  <input type="text" value={userInfo?.name || ''} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1.5`}>年齢</label>
                  <input type="number" value={userInfo?.age || ''} onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                </div>
              </div>
              {!userInfo?.age && (
                <p className={`text-xs mt-2 px-2 py-1.5 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  💡 年齢を設定すると資産タブで同世代比較が使えます
                </p>
              )}
            </AccSection>

            <AccSection id="budget" icon="📊" title="月間予算" expanded={settingsExpanded['budget']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="space-y-3 pt-3">
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>月間収入予定</label>
                  <input type="text" inputMode="numeric" value={monthlyBudget.income}
                    onChange={(e) => setMonthlyBudget({ ...monthlyBudget, income: Number(e.target.value.replace(/[^0-9]/g, '')) })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{monthlyBudget.income.toLocaleString()}</p>
                </div>
                <div className="border-t pt-3" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <p className={`text-xs font-semibold ${theme.text} mb-2`}>カテゴリ別予算</p>
                  <div className="space-y-2">
                    {Object.entries(monthlyBudget.expenses).map(([category, amount]) => (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <label className={`text-xs font-medium ${theme.textSecondary}`}>{category}</label>
                          <span className={`text-xs font-bold tabular-nums ${theme.text}`}>¥{amount.toLocaleString()}</span>
                        </div>
                        <input type="range" min="0" max="300000" step="5000" value={amount}
                          onChange={(e) => setMonthlyBudget({ ...monthlyBudget, expenses: { ...monthlyBudget.expenses, [category]: Number(e.target.value) } })}
                          className="w-full" style={{ accentColor: theme.accent }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-lg p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={theme.textSecondary}>予算合計支出</span>
                    <span className={`font-bold tabular-nums ${theme.text}`}>¥{Object.values(monthlyBudget.expenses).reduce((a,b)=>a+b,0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={theme.textSecondary}>予算収支</span>
                    <span className="font-bold tabular-nums" style={{ color: monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((a,b)=>a+b,0) >= 0 ? theme.green : theme.red }}>
                      ¥{(monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((a,b)=>a+b,0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </AccSection>

            <AccSection id="investment" icon="📈" title="積立・投資目標" expanded={settingsExpanded['investment']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="space-y-4 pt-3">
                {[
                  { key: 'targetAmount', label: '目標金額', min: 1000000, max: 500000000, step: 1000000, fmt: v => v >= 100000000 ? `¥${(v/100000000).toFixed(1)}億` : `¥${(v/10000).toFixed(0)}万` },
                  { key: 'years', label: '運用期間', min: 1, max: 50, step: 1, fmt: v => `${v}年` },
                  { key: 'monthlySavings', label: '月々の貯金', min: 0, max: 2000000, step: 10000, fmt: v => `¥${v.toLocaleString()}` },
                  { key: 'monthlyInvestment', label: '月々の積立投資', min: 0, max: 2000000, step: 10000, fmt: v => `¥${v.toLocaleString()}` },
                  { key: 'returnRate', label: '想定利回り', min: 0, max: 15, step: 0.5, fmt: v => `${v}%` },
                  { key: 'savingsInterestRate', label: '預金金利', min: 0, max: 5, step: 0.1, fmt: v => `${v}%` },
                ].map(({ key, label, min, max, step, fmt }) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-medium ${theme.textSecondary}`}>{label}</label>
                      <input
                        type="text" inputMode="decimal"
                        value={simulationSettings[key]}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                          if (!isNaN(v)) setSimulationSettings({ ...simulationSettings, [key]: Math.min(max, Math.max(min, v)) });
                        }}
                        className={`w-32 px-2.5 py-1.5 rounded-lg text-sm font-bold tabular-nums text-right ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
                      />
                    </div>
                    <input type="range" min={min} max={max} step={step} value={simulationSettings[key]}
                      onChange={(e) => setSimulationSettings({ ...simulationSettings, [key]: Number(e.target.value) })}
                      className="w-full" style={{ accentColor: theme.accent }} />
                    <p className={`text-[10px] text-right ${theme.textSecondary} -mt-0.5`}>{fmt(simulationSettings[key])}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <label className={`text-xs font-medium ${theme.text}`}>新NISA制度を利用</label>
                  <button onClick={() => setSimulationSettings({ ...simulationSettings, useNisa: !simulationSettings.useNisa })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simulationSettings.useNisa ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${simulationSettings.useNisa ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {simulationSettings.useNisa && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-lg p-2 text-xs`}>
                    <p className={`${darkMode ? 'text-green-400' : 'text-green-700'} font-medium`}>✓ NISA口座で運用（利益非課税）</p>
                  </div>
                )}
              </div>
            </AccSection>

            <AccSection id="category" icon="🏷️" title="カテゴリ管理" expanded={settingsExpanded['category']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="pt-3">
                <div className="flex gap-2 mb-3">
                  {['expense', 'income'].map(type => (
                    <button key={type} onClick={() => setNewCategoryType(type)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ backgroundColor: newCategoryType === type ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'), color: newCategoryType === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373') }}>
                      {type === 'expense' ? '支出カテゴリ' : '収入カテゴリ'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="新しいカテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  <button onClick={() => {
                      if (!newCategoryName.trim()) return;
                      if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: [...prev.expense, newCategoryName.trim()] }));
                      else setCustomCategories(prev => ({ ...prev, income: [...prev.income, newCategoryName.trim()] }));
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>追加</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(newCategoryType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <span key={cat} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700'}`}>
                      {cat}
                      {(newCategoryType === 'expense' ? customCategories.expense : customCategories.income).includes(cat) && (
                        <button onClick={() => {
                            if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: prev.expense.filter(c => c !== cat) }));
                            else setCustomCategories(prev => ({ ...prev, income: prev.income.filter(c => c !== cat) }));
                          }}
                          className="text-red-400 hover:text-red-600 ml-0.5 font-bold">×</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </AccSection>

            <AccSection id="creditcard" icon="💳" title="クレジットカード" expanded={settingsExpanded['creditcard']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="pt-3">
                <div className="flex justify-end mb-3">
                  <button onClick={() => { setEditingCard(null); setShowCardModal(true); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: theme.accent }}>+ 追加</button>
                </div>
                {creditCards.length === 0 ? (
                  <p className={`text-xs text-center py-3 ${theme.textSecondary}`}>クレジットカードが登録されていません</p>
                ) : (
                  <div className="space-y-2">
                    {creditCards.map(card => (
                      <div key={card.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text}`}>{card.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>締め日: {card.closingDay}日 / 支払い: 翌{card.paymentMonth === 2 ? '々' : ''}月{card.paymentDay}日</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingCard(card); setShowCardModal(true); }} className="p-1.5 rounded-lg text-blue-500">✏️</button>
                          <button onClick={() => { if(confirm('削除しますか？')) setCreditCards(prev => prev.filter(c => c.id !== card.id)); }} className="p-1.5 rounded-lg text-red-500">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccSection>

            <AccSection id="data" icon="💾" title="データ管理" expanded={settingsExpanded['data']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="space-y-2 pt-3">
                <button
                  onClick={() => {
                    const data = { transactions, recurringTransactions, creditCards, monthlyBudget, simulationSettings, userInfo, assetData };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `money-planner-${new Date().toISOString().slice(0,10)}.json`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover-scale ${darkMode ? 'border-neutral-700 text-neutral-300' : 'border-neutral-200 text-neutral-600'}`}
                >
                  📤 データをエクスポート
                </button>
                <button
                  onClick={() => {
                    const parentIds = new Set(transactions.filter(t => !t.isSettlement).map(t => t.id));
                    const orphans = transactions.filter(t => t.isSettlement && t.parentTransactionId && !parentIds.has(t.parentTransactionId));
                    if (orphans.length === 0) { alert('孤立した引き落とし予約はありませんでした。'); return; }
                    if (!confirm('孤立した引き落とし予約が' + orphans.length + '件見つかりました。削除しますか？')) return;
                    setTransactions(prev => prev.filter(t => !orphans.find(o => o.id === t.id)));
                  }}
                  className={"w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover-scale " + (darkMode ? "border-orange-500/30 text-orange-400" : "border-orange-400/40 text-orange-500")}
                >
                  🧹 孤立した引き落とし予約を削除
                </button>
                <button
                  onClick={() => {
                    if (creditCards.length === 0) { alert('クレジットカードが登録されていません。'); return; }
                    const settlements = transactions.filter(t => t.isSettlement && t.parentTransactionId);
                    if (settlements.length === 0) { alert('更新対象の引き落とし予約がありません。'); return; }
                    if (!confirm('既存の引き落とし予約日を現在のカード設定で一括更新しますか？\n(' + settlements.length + '件)')) return;
                    setTransactions(prev => prev.map(t => {
                      if (!t.isSettlement || !t.parentTransactionId) return t;
                      const parent = prev.find(p => p.id === t.parentTransactionId);
                      if (!parent) return t;
                      const cardId = parent.cardId || (creditCards[0] && creditCards[0].id);
                      const card = creditCards.find(c => String(c.id) === String(cardId)) || creditCards[0];
                      if (!card) return t;
                      const newDate = getSettlementDate(parent.date, cardId);
                      const dateStr = newDate.getFullYear() + '-' + String(newDate.getMonth()+1).padStart(2,'0') + '-' + String(newDate.getDate()).padStart(2,'0');
                      const category = 'クレジット引き落とし' + (card ? '（' + card.name + '）' : '');
                      return { ...t, date: dateStr, category: category, cardId: cardId, settled: newDate <= new Date() };
                    }));
                    alert('引き落とし予約日を更新しました！');
                  }}
                  className={"w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover-scale " + (darkMode ? "border-blue-500/30 text-blue-400" : "border-blue-400/40 text-blue-500")}
                >
                  🔄 引き落とし予約日を一括更新
                </button>
                <button
                  onClick={() => {
                    if (!confirm('全データをリセットしますか？この操作は取り消せません。')) return;
                    setTransactions([]); setRecurringTransactions([]); setMonthlyHistory({});
                    setAssetData({ savings: 0, investments: 0, nisa: 0, dryPowder: 0 });
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-red-500/30 text-red-500 transition-all hover-scale"
                >
                  🗑️ 全データをリセット
                </button>
              </div>
            </AccSection>

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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.nisa || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1 flex items-center gap-1`}>
                  <Droplets size={14} style={{ color: theme.accent }} />
                  投資待機資金
                </label>
                <p className={`text-[11px] ${theme.textSecondary} mb-2 leading-relaxed`}>
                  💡 投資タイミングを待っている現金。株安・暴落時などに素早く投資に回すために別管理する資金です。
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.dryPowder || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, dryPowder: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.dryPowder || 0).toLocaleString()}</p>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textSecondary}`}>総資産</span>
                  <span className={`text-lg font-bold ${theme.text} tabular-nums`}>
                    ¥{((isNaN(assetData.savings) ? 0 : assetData.savings) + (isNaN(assetData.investments) ? 0 : assetData.investments) + (isNaN(assetData.nisa) ? 0 : (assetData.nisa || 0)) + (isNaN(assetData.dryPowder) ? 0 : (assetData.dryPowder || 0))).toLocaleString()}
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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
          <div className={`${theme.cardGlass} rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col animate-slideUp`}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>カテゴリ管理</h2>
              <button
                onClick={() => { setShowCategoryModal(false); setEditingCategoryName(null); }}
                className={`text-2xl ${theme.textSecondary}`}
              >✕</button>
            </div>

            <div className="px-6 pb-3">
              <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5' }}>
                {(['expense', 'income']).map(type => (
                  <button
                    key={type}
                    onClick={() => { setNewCategoryType(type); setEditingCategoryName(null); }}
                    className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: newCategoryType === type ? (darkMode ? '#2a2a2a' : '#fff') : 'transparent',
                      color: newCategoryType === type ? (type === 'expense' ? theme.red : theme.green) : (darkMode ? '#737373' : '#a3a3a3'),
                      boxShadow: newCategoryType === type ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    {type === 'expense' ? '支出' : '収入'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-3">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary} mb-2`}>カテゴリ一覧</p>
              <div className="space-y-1.5">
                {(newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES)
                  .filter(c => !(newCategoryType === 'expense' ? deletedExp : deletedInc).includes(c))
                  .map(origName => {
                    const displayName = (newCategoryType === 'expense' ? renamedExp : renamedInc)[origName] || origName;
                    const isEditing = editingCategoryName === origName + '_default';
                    return (
                      <div key={origName} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${darkMode ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-500' : 'bg-neutral-200 text-neutral-400'}`}>標準</span>
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingCategoryValue}
                            onChange={e => setEditingCategoryValue(e.target.value)}
                            onBlur={() => {
                              handleRenameDefaultCategory(origName, editingCategoryValue, newCategoryType);
                              setEditingCategoryName(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') e.target.blur();
                              if (e.key === 'Escape') setEditingCategoryName(null);
                            }}
                            className={`flex-1 px-2.5 py-1 rounded-lg text-sm font-medium border ${darkMode ? 'bg-neutral-700 text-white border-blue-500' : 'bg-white border-blue-400 text-neutral-900'} focus:outline-none`}
                          />
                        ) : (
                          <span className={`flex-1 text-sm font-medium ${theme.text}`}>
                            {displayName}
                            {(newCategoryType === 'expense' ? renamedExp : renamedInc)[origName] && (
                              <span className={`ml-1.5 text-[9px] ${theme.textSecondary}`}>(元: {origName})</span>
                            )}
                          </span>
                        )}
                        <button
                          onClick={() => { setEditingCategoryName(origName + '_default'); setEditingCategoryValue(displayName); }}
                          className={`p-1.5 rounded-lg transition-all text-xs ${darkMode ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'}`}
                        >✏️</button>
                        {origName !== 'その他' && (
                          <button
                            onClick={() => handleDeleteDefaultCategory(origName, newCategoryType)}
                            className="p-1.5 rounded-lg text-xs text-red-400 hover:text-red-500 transition-all"
                          >✕</button>
                        )}
                      </div>
                    );
                  })}
                {(customCategories[newCategoryType] || []).length > 0 && (
                  <div className={`h-px my-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                )}
                {(customCategories[newCategoryType] || []).map(cat => (
                  <div key={cat} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${darkMode ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0"
                      style={{ backgroundColor: theme.accent + '25', color: theme.accent }}
                    >カスタム</span>
                    <span className={`flex-1 text-sm font-medium ${theme.text}`}>{cat}</span>
                    <button
                      onClick={() => deleteCustomCategory(cat, newCategoryType)}
                      className="p-1.5 rounded-lg text-xs text-red-400 hover:text-red-500 transition-all"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`px-6 pb-6 pt-3 border-t ${darkMode ? 'border-neutral-800' : 'border-neutral-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary} mb-2`}>新しいカテゴリを追加</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例：サブスク"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'} focus:outline-none focus:border-blue-500`}
                />
                <button
                  onClick={addCustomCategory}
                  className="px-4 py-2.5 rounded-xl font-bold text-white text-sm hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >追加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto animate-slideUp`}>
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                >
                  <option value="">選択してください</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 繰り返しタイプ選択 */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>繰り返しのルール</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, recurrenceType: 'monthly-date', weekday: null, weekNumber: null })}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                      editingRecurring?.recurrenceType === 'monthly-date' || !editingRecurring?.recurrenceType
                        ? 'bg-blue-500 text-white'
                        : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    月（日付指定）
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, recurrenceType: 'monthly-weekday', day: null, weekNumber: 1, weekday: 'monday' })}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                      editingRecurring?.recurrenceType === 'monthly-weekday'
                        ? 'bg-blue-500 text-white'
                        : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    月（曜日指定）
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, recurrenceType: 'weekly', day: null, weekday: 'monday' })}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                      editingRecurring?.recurrenceType === 'weekly'
                        ? 'bg-blue-500 text-white'
                        : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    週
                  </button>
                </div>
              </div>
              
              {/* 日付指定（月・日付指定の場合） */}
              {(!editingRecurring?.recurrenceType || editingRecurring?.recurrenceType === 'monthly-date') && (
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>日付</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1"
                    value={editingRecurring?.day || ''}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, day: Number(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                    } focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>毎月{editingRecurring?.day || '?'}日</p>
                </div>
              )}
              
              {/* 曜日指定（月・曜日指定 or 週の場合） */}
              {(editingRecurring?.recurrenceType === 'monthly-weekday' || editingRecurring?.recurrenceType === 'weekly') && (
                <div>
                  {editingRecurring?.recurrenceType === 'monthly-weekday' && (
                    <div className="mb-3">
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>第何週</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, -1].map(num => (
                          <button
                            key={num}
                            onClick={() => setEditingRecurring({ ...editingRecurring, weekNumber: num })}
                            className={`py-2 rounded-lg text-sm font-medium transition-all ${
                              editingRecurring?.weekNumber === num
                                ? 'bg-blue-500 text-white'
                                : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {num === -1 ? '最終' : `第${num}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>曜日</label>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { key: 'sunday', label: '日' },
                      { key: 'monday', label: '月' },
                      { key: 'tuesday', label: '火' },
                      { key: 'wednesday', label: '水' },
                      { key: 'thursday', label: '木' },
                      { key: 'friday', label: '金' },
                      { key: 'saturday', label: '土' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setEditingRecurring({ ...editingRecurring, weekday: key })}
                        className={`py-2 rounded-lg text-xs font-medium transition-all ${
                          editingRecurring?.weekday === key
                            ? 'bg-blue-500 text-white'
                            : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 繰り返しの間隔 */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  繰り返しの間隔: {editingRecurring?.recurrenceType === 'weekly' ? `${editingRecurring?.interval || 1}週` : `${editingRecurring?.interval || 1}ヶ月`}
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={editingRecurring?.interval || 1}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, interval: Number(e.target.value) })}
                  className="w-full"
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {editingRecurring?.recurrenceType === 'weekly' 
                    ? `毎${editingRecurring?.interval || 1}週`
                    : `毎${editingRecurring?.interval || 1}ヶ月`
                  }
                </p>
              </div>
              
              {/* 開始日 */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>開始日</label>
                <input
                  type="date"
                  value={editingRecurring?.startDate || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, startDate: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-base appearance-none transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                />
              </div>
              
              {/* 終了日 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${theme.textSecondary}`}>終了日</label>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, endDate: editingRecurring?.endDate ? null : new Date().toISOString().slice(0, 10) })}
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      editingRecurring?.endDate ? 'bg-blue-500 text-white' : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {editingRecurring?.endDate ? '設定中' : '無期限'}
                  </button>
                </div>
                {editingRecurring?.endDate && (
                  <input
                    type="date"
                    value={editingRecurring.endDate}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, endDate: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                    } focus:outline-none focus:border-blue-500`}
                    style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                  />
                )}
              </div>
              
              {/* 休日の処理 */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>当日が休日の場合</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'none', label: '何もしない' },
                    { key: 'before', label: '前営業日' },
                    { key: 'after', label: '翌営業日' },
                    { key: 'skip', label: 'スキップ' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setEditingRecurring({ ...editingRecurring, holidayRule: key })}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        (editingRecurring?.holidayRule || 'none') === key
                          ? 'bg-blue-500 text-white'
                          : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'fund', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'fund' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'fund' ? theme.green : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'fund' ? '#fff' : theme.textSecondary
                    }}
                  >
                    投資信託
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'insurance', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'insurance' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'insurance' ? '#3b82f6' : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'insurance' ? '#fff' : theme.textSecondary
                    }}
                  >
                    🛡️ 積立保険
                  </button>
                </div>
              </div>

              {/* 支払い方法（全種類で選択可） */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>支払い方法</label>
                <div className="flex gap-2 mb-2">
                  {[
                    { key: 'cash', label: '💵 現金・振替' },
                    { key: 'credit', label: '💳 クレジット' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setEditingRecurring({ ...editingRecurring, paymentMethod: key, cardId: key === 'credit' ? (editingRecurring?.cardId || (creditCards[0] && creditCards[0].id)) : null })}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: (editingRecurring?.paymentMethod || 'cash') === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                        color: (editingRecurring?.paymentMethod || 'cash') === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                      }}
                    >{label}</button>
                  ))}
                </div>
                {(editingRecurring?.paymentMethod === 'credit') && creditCards.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {creditCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => setEditingRecurring({ ...editingRecurring, cardId: card.id })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: (editingRecurring?.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? theme.accent : (darkMode ? '#2a2a2a' : '#f0f0f0'),
                          color: (editingRecurring?.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        }}
                      >{card.name}</button>
                    ))}
                  </div>
                )}
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

      {showDateTransactionsModal && selectedDate && (() => {
        const dayTxns = getTransactionsForDay(selectedDate.slice(0, 7), Number(selectedDate.slice(-2)));
        const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
        return (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => { setShowDateTransactionsModal(false); setSelectedDate(null); }}>
          <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>

            {/* ヘッダー */}
            <div className={`sticky top-0 flex items-center justify-between px-5 pt-5 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
              <div>
                <p className={`text-xs font-bold ${theme.textSecondary} uppercase tracking-widest`}>履歴</p>
                <h2 className={`text-lg font-bold ${theme.text}`}>{dateLabel}</h2>
              </div>
              <button onClick={() => { setShowDateTransactionsModal(false); setSelectedDate(null); }}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>
                ✕
              </button>
            </div>

            <div className="px-5 pb-8 pt-4 space-y-4">

              {/* 既存の取引一覧 */}
              {(() => {
                if (dayTxns.length === 0) return (
                  <p className={`text-sm text-center py-4 ${theme.textSecondary}`}>この日の取引はありません</p>
                );

                // isSettlement取引をcardId別にグループ化
                const settlementGroups = {};
                const normalTxns = [];
                dayTxns.forEach(t => {
                  if (t.isSettlement) {
                    const key = t.cardId || 'default';
                    if (!settlementGroups[key]) {
                      const card = creditCards.find(c => c.id === t.cardId);
                      settlementGroups[key] = { cardName: card ? card.name : 'カード', total: 0, items: [], settled: t.settled };
                    }
                    settlementGroups[key].total += Math.abs(t.amount);
                    settlementGroups[key].items.push(t);
                  } else {
                    normalTxns.push(t);
                  }
                });

                const settlementRows = Object.entries(settlementGroups).map(([key, g]) => ({ key, ...g }));

                return (
                  <div className="space-y-2">
                    {/* クレジット引き落とし（グループ化） */}
                    {settlementRows.map(g => {
                      const groupKey = `settle-${g.key}`;
                      const isExpanded = !!expandedCreditGroups[groupKey];
                      const canExpand = g.items.length > 1;
                      return (
                        <div key={g.key} className={`rounded-xl overflow-hidden ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                          <div
                            className={`flex items-center justify-between p-3 ${canExpand ? 'cursor-pointer' : ''}`}
                            onClick={() => canExpand && setExpandedCreditGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${darkMode ? 'bg-orange-500/15' : 'bg-orange-50'}`}>
                                💳
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-sm font-semibold ${theme.text}`}>クレジット引き落とし</p>
                                  {canExpand && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>
                                      {g.items.length}件
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] ${theme.textSecondary}`}>{g.cardName}</span>
                                  {!g.settled && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: theme.orange, color: '#000' }}>引落予定</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>
                                ¥{g.total.toLocaleString()}
                              </p>
                              {canExpand && (
                                <span className={`text-xs ${theme.textSecondary} transition-transform duration-200`} style={{ display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                              )}
                            </div>
                          </div>
                          {/* 内訳展開 */}
                          {canExpand && isExpanded && (
                            <div className="animate-fadeIn" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                              {g.items.map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => { setEditingTransaction(t); setShowDateTransactionsModal(false); }}
                                  className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${darkMode ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-100'}`}
                                >
                                  <div className="flex-1 min-w-0 text-left pl-10">
                                    {(() => {
                                      // parentTransactionIdで元取引を参照してカテゴリ・メモを表示
                                      const parent = t.parentTransactionId
                                        ? transactions.find(p => p.id === t.parentTransactionId)
                                        : null;
                                      const label = parent ? parent.category : (t.category && !t.category.startsWith('クレ') ? t.category : null);
                                      const sub = parent ? parent.memo : t.memo;
                                      return (
                                        <>
                                          <p className={`text-xs font-medium truncate ${theme.text}`}>{label || '（詳細なし）'}</p>
                                          {sub && <p className={`text-[10px] truncate ${theme.textSecondary}`}>{sub}</p>}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-xs font-bold tabular-nums shrink-0 ml-3" style={{ color: darkMode ? '#888' : '#aaa' }}>
                                    ¥{Math.abs(t.amount).toLocaleString()}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 通常の取引 */}
                    {normalTxns.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setEditingTransaction(t); setShowDateTransactionsModal(false); }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover-scale ${
                          darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-50 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 text-left">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                            t.type==='income' ? (darkMode?'bg-green-500/15':'bg-green-50') :
                            t.paymentMethod==='credit' ? (darkMode?'bg-blue-500/15':'bg-blue-50') :
                            (darkMode?'bg-neutral-800':'bg-neutral-100')
                          }`}>
                            {t.isRecurring ? (t.isInvestment ? '📈' : '🔄') : t.type === 'income' ? '💰' : (t.paymentMethod === 'credit' ? '💳' : '💵')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                              {t.isSplit && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${t.splitSettled ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-400'}`}>
                                  {t.splitSettled ? '👥精算済' : '👥立替'}
                                </span>
                              )}
                            </div>
                            {t.memo && <p className={`text-xs ${theme.textSecondary} mt-0.5 truncate`}>{t.memo}</p>}
                            {!t.settled && t.type === 'expense' && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block" style={{ backgroundColor: theme.orange, color: '#000' }}>
                                {t.paymentMethod === 'credit' ? '💳クレジット' : '予定'}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold tabular-nums" style={{ color: t.amount >= 0 ? theme.green : (t.isInvestment ? '#a855f7' : theme.red) }}>
                          {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* 区切り */}
              <div className={`border-t ${theme.border}`} />

              {/* この日に新規取引を追加するフォーム */}
              <div>
                <p className={`text-xs font-bold ${theme.textSecondary} uppercase tracking-widest mb-3`}>この日に追加</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {[
                      { type: 'expense', label: '支出', color: theme.red },
                      { type: 'income', label: '収入', color: theme.green },
                    ].map(({ type, label, color }) => (
                      <button key={type}
                        onClick={() => setNewTransaction({ ...newTransaction, type, date: selectedDate, paymentMethod: type === 'expense' ? 'credit' : undefined })}
                        className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
                        style={{
                          backgroundColor: newTransaction.type === type ? color : (darkMode ? '#262626' : '#f5f5f5'),
                          color: newTransaction.type === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {newTransaction.type === 'expense' && (
                    <div className="flex gap-2">
                      {[{ key: 'credit', label: '💳 クレジット' }, { key: 'cash', label: '💵 現金' }].map(({ key, label }) => (
                        <button key={key}
                          onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: key, cardId: key === 'credit' ? (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) : null })}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: newTransaction.paymentMethod === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f0f0f0'),
                            color: newTransaction.paymentMethod === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {newTransaction.paymentMethod === 'credit' && creditCards.length >= 1 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {creditCards.map(card => (
                        <button key={card.id}
                          onClick={() => setNewTransaction({ ...newTransaction, cardId: card.id })}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? theme.accent : (darkMode ? '#2a2a2a' : '#f0f0f0'),
                            color: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                          }}>
                          {card.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input type="text" inputMode="numeric" placeholder="金額"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value.replace(/[^0-9]/g, '') })}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                    <select value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                      <option value="">カテゴリ</option>
                      {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <input type="text" placeholder="メモ（任意）"
                    value={newTransaction.memo}
                    onChange={(e) => setNewTransaction({ ...newTransaction, memo: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-200 placeholder-neutral-400'} focus:outline-none`} />

                  <button
                    onClick={() => {
                      if (!newTransaction.amount || !newTransaction.category) return;
                      const amt = newTransaction.type === 'expense'
                        ? -Math.abs(Number(newTransaction.amount))
                        : Math.abs(Number(newTransaction.amount));
                      const t = {
                        id: Date.now(),
                        date: selectedDate,
                        category: newTransaction.category,
                        memo: newTransaction.memo || '',
                        amount: amt,
                        type: newTransaction.type,
                        paymentMethod: newTransaction.type === 'income' ? undefined : newTransaction.paymentMethod,
                        settled: newTransaction.type === 'income' ? true : (newTransaction.paymentMethod === 'cash'),
                        isSettlement: false,
                        isSplit: false,
                        splitAmount: 0,
                        splitMembers: []
                      };
                      if (newTransaction.type === 'expense' && newTransaction.paymentMethod === 'credit') {
                        const cardId = newTransaction.cardId || (creditCards[0] ? creditCards[0].id : null);
                        const card = creditCards.find(c => c.id === cardId);
                        const settlementDate = getSettlementDate(selectedDate, cardId);
                        const settlementTx = {
                          id: Date.now() + 1,
                          date: settlementDate.getFullYear() + '-' + String(settlementDate.getMonth()+1).padStart(2,'0') + '-' + String(settlementDate.getDate()).padStart(2,'0'),
                          category: 'クレジット引き落とし' + (card ? '（' + card.name + '）' : ''),
                          amount: amt,
                          type: 'expense',
                          paymentMethod: 'cash',
                          settled: settlementDate <= new Date(),
                          isSettlement: true,
                          parentTransactionId: t.id,
                          cardId: cardId
                        };
                        setTransactions([{ ...t, cardId }, settlementTx, ...transactions]);
                      } else {
                        setTransactions([t, ...transactions]);
                      }
                      setNewTransaction({ amount: '', category: '', type: 'expense', paymentMethod: 'credit', date: new Date().toISOString().slice(0, 10), memo: '', isSplit: false, splitMembers: [] });
                    }}
                    className="w-full py-2.5 rounded-xl font-semibold text-white transition-all hover-scale"
                    style={{ backgroundColor: theme.accent }}>
                    追加する
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
        );
      })()}

      {showInvestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>📈 投資を実行</h2>
              <button onClick={() => setShowInvestModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>振替元</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInvestForm({ ...investForm, fromSource: 'savings' })}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      investForm.fromSource === 'savings' ? 'scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: investForm.fromSource === 'savings' ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: investForm.fromSource === 'savings' ? '#fff' : theme.textSecondary
                    }}
                  >
                    💰 現預金<br/>
                    <span className="text-xs tabular-nums">¥{((isNaN(assetData.savings) ? 0 : assetData.savings) / 10000).toFixed(0)}万</span>
                  </button>
                  <button
                    onClick={() => setInvestForm({ ...investForm, fromSource: 'dryPowder' })}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      investForm.fromSource === 'dryPowder' ? 'scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: investForm.fromSource === 'dryPowder' ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: investForm.fromSource === 'dryPowder' ? '#fff' : theme.textSecondary
                    }}
                  >
                    💧 待機資金<br/>
                    <span className="text-xs tabular-nums">¥{((isNaN(assetData.dryPowder) ? 0 : (assetData.dryPowder || 0)) / 10000).toFixed(0)}万</span>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>振替先</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'investments', label: '📊 投資', color: theme.purple },
                    { key: 'nisa', label: '🌱 NISA', color: theme.green },
                    { key: 'dryPowder', label: '💧 待機資金', color: theme.accent }
                  ].map(({ key, label, color }) => (
                    key !== investForm.fromSource && (
                      <button
                        key={key}
                        onClick={() => setInvestForm({ ...investForm, targetAccount: key })}
                        className={`py-2 rounded-xl font-semibold text-xs transition-all ${
                          investForm.targetAccount === key ? 'scale-105' : ''
                        }`}
                        style={{
                          backgroundColor: investForm.targetAccount === key ? color : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                          color: investForm.targetAccount === key ? '#fff' : theme.textSecondary
                        }}
                      >
                        {label}
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="100000"
                  value={investForm.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setInvestForm({ ...investForm, amount: value });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums text-lg font-bold transition-all ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                  ¥{(Number(investForm.amount) || 0).toLocaleString()}
                </p>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3 text-sm`}>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>
                    {investForm.fromSource === 'savings' ? '💰 現預金' : '💧 待機資金'} から
                  </span>
                  <span className={theme.textSecondary}>
                    {investForm.targetAccount === 'investments' ? '📊 投資口座' : investForm.targetAccount === 'nisa' ? '🌱 NISA' : '💧 待機資金'} へ
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`font-bold tabular-nums`} style={{ color: theme.red }}>
                    -{(Number(investForm.amount) || 0).toLocaleString()}円
                  </span>
                  <span className={`font-bold tabular-nums`} style={{ color: theme.green }}>
                    +{(Number(investForm.amount) || 0).toLocaleString()}円
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvestModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-bold ${
                  darkMode ? 'bg-neutral-800 text-white' : 'border-2 border-neutral-300 text-neutral-700'
                }`}
              >
                キャンセル
              </button>
              <button
                onClick={executeInvestment}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.purple }}
              >
                振替実行
              </button>
            </div>
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
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto animate-slideUp`}>
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
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
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


      {/* ===== チュートリアルスライド ===== */}
      {showTutorial && (() => {
        const slides = [
          {
            emoji: '👋',
            title: 'ようこそ！',
            subtitle: 'お金の流れを、シンプルに管理',
            desc: '収入・支出の記録からクレカ管理・資産管理まで、ひとつのアプリで完結します。全部で7枚のスライドで使い方を説明します。',
            color: '#3b82f6',
          },
          {
            emoji: '💳',
            title: 'クレカ設定を先に済ませよう',
            subtitle: '締め日・引き落とし日を登録',
            desc: '設定タブ →「クレジットカード」から、使っているカードを登録しましょう。締め日と引き落とし日を設定することで、クレカ払いの取引を追加するとその日程で引き落とし予約が自動で作られます。',
            color: '#a855f7',
            tips: ['複数枚のカードも個別に登録できます', '末日締めは「末日」を選んでください'],
          },
          {
            emoji: '📝',
            title: '取引の記録',
            subtitle: '支出・収入を素早く入力',
            desc: 'ホーム右下の「＋ 取引を追加」から入力します。クレジットカード払いを選ぶとカードを選択でき、登録した締め日・引き落とし日に基づいて引き落とし予約が自動生成されます。',
            color: '#ec4899',
            tips: ['💵 現金は即確定、💳 クレカは引き落とし日にCFへ反映', 'カレンダーの日付タップからも追加できます'],
          },
          {
            emoji: '🔄',
            title: '定期支払い',
            subtitle: '毎月の固定費を自動記録',
            desc: 'ホームの「定期支払い → ＋ 追加」で家賃・光熱費・サブスクなどを登録すると、毎月自動で取引が追加されます。投資積立・投資信託・積立保険も登録でき、月締め時に資産へ自動反映されます。',
            color: '#f59e0b',
            tips: ['🔄 固定費、📈 投資積立、📊 投資信託、🛡️ 積立保険', '日付指定・曜日指定どちらも設定できます'],
          },
          {
            emoji: '👥',
            title: '立替払い',
            subtitle: '複数人分の支払いを管理',
            desc: '取引入力で「👥 複数人分を立替払い」をONにすると、誰にいくら立て替えたか個別に記録できます。「÷均等割り」ボタンで自動計算も。精算した人はホームの「立替待ち」から個別に精算処理できます。',
            color: '#3b82f6',
            tips: ['立替分は回収するまで支出から除外されます', '人ごとに個別精算できます'],
          },
          {
            emoji: '💰',
            title: '月締め・資産管理',
            subtitle: '月末に収支を確定させよう',
            desc: '月末に「今月を締める」ボタンを押すと収支が確定し、貯金・投資額が資産タブへ自動で反映されます。資産タブでは総資産・各カテゴリの推移をグラフで確認できます。',
            color: '#10b981',
            tips: ['投資積立・保険は月締め時に自動で資産に加算', '締めた月は編集できますが再締めが必要です'],
          },
          {
            emoji: '🛠️',
            title: 'データ管理',
            subtitle: 'いざというときのメンテナンス',
            desc: '設定タブ →「データ管理」に便利なツールがあります。「🔄 引き落とし予約日を一括更新」でカード設定変更後に既存データをまとめて更新できます。「🧹 孤立した引き落とし予約を削除」で不要なデータも整理できます。',
            color: '#6366f1',
            tips: ['カード設定を変更したら一括更新を忘れずに', 'データのエクスポートでバックアップも可能'],
          },
        ];
        const slide = slides[tutorialPage];
        const isLast = tutorialPage === slides.length - 1;

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <div className={`w-full max-w-md rounded-t-3xl animate-slideUp overflow-hidden`}
              style={{ backgroundColor: darkMode ? '#141414' : '#ffffff', paddingBottom: 'env(safe-area-inset-bottom)' }}>

              {/* プログレスバー */}
              <div className="flex gap-1 px-5 pt-5">
                {slides.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: darkMode ? '#2a2a2a' : '#e5e7eb' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: i < tutorialPage ? '100%' : i === tutorialPage ? '100%' : '0%',
                        backgroundColor: i <= tutorialPage ? slide.color : 'transparent'
                      }} />
                  </div>
                ))}
              </div>

              {/* スライドコンテンツ */}
              <div className="px-6 pt-6 pb-4">
                {/* 絵文字アイコン */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-4"
                  style={{ backgroundColor: slide.color + '20' }}>
                  {slide.emoji}
                </div>

                {/* タイトル */}
                <p className={`text-xs font-bold uppercase tracking-widest mb-1`} style={{ color: slide.color }}>
                  {slide.subtitle}
                </p>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                  {slide.title}
                </h2>
                <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {slide.desc}
                </p>

                {/* Tipsリスト */}
                {slide.tips && (
                  <div className="space-y-1.5 mb-4">
                    {slide.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5" style={{ color: slide.color }}>●</span>
                        <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ボタン */}
              <div className="flex gap-3 px-6 pb-6">
                {tutorialPage > 0 && (
                  <button
                    onClick={() => setTutorialPage(p => p - 1)}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}
                  >
                    ← 戻る
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isLast) { setShowTutorial(false); }
                    else { setTutorialPage(p => p + 1); }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all hover-scale"
                  style={{ backgroundColor: slide.color }}
                >
                  {isLast ? '✓ はじめる' : `次へ (${tutorialPage + 1}/${slides.length})`}
                </button>
              </div>

              {/* スキップ */}
              {!isLast && (
                <button
                  onClick={() => setShowTutorial(false)}
                  className={`w-full pb-3 text-xs text-center ${darkMode ? 'text-neutral-600' : 'text-neutral-400'}`}
                >
                  スキップ
                </button>
              )}
            </div>
          </div>
        );
      })()}

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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
                  } focus:outline-none`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.nisa || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1 flex items-center gap-1`}>
                  <Droplets size={14} style={{ color: theme.accent }} />
                  投資待機資金
                </label>
                <p className={`text-[11px] ${theme.textSecondary} mb-2 leading-relaxed`}>
                  💡 投資タイミングを待っている現金。株安・暴落時などに素早く投資に回すために別管理する資金です。
                </p>
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
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 focus:border-blue-500' : 'bg-white border border-neutral-200 focus:border-blue-500'
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
                setShowTutorial(true);
                setTutorialPage(0);
              }}
              className="w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
              style={{ backgroundColor: theme.accent }}
            >
              始める
            </button>
          </div>
        </div>
      )}

      {/* FAB：取引追加モーダル */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setShowAddTransaction(false)}>
          <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>
            <div className={`sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
              <h2 className={`text-lg font-bold ${theme.text}`}>取引を追加</h2>
              <button onClick={() => setShowAddTransaction(false)} className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>✕</button>
            </div>
            <div className="px-4 pb-8 pt-4">
              <div className="space-y-2">
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>取引を追加</h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  {[
                    { type: 'expense', label: '支出', color: theme.red },
                    { type: 'income', label: '収入', color: theme.green },
                  ].map(({ type, label, color }) => (
                    <button key={type}
                      onClick={() => setNewTransaction({ ...newTransaction, type, paymentMethod: type === 'expense' ? 'credit' : undefined })}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-200`}
                      style={{
                        backgroundColor: newTransaction.type === type ? color : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                        color: newTransaction.type === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        transform: newTransaction.type === type ? 'scale(1.02)' : 'scale(1)',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>

                {newTransaction.type === 'expense' && (
                  <>
                    <div className="flex gap-2">
                      {[
                        { key: 'credit', label: '💳 クレジット' },
                        { key: 'cash', label: '💵 現金' },
                      ].map(({ key, label }) => (
                        <button key={key}
                          onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: key, cardId: key === 'credit' ? (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) : null })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200`}
                          style={{
                            backgroundColor: newTransaction.paymentMethod === key ? theme.accent : (darkMode ? '#262626' : '#f0f0f0'),
                            color: newTransaction.paymentMethod === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {newTransaction.paymentMethod === 'credit' && creditCards.length >= 1 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {creditCards.map(card => (
                          <button key={card.id}
                            onClick={() => setNewTransaction({ ...newTransaction, cardId: card.id })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all`}
                            style={{
                              backgroundColor: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? theme.accent : (darkMode ? '#2a2a2a' : '#f0f0f0'),
                              color: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                            }}>
                            {card.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 金額入力（大きく） */}
                <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-neutral-800/80 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'}`}>
                  <p className={`text-xs font-medium ${theme.textSecondary} mb-1`}>金額</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${theme.textSecondary}`}>¥</span>
                    <input type="text" inputMode="numeric" placeholder="0"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value.replace(/[^0-9]/g, '') })}
                      className={`flex-1 bg-transparent text-2xl font-bold tabular-nums ${theme.text} focus:outline-none placeholder-neutral-500`}
                      style={{ minWidth: 0 }}
                    />
                    {newTransaction.amount && (
                      <button onClick={() => setNewTransaction({...newTransaction, amount: ''})}
                        className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>✕</button>
                    )}
                  </div>
                  {newTransaction.amount && (
                    <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                      {Number(newTransaction.amount).toLocaleString()} 円
                    </p>
                  )}
                </div>
                {/* 日付選択 */}
                <input type="date" value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl appearance-none ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }} />

                <select value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                  <option value="">カテゴリを選択</option>
                  {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <textarea
                  rows={2}
                  placeholder="メモ（任意）"
                  value={newTransaction.memo}
                  onChange={(e) => setNewTransaction({ ...newTransaction, memo: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-200 placeholder-neutral-400'
                  } focus:outline-none focus:border-blue-500`}
                ></textarea>

                {/* 立替あり トグル */}
                {newTransaction.type === 'expense' && (
                  <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                    <button
                      onClick={() => setNewTransaction({
                        ...newTransaction,
                        isSplit: !newTransaction.isSplit,
                        splitMembers: !newTransaction.isSplit ? [{ name: '', amount: '' }] : []
                      })}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all ${
                        newTransaction.isSplit
                          ? (darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                          : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-50 text-neutral-500')
                      }`}
                    >
                      <span>👥 複数人分を立替払い</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${newTransaction.isSplit ? 'bg-blue-500 text-white' : (darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500')}`}>
                        {newTransaction.isSplit ? `${newTransaction.splitMembers.filter(m=>m.name||m.amount).length}人` : 'OFF'}
                      </span>
                    </button>

                    {newTransaction.isSplit && (
                      <div className={`px-3 pb-3 pt-2 space-y-2 ${darkMode ? 'bg-neutral-800/50' : 'bg-blue-50/50'}`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            立替分は回収するまでPLから除外されます。
                          </p>
                          {newTransaction.amount && newTransaction.splitMembers.length > 0 && (
                            <button
                              onClick={() => {
                                const total = Number(newTransaction.amount);
                                const n = newTransaction.splitMembers.length + 1; // 自分も含む
                                const perPerson = Math.floor(total / n);
                                setNewTransaction({
                                  ...newTransaction,
                                  splitMembers: newTransaction.splitMembers.map(m => ({ ...m, amount: String(perPerson) }))
                                });
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}
                            >
                              ÷ 均等割り
                            </button>
                          )}
                        </div>

                        {/* 人ごとの入力行 */}
                        <div className="space-y-1.5">
                          {newTransaction.splitMembers.map((member, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center">
                              <input
                                type="text"
                                placeholder={`${idx+1}人目の名前`}
                                value={member.name}
                                onChange={(e) => {
                                  const updated = [...newTransaction.splitMembers];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setNewTransaction({ ...newTransaction, splitMembers: updated });
                                }}
                                className={`flex-1 px-2.5 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`}
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="金額"
                                value={member.amount}
                                onChange={(e) => {
                                  const updated = [...newTransaction.splitMembers];
                                  updated[idx] = { ...updated[idx], amount: e.target.value.replace(/[^0-9]/g, '') };
                                  setNewTransaction({ ...newTransaction, splitMembers: updated });
                                }}
                                className={`w-24 px-2.5 py-1.5 rounded-lg text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`}
                              />
                              {newTransaction.splitMembers.length > 1 && (
                                <button
                                  onClick={() => setNewTransaction({
                                    ...newTransaction,
                                    splitMembers: newTransaction.splitMembers.filter((_, i) => i !== idx)
                                  })}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-500'}`}
                                >✕</button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 人を追加ボタン */}
                        <button
                          onClick={() => setNewTransaction({
                            ...newTransaction,
                            splitMembers: [...newTransaction.splitMembers, { name: '', amount: '' }]
                          })}
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold border-dashed border-2 transition-all ${darkMode ? 'border-neutral-600 text-neutral-400 hover:border-blue-500 hover:text-blue-400' : 'border-neutral-300 text-neutral-400 hover:border-blue-400 hover:text-blue-500'}`}
                        >
                          ＋ 人を追加
                        </button>

                        {/* 内訳サマリー */}
                        {(() => {
                          const total = Number(newTransaction.amount) || 0;
                          const splitTotal = newTransaction.splitMembers.reduce((s, m) => s + (Number(m.amount) || 0), 0);
                          const mine = total - splitTotal;
                          if (total === 0) return null;
                          return (
                            <div className={`rounded-lg px-3 py-2 text-xs space-y-0.5 ${darkMode ? 'bg-neutral-900/60' : 'bg-white/80'}`}>
                              <div className="flex justify-between">
                                <span className={theme.textSecondary}>合計</span>
                                <span className={`font-bold tabular-nums ${theme.text}`}>¥{total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme.textSecondary}>立替合計（{newTransaction.splitMembers.filter(m=>Number(m.amount)>0).length}人）</span>
                                <span className="font-bold tabular-nums" style={{color: theme.accent}}>¥{splitTotal.toLocaleString()}</span>
                              </div>
                              <div className={`flex justify-between pt-1 border-t ${theme.border}`}>
                                <span className={`font-semibold ${theme.text}`}>自分の負担</span>
                                <span className={`font-bold tabular-nums`} style={{color: mine >= 0 ? theme.green : theme.red}}>¥{mine.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => { addTransaction(); if(newTransaction.amount && newTransaction.category) setShowAddTransaction(false); }}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}>
                  追加する
                </button>
              </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {showCloseMonthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-1`}>月を締める</h2>
            <p className={`text-sm ${theme.textSecondary} mb-4`}>{closingTargetMonth || currentMonth} の集計を確定します</p>
            {(() => {
              const tb = calculateMonthlyBalance(closingTargetMonth || currentMonth);
              return (<>
                <p className={`${theme.textSecondary} mb-2`}>
                  PL（発生ベース）: <span className="font-bold" style={{ color: tb.plBalance >= 0 ? theme.green : theme.red }}>¥{tb.plBalance.toLocaleString()}</span>
                </p>
                <p className={`${theme.textSecondary} mb-4`}>
                  CF（現金ベース）: <span className="font-bold" style={{ color: tb.cfBalance >= 0 ? theme.green : theme.red }}>¥{tb.cfBalance.toLocaleString()}</span>
                </p>
              </>);
            })()}

            {budgetAnalysis.investment.needsWithdrawal && (!closingTargetMonth || closingTargetMonth === currentMonth) && (
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
                  max={Math.max(calculateMonthlyBalance(closingTargetMonth || currentMonth).cfBalance, simulationSettings.monthlyInvestment)}
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
                  max={calculateMonthlyBalance(closingTargetMonth || currentMonth).cfBalance - closeMonthData.investAmount}
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
                onClick={() => { closeMonth(closingTargetMonth); setClosingTargetMonth(null); }}
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
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setEditingTransaction(null)}>
          <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <div className={`sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
              <h2 className={`text-lg font-bold ${theme.text}`}>
                {editingTransaction.isSettlement ? '💳 クレジット引き落とし' : '取引を編集'}
              </h2>
              <button onClick={() => setEditingTransaction(null)} className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>✕</button>
            </div>

            <div className="px-4 pb-8 pt-4">
              {/* 引き落とし予約：読み取り専用 */}
              {editingTransaction.isSettlement ? (
                <div className="space-y-3">
                  <div className={`rounded-2xl p-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-bold ${theme.textSecondary} mb-3 uppercase tracking-wide`}>引き落とし情報</p>
                    <div className="space-y-2.5">
                      {[
                        { label: 'カード', value: creditCards.find(c=>c.id===editingTransaction.cardId)?.name || 'カード' },
                        { label: '引き落とし日', value: editingTransaction.date },
                      ].map(({label, value}) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className={`text-sm ${theme.textSecondary}`}>{label}</span>
                          <span className={`text-sm font-semibold ${theme.text}`}>{value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                        <span className={`text-sm ${theme.textSecondary}`}>金額</span>
                        <span className="text-xl font-black tabular-nums" style={{color:theme.red}}>¥{Math.abs(editingTransaction.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme.textSecondary}`}>状態</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${editingTransaction.settled ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-400'}`}>
                          {editingTransaction.settled ? '✓ 引き落とし済み' : '⏳ 予定'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs text-center leading-relaxed ${theme.textSecondary}`}>
                    引き落とし予約は元の取引から自動生成されます。<br/>金額を変更したい場合は元の取引を編集してください。
                  </p>
                  <button onClick={() => setEditingTransaction(null)} className={`w-full py-3 rounded-2xl font-bold ${darkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'}`}>閉じる</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 支出/収入 切替 */}
                  <div className="flex gap-2">
                    {[{type:'expense',label:'支出',color:theme.red},{type:'income',label:'収入',color:theme.green}].map(({type,label,color}) => (
                      <button key={type}
                        onClick={() => setEditingTransaction({...editingTransaction, type, amount: type==='expense' ? -Math.abs(editingTransaction.amount) : Math.abs(editingTransaction.amount)})}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                        style={{
                          backgroundColor: editingTransaction.type === type ? color : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                          color: editingTransaction.type === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 金額（大きく） */}
                  <div className={`rounded-2xl p-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>金額</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black`} style={{ color: editingTransaction.type === 'income' ? theme.green : theme.red }}>¥</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={Math.abs(editingTransaction.amount) || ''}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          setEditingTransaction({...editingTransaction, amount: editingTransaction.type==='expense' ? -Number(v) : Number(v)});
                        }}
                        placeholder="0"
                        className={`flex-1 text-3xl font-black tabular-nums bg-transparent focus:outline-none`}
                        style={{ color: editingTransaction.type === 'income' ? theme.green : theme.red }}
                      />
                    </div>
                  </div>

                  {/* カテゴリ */}
                  <div>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>カテゴリ</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(editingTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <button key={cat}
                          onClick={() => setEditingTransaction({...editingTransaction, category: cat})}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: editingTransaction.category === cat ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                            color: editingTransaction.category === cat ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 支払方法（支出のみ） */}
                  {editingTransaction.type === 'expense' && !editingTransaction.isRecurring && (
                    <div>
                      <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>支払方法</p>
                      <div className="flex gap-2">
                        {[{key:'credit',label:'💳 クレジット'},{key:'cash',label:'💵 現金'}].map(({key,label}) => (
                          <button key={key}
                            onClick={() => setEditingTransaction({...editingTransaction, paymentMethod: key, cardId: key==='credit' ? (editingTransaction.cardId || (creditCards[0] && creditCards[0].id)) : null})}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{
                              backgroundColor: editingTransaction.paymentMethod === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                              color: editingTransaction.paymentMethod === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {editingTransaction.paymentMethod === 'credit' && creditCards.length >= 1 && (
                        <select
                          value={editingTransaction.cardId || ''}
                          onChange={e => setEditingTransaction({...editingTransaction, cardId: e.target.value})}
                          className={`w-full mt-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'} focus:outline-none`}
                          style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                        >
                          {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {/* 日付 */}
                  <div>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>日付</p>
                    <input
                      type="date"
                      value={editingTransaction.date}
                      onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'} focus:outline-none`}
                      style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                    />
                  </div>

                  {/* メモ */}
                  <div>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>メモ（任意）</p>
                    <input
                      type="text"
                      placeholder="メモを入力..."
                      value={editingTransaction.memo || ''}
                      onChange={e => setEditingTransaction({...editingTransaction, memo: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-600' : 'bg-white border border-neutral-200 placeholder-neutral-400'} focus:outline-none`}
                    />
                  </div>

                  {/* 立替内訳（読み取り） */}
                  {editingTransaction?.isSplit && (
                    <div className={`rounded-2xl p-4 ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                      <p className={`text-xs font-bold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>👥 立替払いの内訳</p>
                      <div className="space-y-2">
                        {(editingTransaction.splitMembers || []).map((m, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${theme.text}`}>{m.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.settled ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-400'}`}>
                                {m.settled ? '精算済' : '未回収'}
                              </span>
                            </div>
                            <span className="text-sm font-bold tabular-nums" style={{ color: m.settled ? theme.green : theme.accent }}>
                              ¥{Number(m.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className={`flex justify-between pt-2 border-t ${theme.border}`}>
                          <span className={`text-xs font-semibold ${theme.text}`}>立替合計</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>¥{(editingTransaction.splitAmount||0).toLocaleString()}</span>
                        </div>
                      </div>
                      {!editingTransaction?.splitSettled && (
                        <p className={`text-xs mt-2 ${theme.textSecondary}`}>⏳ ホームの「立替待ち」から人ごとに精算できます</p>
                      )}
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { deleteTransaction(editingTransaction.id); setEditingTransaction(null); }}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-white shrink-0"
                      style={{ backgroundColor: theme.red }}
                    >🗑️</button>
                    <button
                      onClick={() => updateTransaction(editingTransaction)}
                      className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                      style={{ backgroundColor: theme.accent }}
                    >変更を保存</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB：取引追加ボタン */}
      {activeTab !== 'settings' && (
        <div className="fixed z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)', right: '16px' }}>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="h-12 px-5 rounded-full text-white text-sm font-bold shadow-lg transition-all duration-200 flex items-center gap-2 hover-scale"
            style={{ backgroundColor: theme.accent, boxShadow: `0 4px 20px ${theme.accent}55` }}
          >
            <span className="text-xl font-light leading-none">+</span>
            <span>取引を追加</span>
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 transition-colors duration-300"
        style={{
          backgroundColor: darkMode ? 'rgba(17,17,17,0.94)' : 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
        <div className="max-w-md mx-auto flex">
          {[
            { id: 'home', icon: <DollarSign size={20} />, label: '家計簿' },
            { id: 'assets', icon: <Droplets size={20} />, label: '資産' },
            { id: 'calendar', icon: <Calendar size={20} />, label: '履歴' },
            { id: 'simulation', icon: <TrendingUp size={20} />, label: 'シミュ' },
            { id: 'settings', icon: <Settings size={20} />, label: '設定' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all duration-200 ${
                activeTab === tab.id ? 'scale-110' : 'hover:scale-105'
              }`}
              style={{ color: activeTab === tab.id ? theme.accent : (darkMode ? '#8E8E93' : '#9ca3af') }}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${activeTab === tab.id ? (darkMode ? 'bg-neutral-800' : 'bg-blue-50') : ''}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-semibold`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${theme.text}`}>{editingCard ? 'カードを編集' : 'カードを追加'}</h2>
              <button onClick={() => setShowCardModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>カード名</label>
                <input type="text" placeholder="例: 楽天カード"
                  defaultValue={editingCard ? editingCard.name : ''}
                  id="card-name"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>締め日</label>
                  <select id="card-closing"
                    defaultValue={editingCard ? editingCard.closingDay : 15}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                    {[5,10,15,20,25].map(d => <option key={d} value={d}>{d}日</option>)}<option value={31}>末日</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし月</label>
                  <select id="card-payment-month"
                    defaultValue={editingCard ? editingCard.paymentMonth : 1}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                    <option value={1}>翌月</option>
                    <option value={2}>翌々月</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし日</label>
                <select id="card-payment-day"
                  defaultValue={editingCard ? editingCard.paymentDay : 27}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                  {[1,5,10,15,20,25,27,28].map(d => <option key={d} value={d}>{d}日</option>)}
                </select>
              </div>
              <button
                onClick={() => {
                  const name = document.getElementById('card-name').value.trim();
                  const closingDay = Number(document.getElementById('card-closing').value);
                  const paymentMonth = Number(document.getElementById('card-payment-month').value);
                  const paymentDay = Number(document.getElementById('card-payment-day').value);
                  if (!name) { alert('カード名を入力してください'); return; }
                  if (editingCard) {
                    setCreditCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, name, closingDay, paymentMonth, paymentDay } : c));
                  } else {
                    setCreditCards(prev => [...prev, { id: Date.now(), name, closingDay, paymentMonth, paymentDay }]);
                  }
                  setShowCardModal(false);
                }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.accent }}>
                {editingCard ? '更新する' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}