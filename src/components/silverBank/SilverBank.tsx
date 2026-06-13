import { useState } from 'react';
import { 
  Landmark, Coins, TrendingUp, TrendingDown, 
  CreditCard, DollarSign, AlertTriangle, 
  CheckCircle, Plus, Minus, Car,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { 
  getCreditGradeInfo,
  LOAN_TERM_OPTIONS,
} from '../../utils/silverBank';
import type { Loan, Vehicle } from '../../../shared/types';

const SilverBank = () => {
  const {
    player,
    silverBank,
    borrowGold,
    repayLoan,
    buyVehicleOnCredit,
    getAvailableCredit,
    getTotalDebt,
    getActiveLoans,
    calculateLoanInterest,
    vehicleTemplates,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'borrow' | 'repay' | 'vehicle'>('borrow');
  const [borrowAmount, setBorrowAmount] = useState(100);
  const [borrowTerm, setBorrowTerm] = useState(7);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleTerm, setVehicleTerm] = useState(7);

  const creditInfo = getCreditGradeInfo(silverBank.creditGrade);
  const availableCredit = getAvailableCredit();
  const totalDebt = getTotalDebt();
  const activeLoans = getActiveLoans();

  const interestInfo = calculateLoanInterest(borrowAmount, borrowTerm);

  const handleBorrow = () => {
    const success = borrowGold(borrowAmount, borrowTerm);
    if (success) {
      setBorrowAmount(100);
    }
  };

  const handleRepay = (loanId: string) => {
    repayLoan(loanId);
  };

  const handleBuyVehicle = () => {
    if (selectedVehicle) {
      const success = buyVehicleOnCredit(selectedVehicle, vehicleTerm);
      if (success) {
        setSelectedVehicle(null);
      }
    }
  };

  const getLoanStatusInfo = (loan: Loan) => {
    const isOverdue = loan.status === 'overdue';
    const isPaid = loan.status === 'paid';
    
    if (isPaid) return { label: '已还清', color: 'text-green-600 bg-green-50' };
    if (isOverdue) return { label: '已逾期', color: 'text-red-600 bg-red-50' };
    
    const daysLeft = loan.dueDay - player.currentDay;
    if (daysLeft <= 3) return { label: `还剩${daysLeft}天`, color: 'text-orange-600 bg-orange-50' };
    return { label: `还剩${daysLeft}天`, color: 'text-blue-600 bg-blue-50' };
  };

  const getLoanTypeLabel = (type: string) => {
    return type === 'cash' ? '现金贷款' : '购车贷款';
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">裕丰银号</h2>
          <p className="text-slate-500">管理您的信用、借款和还款</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-semibold text-slate-700">信用概览</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-600">信用评分</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">{silverBank.creditScore}</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-600">信用等级</span>
                  </div>
                  <div className={`text-2xl font-bold ${creditInfo.color}`}>
                    {silverBank.creditGrade}级
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600">可用额度</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {availableCredit.toLocaleString()}
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">未还总额</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">
                    {totalDebt.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${creditInfo.color} bg-white/80`}>
                    {creditInfo.name}
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{creditInfo.description}</p>
                    {silverBank.largeCommissionUnlocked && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      已解锁大额商会委托
                    </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">累计借款</div>
                  <div className="text-lg font-semibold text-slate-700">
                    ¥{silverBank.totalBorrowed.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">累计还款</div>
                  <div className="text-lg font-semibold text-slate-700">
                    ¥{silverBank.totalRepaid.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-500 mb-1">按时还款</div>
                  <div className="text-lg font-semibold text-green-700">
                    {silverBank.onTimeRepayments} 次
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-xs text-red-500 mb-1">逾期还款</div>
                  <div className="text-lg font-semibold text-red-700">
                    {silverBank.lateRepayments} 次
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-semibold text-slate-700 mb-4">当前利率</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">基准利率</span>
                  <span className="font-medium text-slate-700">{silverBank.baseInterestRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">信用优惠</span>
                  <span className="font-medium text-slate-700">
                    {silverBank.creditGrade === '甲' ? '-40%' :
                     silverBank.creditGrade === '乙' ? '-20%' :
                     silverBank.creditGrade === '丙' ? '0%' :
                     silverBank.creditGrade === '丁' ? '+30%' : '+60%'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                  <span className="text-sm text-slate-600">实际利率</span>
                  <span className="font-bold text-amber-600">
                    {(silverBank.baseInterestRate * (
                      silverBank.creditGrade === '甲' ? 0.6 :
                      silverBank.creditGrade === '乙' ? 0.8 :
                      silverBank.creditGrade === '丙' ? 1 :
                      silverBank.creditGrade === '丁' ? 1.3 : 1.6
                    )).toFixed(1)}%
                  </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  按时还款可提升信用，享受更低利率和更高额度</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
              <h3 className="font-semibold text-indigo-800 mb-3">借款期限</h3>
              <div className="space-y-2 text-sm text-indigo-700">
                {LOAN_TERM_OPTIONS.map(term => (
                  <div key={term} className="flex items-center justify-between p-2 bg-white/50 rounded">
                    <span>{term}天</span>
                    <span className="text-xs text-indigo-500">短期周转</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('borrow')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'borrow'
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              借款
            </button>
            <button
              onClick={() => setActiveTab('repay')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'repay'
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              还款
              {activeLoans.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {activeLoans.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'vehicle'
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Car className="w-4 h-4 inline mr-2" />
              赊购车辆
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'borrow' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">现金借款</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        借款金额
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setBorrowAmount(Math.max(100, borrowAmount - 100))}
                          className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(Math.max(100, parseInt(e.target.value) || 100))}
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-center text-xl font-bold text-slate-800"
                        />
                        <button
                          onClick={() => setBorrowAmount(Math.min(availableCredit, borrowAmount + 100))}
                          className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        可用额度: ¥{availableCredit.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        借款期限
                      </label>
                      <div className="flex gap-2">
                        {LOAN_TERM_OPTIONS.map(term => (
                          <button
                            key={term}
                            onClick={() => setBorrowTerm(term)}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              borrowTerm === term
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {term}天
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5">
                    <h4 className="font-semibold text-amber-800 mb-4">借款明细</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-600">借款金额</span>
                        <span className="font-medium text-amber-800">¥{borrowAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-600">利息</span>
                        <span className="font-medium text-amber-800">¥{interestInfo.interest.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-600">日利率</span>
                        <span className="font-medium text-amber-800">{(interestInfo.dailyRate * 100).toFixed(3)}%</span>
                      </div>
                      <div className="pt-3 border-t border-amber-200">
                        <div className="flex justify-between">
                          <span className="text-amber-700 font-medium">到期应还</span>
                          <span className="text-xl font-bold text-amber-800">
                            ¥{interestInfo.totalRepayment.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-amber-600">
                          <span>还款日</span>
                          <span>第 {player.currentDay + borrowTerm} 天</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleBorrow}
                      disabled={borrowAmount > availableCredit || player.gold < 0}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                    >
                      <Coins className="w-5 h-5" />
                      确认借款
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'repay' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">待还贷款</h3>
                {activeLoans.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-500">暂无待还贷款</p>
                    <p className="text-sm text-slate-400">保持良好信用记录，享受更多优惠</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeLoans.map(loan => {
                    const statusInfo = getLoanStatusInfo(loan);
                    return (
                      <div
                        key={loan.id}
                        className={`p-4 rounded-xl border-2 ${
                          loan.status === 'overdue'
                            ? 'border-red-200 bg-red-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                              {loan.type === 'cash' ? (
                                <DollarSign className="w-5 h-5" />
                              ) : (
                                <Car className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {getLoanTypeLabel(loan.type)}
                                {loan.vehicleName && (
                                  <span className="text-sm text-slate-500 ml-2">
                                    - {loan.vehicleName}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                借款 ¥{loan.principal.toLocaleString()} · 利率 {loan.interestRate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-slate-500">待还金额</div>
                            <div className="text-lg font-bold text-slate-800">
                              ¥{loan.remainingAmount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">应还总额</div>
                            <div className="text-sm text-slate-600">
                              ¥{loan.totalRepayment.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">还款日</div>
                            <div className="text-sm text-slate-600">
                              第 {loan.dueDay} 天
                            </div>
                          </div>
                        </div>

                        {loan.status === 'overdue' && (
                          <div className="mb-3 p-3 bg-red-100 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-700">
                              已逾期 {loan.overdueDays} 天，将产生罚息并影响信用
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => handleRepay(loan.id)}
                          disabled={player.gold < loan.remainingAmount}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium rounded-lg hover:from-emerald-400 hover:to-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          立即还款 ¥{loan.remainingAmount.toLocaleString()}
                        </button>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'vehicle' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">赊购车辆</h3>
                <p className="text-sm text-slate-500 mb-6">
                  信用购车，0首付提车，分期还款</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {vehicleTemplates.map(vehicle => {
                    const isSelected = selectedVehicle?.id === vehicle.id;
                    const canAfford = availableCredit >= vehicle.purchaseCost;
                    
                    return (
                      <div
                        key={vehicle.id}
                        onClick={() => canAfford && setSelectedVehicle(vehicle)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50'
                            : canAfford
                              ? 'border-slate-200 hover:border-amber-300'
                              : 'border-slate-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{vehicle.icon}</span>
                          <div>
                            <div className="font-medium text-slate-800">{vehicle.name}</div>
                            <div className="text-xs text-slate-500">{vehicle.description}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-slate-500">载重</span>
                            <span className="text-slate-700 ml-1">{vehicle.capacity}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">速度</span>
                            <span className="text-slate-700 ml-1">{vehicle.speed}km/h</span>
                          </div>
                          <div>
                            <span className="text-slate-500">时耗</span>
                            <span className="text-slate-700 ml-1">¥{vehicle.costPerHour}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">类型</span>
                            <span className="text-slate-700 ml-1">
                              {vehicle.type === 'land' ? '陆路' : '水路'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div>
                            <div className="text-xs text-slate-500">售价</div>
                            <div className="text-lg font-bold text-amber-600">¥{vehicle.purchaseCost.toLocaleString()}</div>
                          </div>
                          {!canAfford && (
                            <span className="text-xs text-red-500">额度不足</span>
                          )}
                          {isSelected && canAfford && (
                            <CheckCircle className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedVehicle && (
                  <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-amber-800">
                        分期方案</h4>
                      <span className="text-sm text-amber-600">
                        已选: {selectedVehicle.name}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      {LOAN_TERM_OPTIONS.map(term => {
                        const interest = calculateLoanInterest(selectedVehicle.purchaseCost, term);
                        return (
                          <button
                            key={term}
                            onClick={() => setVehicleTerm(term)}
                            className={`flex-1 p-3 rounded-lg text-left transition-all ${
                              vehicleTerm === term
                                ? 'bg-white border-2 border-amber-500 shadow-md'
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                          >
                            <div className="font-medium text-slate-700">{term}天</div>
                            <div className="text-xs text-slate-500">
                              总还款 ¥{interest.totalRepayment.toLocaleString()}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleBuyVehicle}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30"
                    >
                      <Car className="w-5 h-5" />
                      确认赊购
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SilverBank;
