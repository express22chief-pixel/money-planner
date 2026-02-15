import './index.css'
import React, { useState } from 'react';

export default function BudgetSimulator() {
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2026-02-14', category: '食費', amount: -1200 },
    { id: 2, date: '2026-02-10', category: '給料', amount: 250000 },
  ]);

  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('食費');

  const addTransaction = () => {
    if (!newAmount) return;
    
    const transaction = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      category: newCategory,
      amount: Number(newAmount)
    };
    
    setTransactions([transaction, ...transactions]);
    setNewAmount('');
  };

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-white mb-2">マネープランナー</h1>
          <p className="text-indigo-100 text-sm">
            {new Date().toLocaleDateString('ja-JP')}
          </p>
        </div>

        {/* 残高表示 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">現在の残高</p>
            <p className={`text-4xl font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ¥{total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 入力フォーム */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">取引を追加</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                金額
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="食費">食費</option>
                <option value="交通費">交通費</option>
                <option value="娯楽費">娯楽費</option>
                <option value="給料">給料</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <button
              onClick={addTransaction}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90"
            >
              追加
            </button>
          </div>
        </div>

        {/* 取引履歴 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">最近の取引</h2>
          
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{t.category}</p>
                  <p className="text-xs text-gray-500">{t.date}</p>
                </div>
                <p className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
