import React, { useState } from 'react';
import { 
  DollarSign, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  PieChart, 
  Sparkles,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { BudgetBreakdown, ExpenseItem } from '../types';

export const BudgetTracker: React.FC = () => {
  const [totalBudget, setTotalBudget] = useState<number>(6000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'exp-1', category: 'stay', title: 'Homestay Phố Cổ 2 đêm', amount: 1400000, date: 'Hôm qua' },
    { id: 'exp-2', category: 'food', title: 'Bữa trưa Mì Quảng & Cafe trứng', amount: 180000, date: 'Hôm nay' },
    { id: 'exp-3', category: 'transport', title: 'Thuê xe máy 2 ngày + Xăng', amount: 320000, date: 'Hôm nay' },
    { id: 'exp-4', category: 'tickets', title: 'Vé tham quan di tích', amount: 240000, date: 'Hôm nay' }
  ]);

  // Form inputs for new expense
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<'stay' | 'food' | 'transport' | 'tickets' | 'contingency'>('food');

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercent = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);

  // Category sum
  const catSums = {
    stay: expenses.filter(e => e.category === 'stay').reduce((s, e) => s + e.amount, 0),
    food: expenses.filter(e => e.category === 'food').reduce((s, e) => s + e.amount, 0),
    transport: expenses.filter(e => e.category === 'transport').reduce((s, e) => s + e.amount, 0),
    tickets: expenses.filter(e => e.category === 'tickets').reduce((s, e) => s + e.amount, 0),
    contingency: expenses.filter(e => e.category === 'contingency').reduce((s, e) => s + e.amount, 0),
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newAmount);
    if (!newTitle.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      amount: amountNum,
      date: 'Vừa xong'
    };

    setExpenses([newItem, ...expenses]);
    setNewTitle('');
    setNewAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-800 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <Wallet className="w-3.5 h-3.5" />
          <span>Smart Budget Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
          Quản Lý & Cân Đối Ngân Sách Du Lịch
        </h1>
        <p className="text-xs sm:text-sm text-stone-300">
          Theo dõi sát sao từng khoản chi trên chuyến đi, cảnh báo thâm hụt và đối chiếu theo công thức Tỷ Lệ Vàng chuẩn VietGo AI.
        </p>
      </div>

      {/* Top Cards: Total, Spent, Remaining */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-1">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Hạn mức ngân sách</span>
          <div className="text-xl font-black text-stone-900">
            {totalBudget.toLocaleString()} VNĐ
          </div>
          <div className="flex items-center gap-2 pt-1 text-xs text-stone-500">
            <span>Chỉnh hạn mức:</span>
            <select
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="bg-stone-50 border border-stone-200 rounded-md px-1.5 py-0.5 text-xs font-semibold"
            >
              <option value={3000000}>3.000.000đ</option>
              <option value={5000000}>5.000.000đ</option>
              <option value={6000000}>6.000.000đ</option>
              <option value={10000000}>10.000.000đ</option>
              <option value={15000000}>15.000.000đ</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-1">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Đã thực chi</span>
          <div className="text-xl font-black text-amber-600">
            {totalSpent.toLocaleString()} VNĐ
          </div>
          <div className="text-xs text-stone-500">
            Chiếm <strong className="text-amber-700">{spentPercent}%</strong> tổng ngân sách
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-1">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Số dư khả dụng</span>
          <div className={`text-xl font-black ${remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {remainingBudget.toLocaleString()} VNĐ
          </div>
          <div className="text-xs text-stone-500">
            {remainingBudget < 0 ? '⚠️ Bạn đang bị vượt ngân sách' : '✅ Đang trong giới hạn an toàn'}
          </div>
        </div>
      </div>

      {/* Main Breakdown & Add Expense Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Expense Logger Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h2 className="font-extrabold text-base text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Ghi nhanh khoản chi</span>
          </h2>

          <form onSubmit={handleAddExpense} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600">Nội dung chi</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Cà phê trứng, Taxi sân bay, Bún chả..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600">Số tiền (VNĐ)</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="VD: 150000"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600">Danh mục</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden"
              >
                <option value="food">🍲 Ăn uống ẩm thực (25%)</option>
                <option value="stay">🏨 Khách sạn / Homestay (30%)</option>
                <option value="transport">🛵 Di chuyển / Xăng / Vé xe (20%)</option>
                <option value="tickets">🎟️ Vé tham quan / Trải nghiệm (15%)</option>
                <option value="contingency">🎁 Quà tặng & Dự phòng (10%)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              + Lưu khoản chi
            </button>
          </form>

          {/* Golden Ratio Reference Table */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/70 space-y-2 text-xs">
            <span className="font-extrabold text-stone-900">Chuẩn Tỷ Lệ Vàng VietGo:</span>
            <div className="space-y-1.5 text-[11px] text-stone-600">
              <div className="flex justify-between">
                <span>🏨 Lưu trú (30%):</span>
                <strong>{Math.round(totalBudget * 0.3).toLocaleString()}đ</strong>
              </div>
              <div className="flex justify-between">
                <span>🍲 Ăn uống (25%):</span>
                <strong>{Math.round(totalBudget * 0.25).toLocaleString()}đ</strong>
              </div>
              <div className="flex justify-between">
                <span>🛵 Di chuyển (20%):</span>
                <strong>{Math.round(totalBudget * 0.2).toLocaleString()}đ</strong>
              </div>
              <div className="flex justify-between">
                <span>🎟️ Vé & Tour (15%):</span>
                <strong>{Math.round(totalBudget * 0.15).toLocaleString()}đ</strong>
              </div>
              <div className="flex justify-between">
                <span>🎁 Quà & Dự phòng (10%):</span>
                <strong>{Math.round(totalBudget * 0.1).toLocaleString()}đ</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h2 className="font-extrabold text-base text-stone-900 flex items-center justify-between border-b border-stone-100 pb-3">
              <span>Lịch sử chi tiêu thực tế</span>
              <span className="text-xs text-stone-400 font-normal">{expenses.length} giao dịch</span>
            </h2>

            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-stone-100 hover:border-stone-200 hover:bg-stone-50/50 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                      {exp.category === 'stay' ? '🏨' : exp.category === 'food' ? '🍲' : exp.category === 'transport' ? '🛵' : exp.category === 'tickets' ? '🎟️' : '🎁'}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">{exp.title}</div>
                      <div className="text-[10px] text-stone-400">{exp.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-stone-900 text-sm">
                      {exp.amount.toLocaleString()} VNĐ
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-stone-300 hover:text-red-500 rounded-md cursor-pointer transition-colors"
                      title="Xóa khoản này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
