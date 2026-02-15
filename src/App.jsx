import './index.css'
import React from 'react';

export default function BudgetSimulator() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-indigo-600 mb-4">
            マネープランナー
          </h1>
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-bold text-xl">
              ✅ デプロイ成功！
            </p>
          </div>
          <p className="text-gray-600 text-lg">
            アプリが正常に動作しています
          </p>
          <p className="text-sm text-gray-500 mt-4">
            この画面が見えたらセットアップ完了です
          </p>
        </div>
      </div>
    </div>
  );
}
