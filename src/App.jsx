import './index.css'
import React, { useState, useEffect } from ‘react’;
import { PlusCircle, TrendingUp, Calendar, DollarSign, PieChart, Target } from ‘lucide-react’;

export default function BudgetSimulator() {
const [activeTab, setActiveTab] = useState(‘home’);
const [transactions, setTransactions] = useState([
{ id: 1, date: ‘2026-02-14’, category: ‘食費’, amount: -1200, type: ‘expense’, paymentMethod: ‘credit’, settled: false },
{ id: 2, date: ‘2026-02-13’, category: ‘交通費’, amount: -500, type: ‘expense’, paymentMethod: ‘cash’, settled: true },
{ id: 3, date: ‘2026-02-10’, category: ‘給料’, amount: 250000, type: ‘income’, paymentMethod: ‘cash’, settled: true },
{ id: 4, date: ‘2026-01-25’, category: ‘給料’, amount: 250000, type: ‘income’, paymentMethod: ‘cash’, settled: true },
{ id: 5, date: ‘2026-01-15’, category: ‘食費’, amount: -35000, type: ‘expense’, paymentMethod: ‘credit’, settled: true },
{ id: 6, date: ‘2026-01-10’, category: ‘住居費’, amount: -80000, type: ‘expense’, paymentMethod: ‘cash’, settled: true },
]);
const [newTransaction, setNewTransaction] = useState({
amount: ‘’,
category: ‘’,
type: ‘expense’,
paymentMethod: ‘credit’
});

// クレカ引き落とし日設定
const [creditCardSettings, setCreditCardSettings] = useState({
settlementDay: 26  // 毎月26日に引き落とし
});

// 資産管理データ
const [assetData, setAssetData] = useState({
initialSavings: 500000,      // 初期貯金残高（開始時点）
currentInvestment: 300000,   // 現在の投資残高
monthlyInvestment: 20000,    // 月々の投資額
});

// 月次履歴（貯金への振り分け履歴）
const [monthlyHistory, setMonthlyHistory] = useState({
‘2026-01’: { balance: 135000, savedAmount: 100000, investAmount: 20000 }
});

const [showAssetInput, setShowAssetInput] = useState(false);
const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
const [showMonthCloseModal, setShowMonthCloseModal] = useState(false);
const [showCreditCardModal, setShowCreditCardModal] = useState(false);
const [editingTransaction, setEditingTransaction] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
const [deleteConfirmId, setDeleteConfirmId] = useState(null);
const [showLifeEventModal, setShowLifeEventModal] = useState(false);
const [editingLifeEvent, setEditingLifeEvent] = useState(null);

// ライフイベント
const [lifeEvents, setLifeEvents] = useState([
{ id: 1, name: ‘結婚’, date: ‘2027-06’, amount: 3000000, type: ‘expense’, icon: ‘💍’ },
{ id: 2, name: ‘出産’, date: ‘2028-12’, amount: 500000, type: ‘expense’, icon: ‘👶’ },
]);

const lifeEventTemplates = [
{ name: ‘結婚’, estimatedAmount: 3000000, icon: ‘💍’, type: ‘expense’ },
{ name: ‘出産’, estimatedAmount: 500000, icon: ‘👶’, type: ‘expense’ },
{ name: ‘住宅購入’, estimatedAmount: 10000000, icon: ‘🏠’, type: ‘expense’ },
{ name: ‘車購入’, estimatedAmount: 3000000, icon: ‘🚗’, type: ‘expense’ },
{ name: ‘子供の進学（小学校）’, estimatedAmount: 500000, icon: ‘🎒’, type: ‘expense’ },
{ name: ‘子供の進学（中学校）’, estimatedAmount: 500000, icon: ‘📚’, type: ‘expense’ },
{ name: ‘子供の進学（高校）’, estimatedAmount: 1000000, icon: ‘🎓’, type: ‘expense’ },
{ name: ‘子供の進学（大学）’, estimatedAmount: 4000000, icon: ‘🎓’, type: ‘expense’ },
{ name: ‘海外旅行’, estimatedAmount: 500000, icon: ‘✈️’, type: ‘expense’ },
{ name: ‘退職’, estimatedAmount: 0, icon: ‘🎉’, type: ‘milestone’ },
{ name: ‘カスタム’, estimatedAmount: 0, icon: ‘📌’, type: ‘expense’ },
];

// シミュレーション設定（家計簿データから自動取得）
const [simSettings, setSimSettings] = useState({
monthlyIncome: 250000,
monthlyExpense: 180000,
investmentReturn: 3,
targetAmount: 10000000,
targetYears: 10
});

// 家計簿の資産データをシミュレーションで使用
const getSimulationData = () => ({
currentSavings: calculateAccumulatedSavings(),
currentInvestment: assetData.currentInvestment,
monthlySavings: calculateAverageMonthlySavings(),
monthlyInvestment: assetData.monthlyInvestment,
totalCurrent: calculateAccumulatedSavings() + assetData.currentInvestment,
totalMonthly: calculateAverageMonthlySavings() + assetData.monthlyInvestment,
});

const categories = {
expense: [‘食費’, ‘交通費’, ‘住居費’, ‘光熱費’, ‘通信費’, ‘娯楽費’, ‘その他’],
income: [‘給料’, ‘ボーナス’, ‘副業’, ‘その他’]
};

const addTransaction = () => {
if (!newTransaction.amount || !newTransaction.category) return;

```
const transaction = {
  id: Date.now(),
  date: new Date().toISOString().split('T')[0],
  category: newTransaction.category,
  amount: newTransaction.type === 'expense' ? -Math.abs(parseFloat(newTransaction.amount)) : Math.abs(parseFloat(newTransaction.amount)),
  type: newTransaction.type,
  paymentMethod: newTransaction.type === 'expense' ? newTransaction.paymentMethod : 'cash',
  settled: newTransaction.type === 'expense' && newTransaction.paymentMethod === 'credit' ? false : true
};

setTransactions([transaction, ...transactions]);
setNewTransaction({ amount: '', category: '', type: 'expense', paymentMethod: 'credit' });
```

};

// 取引を編集
const updateTransaction = (updatedTransaction) => {
setTransactions(transactions.map(t =>
t.id === updatedTransaction.id ? updatedTransaction : t
));
setShowEditModal(false);
setEditingTransaction(null);
};

// 取引を削除
const deleteTransaction = (id) => {
setTransactions(transactions.filter(t => t.id !== id));
setShowEditModal(false);
setEditingTransaction(null);
setDeleteConfirmId(null);
};

// 取引編集を開始
const startEditTransaction = (transaction) => {
setEditingTransaction({
…transaction,
displayAmount: Math.abs(transaction.amount).toString()
});
setShowEditModal(true);
};

// ライフイベントを追加
const addLifeEvent = (event) => {
const newEvent = {
id: Date.now(),
…event
};
setLifeEvents([…lifeEvents, newEvent]);
setShowLifeEventModal(false);
setEditingLifeEvent(null);
};

// ライフイベントを編集
const updateLifeEvent = (updatedEvent) => {
setLifeEvents(lifeEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e));
setShowLifeEventModal(false);
setEditingLifeEvent(null);
};

// ライフイベントを削除
const deleteLifeEvent = (id) => {
setLifeEvents(lifeEvents.filter(e => e.id !== id));
setShowLifeEventModal(false);
setEditingLifeEvent(null);
};

// ライフイベント編集を開始
const startEditLifeEvent = (event) => {
setEditingLifeEvent({…event});
setShowLifeEventModal(true);
};

// クレカ利用額計算（未決済分）
const calculateCreditCardBalance = (targetMonth = null) => {
const month = targetMonth || new Date().toISOString().slice(0, 7);
return transactions
.filter(t => t.date.startsWith(month) && t.paymentMethod === ‘credit’ && !t.settled && t.amount < 0)
.reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

// 指定月のクレカ引き落とし予定額計算（前月のクレカ利用分）
const calculateCreditCardSettlement = (targetMonth) => {
const date = new Date(targetMonth + ‘-01’);
date.setMonth(date.getMonth() - 1);
const prevMonth = date.toISOString().slice(0, 7);
return calculateCreditCardBalance(prevMonth);
};

// クレカを決済する
const settleCreditCard = (month) => {
const date = new Date(month + ‘-01’);
date.setMonth(date.getMonth() - 1);
const prevMonth = date.toISOString().slice(0, 7);

```
// 前月のクレカ取引を決済済みにする
setTransactions(transactions.map(t => {
  if (t.date.startsWith(prevMonth) && t.paymentMethod === 'credit' && !t.settled) {
    return { ...t, settled: true };
  }
  return t;
}));

// 決済日に引き落とし取引を追加
const settlementAmount = calculateCreditCardBalance(prevMonth);
if (settlementAmount > 0) {
  const settlementTransaction = {
    id: Date.now(),
    date: `${month}-${String(creditCardSettings.settlementDay).padStart(2, '0')}`,
    category: 'クレカ引き落とし',
    amount: -settlementAmount,
    type: 'expense',
    paymentMethod: 'cash',
    settled: true,
    isSettlement: true
  };
  setTransactions([settlementTransaction, ...transactions]);
}

setShowCreditCardModal(false);
```

};

// 月次収支計算（実際のCF：決済済み取引のみ）
const calculateMonthlyBalance = (targetMonth = null) => {
const month = targetMonth || new Date().toISOString().slice(0, 7);
const monthTransactions = transactions.filter(t => t.date.startsWith(month) && t.settled);
const income = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
const expense = Math.abs(monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
return { income, expense, balance: income - expense };
};

// 累積貯金額計算（初期貯金 + 各月の貯金振り分け額）
const calculateAccumulatedSavings = () => {
let total = assetData.initialSavings;
Object.values(monthlyHistory).forEach(month => {
total += month.savedAmount || 0;
});

```
// 今月の収支がプラスなら仮に反映
const currentMonth = new Date().toISOString().slice(0, 7);
if (!monthlyHistory[currentMonth]) {
  const currentBalance = calculateMonthlyBalance(currentMonth).balance;
  if (currentBalance > 0) {
    // 仮の貯金額として表示（投資額を引いた残り）
    total += Math.max(0, currentBalance - assetData.monthlyInvestment);
  }
}

return total;
```

};

// カテゴリ別支出計算
const calculateCategoryExpenses = (targetMonth = null) => {
const month = targetMonth || new Date().toISOString().slice(0, 7);
const expenses = transactions
.filter(t => t.date.startsWith(month) && t.type === ‘expense’ && t.settled)
.reduce((acc, t) => {
const category = t.category;
acc[category] = (acc[category] || 0) + Math.abs(t.amount);
return acc;
}, {});

```
return Object.entries(expenses)
  .sort((a, b) => b[1] - a[1])
  .map(([category, amount]) => ({ category, amount }));
```

};

// 前月比較計算
const calculateMonthlyComparison = () => {
const currentMonth = new Date().toISOString().slice(0, 7);
const date = new Date(currentMonth + ‘-01’);
date.setMonth(date.getMonth() - 1);
const prevMonth = date.toISOString().slice(0, 7);

```
const current = calculateMonthlyBalance(currentMonth);
const previous = calculateMonthlyBalance(prevMonth);

return {
  income: {
    current: current.income,
    previous: previous.income,
    diff: current.income - previous.income,
    diffPercent: previous.income > 0 ? ((current.income - previous.income) / previous.income * 100) : 0
  },
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
```

};

// カレンダー用：指定月の日数を取得
const getDaysInMonth = (yearMonth) => {
const [year, month] = yearMonth.split(’-’).map(Number);
return new Date(year, month, 0).getDate();
};

// カレンダー用：月初の曜日を取得（0=日曜）
const getFirstDayOfMonth = (yearMonth) => {
const [year, month] = yearMonth.split(’-’).map(Number);
return new Date(year, month - 1, 1).getDay();
};

// カレンダー用：指定日の取引を取得
const getTransactionsForDay = (yearMonth, day) => {
const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
return transactions.filter(t => t.date === dateStr);
};

// カレンダー用：指定日の収支を計算
const getDayBalance = (yearMonth, day) => {
const dayTransactions = getTransactionsForDay(yearMonth, day);
const income = dayTransactions.filter(t => t.amount > 0 && t.settled).reduce((sum, t) => sum + t.amount, 0);
const expense = Math.abs(dayTransactions.filter(t => t.amount < 0 && t.settled).reduce((sum, t) => sum + t.amount, 0));
return { income, expense, balance: income - expense };
};

// 月次平均貯金額計算
const calculateAverageMonthlySavings = () => {
const months = Object.values(monthlyHistory);
if (months.length === 0) return 0;
const total = months.reduce((sum, m) => sum + (m.savedAmount || 0), 0);
return Math.round(total / months.length);
};

// 月を締める処理
const closeMonth = (month, savedAmount) => {
setMonthlyHistory({
…monthlyHistory,
[month]: {
balance: calculateMonthlyBalance(month).balance,
savedAmount: savedAmount,
investAmount: assetData.monthlyInvestment
}
});
setShowMonthCloseModal(false);
};

// 将来シミュレーション計算
const calculateFutureValue = () => {
const simData = getSimulationData();
const years = simSettings.targetYears;
const monthlySavings = simData.totalMonthly;
const annualReturn = simSettings.investmentReturn / 100;
const monthlyReturn = annualReturn / 12;

```
let futureValue = simData.totalCurrent;
const yearlyData = [{ year: 0, value: futureValue, savings: futureValue, investment: 0, events: [] }];

for (let year = 1; year <= years; year++) {
  const savingsContribution = monthlySavings * 12;
  futureValue = (futureValue + savingsContribution) * (1 + annualReturn);
  
  // ライフイベントの影響を計算
  const currentYear = new Date().getFullYear() + year;
  const yearEvents = lifeEvents.filter(e => {
    const eventYear = parseInt(e.date.split('-')[0]);
    return eventYear === currentYear && e.type === 'expense';
  });
  
  const eventCosts = yearEvents.reduce((sum, e) => sum + e.amount, 0);
  futureValue -= eventCosts;
  
  const totalSavings = simData.totalCurrent + (savingsContribution * year);
  const investmentGain = futureValue - totalSavings + eventCosts;
  
  yearlyData.push({
    year,
    value: Math.round(futureValue),
    savings: Math.round(totalSavings),
    investment: Math.round(investmentGain),
    events: yearEvents
  });
}

return yearlyData;
```

};

const monthlyBalance = calculateMonthlyBalance();
const currentMonth = new Date().toISOString().slice(0, 7);
const isMonthClosed = !!monthlyHistory[currentMonth];
const futureData = calculateFutureValue();
const finalValue = futureData[futureData.length - 1].value;
const targetAchieved = finalValue >= simSettings.targetAmount;

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
{/* ヘッダー */}
<div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
<div className="max-w-md mx-auto px-6 py-6">
<h1 className="text-2xl font-bold text-white mb-1">マネープランナー</h1>
<p className="text-sm text-indigo-100">
{new Date().toLocaleDateString(‘ja-JP’, { year: ‘numeric’, month: ‘long’, day: ‘numeric’ })}
</p>
</div>
</div>

```
  {/* メインコンテンツ */}
  <div className="max-w-md mx-auto p-4 pb-20">
    {activeTab === 'home' && (
      <div className="space-y-4">
        {/* 今月のサマリー */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-indigo-600" />
            今月の収支（実際のCF）
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-xs text-gray-600 mb-1">収入</div>
              <div className="text-lg font-bold text-green-600">
                ¥{monthlyBalance.income.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <div className="text-xs text-gray-600 mb-1">支出</div>
              <div className="text-lg font-bold text-red-600">
                ¥{monthlyBalance.expense.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="text-xs text-gray-600 mb-1">残高</div>
              <div className={`text-lg font-bold ${monthlyBalance.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ¥{monthlyBalance.balance.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* クレカ未払い残高 */}
          {calculateCreditCardBalance() > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mt-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-orange-600 font-medium mb-1">今月のクレカ利用額（未決済）</div>
                  <div className="text-xl font-bold text-orange-700 mb-1">
                    ¥{calculateCreditCardBalance().toLocaleString()}
                  </div>
                  <div className="text-xs text-orange-600">
                    翌月{creditCardSettings.settlementDay}日に引き落とし予定
                  </div>
                </div>
                <button
                  onClick={() => setShowCreditCardModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm"
                >
                  決済する
                </button>
              </div>
            </div>
          )}
        </div>

        {/* カテゴリ別支出（円グラフ） */}
        {calculateCategoryExpenses().length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PieChart size={20} className="text-indigo-600" />
              今月の支出内訳
            </h2>
            
            {/* 円グラフ（SVG） */}
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
                        className="hover:opacity-100 transition-opacity"
                      />
                    );
                  });
                })()}
                <circle cx="100" cy="100" r="50" fill="white" />
              </svg>
            </div>

            {/* 凡例 */}
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
        {(() => {
          const comparison = calculateMonthlyComparison();
          return comparison.expense.previous > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                先月との比較
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">支出</div>
                    <div className="text-lg font-bold text-gray-900">
                      ¥{comparison.expense.current.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${comparison.expense.diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {comparison.expense.diff > 0 ? '+' : ''}¥{comparison.expense.diff.toLocaleString()}
                    </div>
                    <div className={`text-xs ${comparison.expense.diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {comparison.expense.diffPercent > 0 ? '+' : ''}{comparison.expense.diffPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">残高</div>
                    <div className="text-lg font-bold text-gray-900">
                      ¥{comparison.balance.current.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${comparison.balance.diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.balance.diff > 0 ? '+' : ''}¥{comparison.balance.diff.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* クイック入力 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PlusCircle size={20} className="text-indigo-600" />
            収支を記録
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  newTransaction.type === 'expense' 
                    ? 'bg-red-500 text-white shadow-md scale-105' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                支出
              </button>
              <button
                onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  newTransaction.type === 'income' 
                    ? 'bg-green-500 text-white shadow-md scale-105' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                収入
              </button>
            </div>
            
            {newTransaction.type === 'expense' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setNewTransaction({...newTransaction, paymentMethod: 'credit'})}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all text-sm ${
                    newTransaction.paymentMethod === 'credit' 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  💳 クレカ
                </button>
                <button
                  onClick={() => setNewTransaction({...newTransaction, paymentMethod: 'cash'})}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all text-sm ${
                    newTransaction.paymentMethod === 'cash' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  💵 現金
                </button>
              </div>
            )}
            
            <input
              type="text"
              inputMode="numeric"
              placeholder="金額を入力"
              value={newTransaction.amount}
              onChange={(e) => {
                const value = e.target.value;
                // 数字のみを許可（空文字も許可）
                if (value === '' || /^\d+$/.test(value)) {
                  setNewTransaction({...newTransaction, amount: value});
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            />
            
            <select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">カテゴリを選択</option>
              {categories[newTransaction.type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <button
              onClick={addTransaction}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              記録する
            </button>
          </div>
        </div>

        {/* 最近の取引 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600" />
            最近の取引
          </h2>
          <div className="space-y-1">
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="group relative">
                <button
                  onClick={() => startEditTransaction(transaction)}
                  className="w-full flex items-center justify-between py-4 px-3 rounded-xl hover:bg-indigo-50 transition-all text-left border border-transparent hover:border-indigo-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                        {transaction.category}
                      </span>
                      {transaction.type === 'expense' && (
                        <span className="text-base">
                          {transaction.paymentMethod === 'credit' ? '💳' : '💵'}
                        </span>
                      )}
                      {transaction.type === 'expense' && transaction.paymentMethod === 'credit' && !transaction.settled && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">未決済</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{transaction.date}</div>
                  </div>
                  <div className={`font-bold text-lg ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}¥{transaction.amount.toLocaleString()}
                  </div>
                </button>
                {deleteConfirmId === transaction.id ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 bg-white rounded-lg shadow-lg p-1">
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                    >
                      戻る
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(transaction.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-red-100 text-red-600 w-8 h-8 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                まだ取引がありません
              </div>
            )}
          </div>
        </div>

        {/* クレカ決済モーダル */}
        {showCreditCardModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">クレカ決済</h3>
              <div className="space-y-3 mb-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">今月のクレカ利用額</div>
                  <div className="text-2xl font-bold text-orange-700 mb-2">
                    ¥{calculateCreditCardBalance().toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date().getFullYear()}年{new Date().getMonth() + 2}月{creditCardSettings.settlementDay}日に引き落とし
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                クレカを決済しますか？現金での引き落とし取引が追加され、CFに反映されます。
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreditCardModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    settleCreditCard(nextMonth.toISOString().slice(0, 7));
                  }}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  決済する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 取引編集モーダル */}
        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">取引を編集</h3>
              
              <div className="space-y-3">
                {/* 収支タイプ */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTransaction({
                      ...editingTransaction, 
                      type: 'expense',
                      amount: -Math.abs(editingTransaction.amount)
                    })}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      editingTransaction.type === 'expense' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    支出
                  </button>
                  <button
                    onClick={() => setEditingTransaction({
                      ...editingTransaction, 
                      type: 'income',
                      amount: Math.abs(editingTransaction.amount)
                    })}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      editingTransaction.type === 'income' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    収入
                  </button>
                </div>

                {/* 支払い方法 */}
                {editingTransaction.type === 'expense' && !editingTransaction.isSettlement && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTransaction({...editingTransaction, paymentMethod: 'credit', settled: false})}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${
                        editingTransaction.paymentMethod === 'credit' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      💳 クレカ
                    </button>
                    <button
                      onClick={() => setEditingTransaction({...editingTransaction, paymentMethod: 'cash', settled: true})}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${
                        editingTransaction.paymentMethod === 'cash' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      💵 現金
                    </button>
                  </div>
                )}

                {/* 金額 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingTransaction.displayAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        const numValue = value === '' ? 0 : parseFloat(value);
                        setEditingTransaction({
                          ...editingTransaction,
                          displayAmount: value,
                          amount: editingTransaction.type === 'expense' ? -Math.abs(numValue) : Math.abs(numValue)
                        });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* カテゴリ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={editingTransaction.category}
                    onChange={(e) => setEditingTransaction({...editingTransaction, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories[editingTransaction.type].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 日付 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                  <input
                    type="date"
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    style={{ 
                      colorScheme: 'light'
                    }}
                  />
                </div>
              </div>

              {/* ボタン */}
              <div className="grid grid-cols-4 gap-3 mt-6">
                <button
                  onClick={() => deleteTransaction(editingTransaction.id)}
                  className="col-span-1 px-3 py-3 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors text-xl flex items-center justify-center"
                  title="削除"
                >
                  🗑️
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                  }}
                  className="col-span-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors text-lg flex items-center justify-center"
                >
                  ✕
                </button>
                <button
                  onClick={() => updateTransaction(editingTransaction)}
                  className="col-span-2 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 資産管理 */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={24} />
              資産管理
            </h2>
            <button
              onClick={() => setShowAssetInput(!showAssetInput)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              {showAssetInput ? '閉じる' : '編集'}
            </button>
          </div>

          {!showAssetInput ? (
            <div className="space-y-5">
              {/* 現在の資産 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-sm opacity-90 mb-2">現在の総資産</div>
                <div className="text-4xl font-bold mb-3">
                  ¥{(calculateAccumulatedSavings() + assetData.currentInvestment).toLocaleString()}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex-1 bg-white/10 rounded-lg p-2">
                    <div className="opacity-80 mb-1">貯金</div>
                    <div className="font-bold text-lg">¥{calculateAccumulatedSavings().toLocaleString()}</div>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-lg p-2">
                    <div className="opacity-80 mb-1">投資</div>
                    <div className="font-bold text-lg">¥{assetData.currentInvestment.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* 今月の収支と振り分け */}
              {!isMonthClosed && monthlyBalance.balance > 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                  <div className="text-sm opacity-90 mb-2">今月の収支</div>
                  <div className="text-2xl font-bold mb-3">
                    +¥{monthlyBalance.balance.toLocaleString()}
                  </div>
                  <button
                    onClick={() => setShowMonthCloseModal(true)}
                    className="w-full bg-white text-indigo-700 py-3 rounded-lg font-bold hover:bg-white/90 transition-all shadow-md"
                  >
                    月を締めて貯金に振り分ける
                  </button>
                </div>
              )}

              {isMonthClosed && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                  <div className="text-sm opacity-90">✓ 今月は締め済みです</div>
                </div>
              )}

              {/* 月々の平均積立 */}
              <div className="pt-4 border-t border-white/20">
                <div className="text-sm opacity-90 mb-2">月々の平均積立額</div>
                <div className="text-3xl font-bold mb-3">
                  ¥{(calculateAverageMonthlySavings() + assetData.monthlyInvestment).toLocaleString()}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex-1">
                    <div className="opacity-80 mb-1">貯金</div>
                    <div className="font-semibold">¥{calculateAverageMonthlySavings().toLocaleString()}</div>
                  </div>
                  <div className="flex-1">
                    <div className="opacity-80 mb-1">投資</div>
                    <div className="font-semibold">¥{assetData.monthlyInvestment.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('simulation')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4 border border-white/30"
              >
                将来シミュレーションを見る
                <TrendingUp size={20} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm opacity-90 mb-2 font-medium">初期貯金残高</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.initialSavings}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setAssetData({...assetData, initialSavings: value === '' ? 0 : parseFloat(value)});
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm opacity-90 mb-2 font-medium">現在の投資残高</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.currentInvestment}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setAssetData({...assetData, currentInvestment: value === '' ? 0 : parseFloat(value)});
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm opacity-90 mb-2 font-medium">月々の投資額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.monthlyInvestment}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setAssetData({...assetData, monthlyInvestment: value === '' ? 0 : parseFloat(value)});
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 font-medium"
                />
              </div>

              <div className="text-xs opacity-75 bg-white/10 rounded-lg p-3 mt-2">
                ※貯金額は月締め時に自動計算されます
              </div>

              <button
                onClick={() => setShowAssetInput(false)}
                className="w-full bg-white text-indigo-700 py-3 rounded-xl font-bold hover:bg-white/90 transition-colors mt-3 shadow-md"
              >
                保存
              </button>
            </div>
          )}
        </div>

        {/* 月締めモーダル */}
        {showMonthCloseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">月の収支を締める</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">今月の収支:</span>
                  <span className="font-bold text-green-600">+¥{monthlyBalance.balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">投資へ:</span>
                  <span className="font-bold text-purple-600">¥{assetData.monthlyInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">貯金へ:</span>
                  <span className="font-bold text-blue-600">
                    ¥{Math.max(0, monthlyBalance.balance - assetData.monthlyInvestment).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                この金額で月を締めますか？貯金額がシミュレーションに反映されます。
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMonthCloseModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => closeMonth(currentMonth, Math.max(0, monthlyBalance.balance - assetData.monthlyInvestment))}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {activeTab === 'simulation' && (
      <div className="space-y-4">
        {/* 家計簿データ連携表示 */}
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-indigo-700 mb-2">
            <TrendingUp size={20} />
            <span className="font-bold">家計簿データと連携中</span>
          </div>
          <div className="text-sm text-indigo-600">
            <div className="grid grid-cols-2 gap-2">
              <div>現在の総資産: <span className="font-bold">¥{getSimulationData().totalCurrent.toLocaleString()}</span></div>
              <div>月々の積立: <span className="font-bold">¥{getSimulationData().totalMonthly.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        {/* ライフイベント */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              ライフイベント
            </h2>
            <button
              onClick={() => {
                setEditingLifeEvent(null);
                setShowLifeEventModal(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <PlusCircle size={16} />
              追加
            </button>
          </div>

          {lifeEvents.length > 0 ? (
            <div className="space-y-2">
              {lifeEvents
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(event => (
                  <button
                    key={event.id}
                    onClick={() => startEditLifeEvent(event)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 transition-all border border-gray-200 hover:border-indigo-300 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{event.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-800">{event.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.date + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">¥{event.amount.toLocaleString()}</div>
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6">
              ライフイベントを追加して将来計画を立てましょう
            </div>
          )}
        </div>

        {/* 目標設定 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target size={24} className="text-indigo-600" />
            将来シミュレーション設定
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium text-gray-700">資産データ（家計簿から取得）</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">現在の貯金</div>
                  <div className="font-bold text-blue-600">¥{calculateAccumulatedSavings().toLocaleString()}</div>
                  <div className="text-xs text-gray-400">初期 + 月次積立</div>
                </div>
                <div>
                  <div className="text-gray-500">現在の投資</div>
                  <div className="font-bold text-purple-600">¥{assetData.currentInvestment.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">月平均貯金</div>
                  <div className="font-bold text-blue-600">¥{calculateAverageMonthlySavings().toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{Object.keys(monthlyHistory).length}ヶ月の平均</div>
                </div>
                <div>
                  <div className="text-gray-500">月々の投資</div>
                  <div className="font-bold text-purple-600">¥{assetData.monthlyInvestment.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className="w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
              >
                家計簿で資産データを編集
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                想定利回り（年率%）
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={simSettings.investmentReturn}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setSimSettings({...simSettings, investmentReturn: value === '' ? 0 : parseFloat(value) || 0});
                  }
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                参考: つみたてNISA(全世界株式)の平均リターンは約5-7%
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標期間（年）
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={simSettings.targetYears}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setSimSettings({...simSettings, targetYears: value === '' ? 1 : parseFloat(value) || 1});
                  }
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標金額
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={simSettings.targetAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setSimSettings({...simSettings, targetAmount: value === '' ? 0 : parseFloat(value) || 0});
                  }
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* シミュレーション結果 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {simSettings.targetYears}年後の予測
          </h2>
          
          <div className={`text-center p-6 rounded-xl mb-6 ${targetAchieved ? 'bg-green-50' : 'bg-orange-50'}`}>
            <div className="text-sm text-gray-600 mb-2">予想資産額</div>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              ¥{finalValue.toLocaleString()}
            </div>
            {targetAchieved ? (
              <div className="text-green-600 font-medium">✓ 目標達成可能です！</div>
            ) : (
              <div className="text-orange-600 font-medium">
                目標まであと¥{(simSettings.targetAmount - finalValue).toLocaleString()}
              </div>
            )}
          </div>

          {/* 簡易グラフ */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">年次推移</h3>
            {futureData.filter((_, i) => i % Math.max(1, Math.floor(futureData.length / 6)) === 0 || i === futureData.length - 1).map(data => (
              <div key={data.year} className="space-y-1">
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{data.year}年後</span>
                    {data.events && data.events.length > 0 && (
                      <div className="flex gap-1">
                        {data.events.map((event, idx) => (
                          <span key={idx} className="text-base" title={`${event.name}: ¥${event.amount.toLocaleString()}`}>
                            {event.icon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-indigo-600">¥{data.value.toLocaleString()}</span>
                </div>
                {data.events && data.events.length > 0 && (
                  <div className="text-xs text-orange-600 pl-16">
                    -{data.events.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}円のイベント
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{width: `${Math.min(100, (data.value / simSettings.targetAmount) * 100)}%`}}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 内訳 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">積立総額</div>
                <div className="text-lg font-bold text-blue-600">
                  ¥{futureData[futureData.length - 1].savings.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">運用益</div>
                <div className="text-lg font-bold text-purple-600">
                  ¥{futureData[futureData.length - 1].investment.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* アドバイス */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-md p-6 text-white">
          <h3 className="font-bold mb-2">💡 アドバイス</h3>
          <p className="text-sm opacity-90 mb-3">
            {targetAchieved 
              ? `このペースを維持すれば、${simSettings.targetYears}年後に目標達成できます。定期的に見直しを行い、計画を調整しましょう。`
              : `目標達成には、月々の積立額を${Math.ceil((simSettings.targetAmount - finalValue) / (simSettings.targetYears * 12) + getSimulationData().totalMonthly).toLocaleString()}円に増やす、または運用期間を延ばすことを検討してください。`
            }
          </p>
          <div className="text-xs opacity-75 pt-3 border-t border-white/20">
            現在の資産配分: 貯金 {Math.round((calculateAccumulatedSavings() / (calculateAccumulatedSavings() + assetData.currentInvestment)) * 100)}% / 投資 {Math.round((assetData.currentInvestment / (calculateAccumulatedSavings() + assetData.currentInvestment)) * 100)}%
          </div>
        </div>

        {/* ライフイベント追加・編集モーダル */}
        {showLifeEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingLifeEvent ? 'ライフイベントを編集' : 'ライフイベントを追加'}
              </h3>

              <div className="space-y-4">
                {!editingLifeEvent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">テンプレートから選択</label>
                    <div className="grid grid-cols-2 gap-2">
                      {lifeEventTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => setEditingLifeEvent({
                            name: template.name,
                            amount: template.estimatedAmount,
                            icon: template.icon,
                            type: template.type,
                            date: new Date().toISOString().slice(0, 7)
                          })}
                          className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                        >
                          <div className="text-2xl mb-1">{template.icon}</div>
                          <div className="text-xs font-medium text-gray-700">{template.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editingLifeEvent && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">イベント名</label>
                      <input
                        type="text"
                        value={editingLifeEvent.name}
                        onChange={(e) => setEditingLifeEvent({...editingLifeEvent, name: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="例: 結婚式"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">アイコン</label>
                      <div className="grid grid-cols-8 gap-2">
                        {['💍', '👶', '🏠', '🚗', '🎒', '📚', '🎓', '✈️', '🎉', '💰', '🎂', '📌'].map(icon => (
                          <button
                            key={icon}
                            onClick={() => setEditingLifeEvent({...editingLifeEvent, icon})}
                            className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                              editingLifeEvent.icon === icon 
                                ? 'border-indigo-500 bg-indigo-50' 
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">予定時期</label>
                      <input
                        type="month"
                        value={editingLifeEvent.date}
                        onChange={(e) => setEditingLifeEvent({...editingLifeEvent, date: e.target.value})}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">予想費用（円）</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editingLifeEvent.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            setEditingLifeEvent({...editingLifeEvent, amount: value === '' ? 0 : parseFloat(value)});
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="例: 3000000"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      {editingLifeEvent.id && (
                        <button
                          onClick={() => deleteLifeEvent(editingLifeEvent.id)}
                          className="px-4 py-3 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors"
                        >
                          削除
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowLifeEventModal(false);
                          setEditingLifeEvent(null);
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => {
                          if (editingLifeEvent.id) {
                            updateLifeEvent(editingLifeEvent);
                          } else {
                            addLifeEvent(editingLifeEvent);
                          }
                        }}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                      >
                        {editingLifeEvent.id ? '保存' : '追加'}
                      </button>
                    </div>
                  </>
                )}

                {!editingLifeEvent && (
                  <button
                    onClick={() => {
                      setShowLifeEventModal(false);
                    }}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    閉じる
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {activeTab === 'calendar' && (
      <div className="space-y-4">
        {/* 月選択 */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const date = new Date(selectedMonth + '-01');
                date.setMonth(date.getMonth() - 1);
                setSelectedMonth(date.toISOString().slice(0, 7));
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ▶
            </button>
          </div>

          {/* カレンダーグリッド */}
          <div className="mb-4">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <div key={day} className={`text-center text-xs font-bold py-2 ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダー日付 */}
            <div className="grid grid-cols-7 gap-1">
              {/* 空白セル */}
              {[...Array(getFirstDayOfMonth(selectedMonth))].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              
              {/* 日付セル */}
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

          {/* 月次サマリー */}
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

            {monthlyHistory[selectedMonth] && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <div className="text-xs text-gray-600 mb-2">資産への振り分け</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-gray-500">貯金へ</div>
                    <div className="font-bold text-blue-600">¥{monthlyHistory[selectedMonth].savedAmount.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-gray-500">投資へ</div>
                    <div className="font-bold text-purple-600">¥{monthlyHistory[selectedMonth].investAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 取引履歴 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-md font-bold text-gray-800 mb-4">取引履歴</h3>
          <div className="space-y-1">
            {transactions
              .filter(t => t.date.startsWith(selectedMonth))
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(transaction => (
                <div key={transaction.id} className="group relative">
                  <button
                    onClick={() => startEditTransaction(transaction)}
                    className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-indigo-50 transition-all text-left border border-transparent hover:border-indigo-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                          {transaction.category}
                        </span>
                        {transaction.type === 'expense' && (
                          <span className="text-base">
                            {transaction.paymentMethod === 'credit' ? '💳' : '💵'}
                          </span>
                        )}
                        {transaction.isSettlement && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">引落</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}¥{transaction.amount.toLocaleString()}
                    </div>
                  </button>
                  {deleteConfirmId === transaction.id ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 bg-white rounded-lg shadow-lg p-1 z-10">
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
                      >
                        削除
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                      >
                        戻る
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(transaction.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-red-100 text-red-600 w-8 h-8 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center z-10"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            {transactions.filter(t => t.date.startsWith(selectedMonth)).length === 0 && (
              <div className="text-center text-gray-400 py-8">
                この月の取引はありません
              </div>
            )}
          </div>
        </div>

        {/* 月次推移グラフ */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-md font-bold text-gray-800 mb-4">月次推移</h3>
          <div className="space-y-3">
            {Object.entries(monthlyHistory)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([month, data]) => (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(month + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex gap-3">
                      <span className="text-blue-600">貯金: ¥{data.savedAmount.toLocaleString()}</span>
                      <span className="text-purple-600">投資: ¥{data.investAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-blue-500 h-2"
                      style={{width: `${(data.savedAmount / (data.savedAmount + data.investAmount)) * 100}%`}}
                    />
                    <div 
                      className="bg-purple-500 h-2"
                      style={{width: `${(data.investAmount / (data.savedAmount + data.investAmount)) * 100}%`}}
                    />
                  </div>
                </div>
              ))}
            {Object.keys(monthlyHistory).length === 0 && (
              <div className="text-center text-gray-400 py-8">
                まだ月次データがありません
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>

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
```

);
}
