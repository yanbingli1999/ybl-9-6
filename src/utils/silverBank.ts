import type {
  SilverBank,
  Loan,
  CreditGrade,
  LoanType,
  LoanStatus,
  Vehicle,
  PlayerVehicle,
} from '../../shared/types';
import { generateId } from './gameLogic';

export const calculateCreditGrade = (score: number): {
  grade: CreditGrade;
  interestRateModifier: number;
  maxLoanMultiplier: number;
  unlocksLargeCommission: boolean;
} => {
  if (score >= 900) {
    return {
      grade: '甲',
      interestRateModifier: 0.6,
      maxLoanMultiplier: 3,
      unlocksLargeCommission: true,
    };
  } else if (score >= 750) {
    return {
      grade: '乙',
      interestRateModifier: 0.8,
      maxLoanMultiplier: 2,
      unlocksLargeCommission: false,
    };
  } else if (score >= 550) {
    return {
      grade: '丙',
      interestRateModifier: 1,
      maxLoanMultiplier: 1,
      unlocksLargeCommission: false,
    };
  } else if (score >= 350) {
    return {
      grade: '丁',
      interestRateModifier: 1.3,
      maxLoanMultiplier: 0.5,
      unlocksLargeCommission: false,
    };
  } else {
    return {
      grade: '戊',
      interestRateModifier: 1.6,
      maxLoanMultiplier: 0.2,
      unlocksLargeCommission: false,
    };
  }
};

export const BASE_INTEREST_RATE = 5;
export const BASE_MAX_LOAN = 1000;
export const LOAN_TERM_OPTIONS = [7, 14, 30];

export const calculateInterest = (
  principal: number,
  termDays: number,
  baseRate: number,
  creditModifier: number
): { interest: number; totalRepayment: number; dailyRate: number } => {
  const annualRate = baseRate * creditModifier;
  const dailyRate = annualRate / 100 / 30;
  const interest = Math.floor(principal * dailyRate * termDays);
  const totalRepayment = principal + interest;
  return { interest, totalRepayment, dailyRate };
};

export const createInitialSilverBank = (): SilverBank => {
  const creditInfo = calculateCreditGrade(600);
  return {
    creditScore: 600,
    creditGrade: creditInfo.grade,
    maxLoanAmount: Math.floor(BASE_MAX_LOAN * creditInfo.maxLoanMultiplier),
    baseInterestRate: BASE_INTEREST_RATE,
    loans: [],
    totalBorrowed: 0,
    totalRepaid: 0,
    onTimeRepayments: 0,
    lateRepayments: 0,
    largeCommissionUnlocked: creditInfo.unlocksLargeCommission,
  };
};

export const createLoan = (
  type: LoanType,
  principal: number,
  termDays: number,
  currentDay: number,
  silverBank: SilverBank,
  vehicle?: Vehicle
): { loan: Loan; silverBank: SilverBank } => {
  const creditInfo = calculateCreditGrade(silverBank.creditScore);
  const { totalRepayment } = calculateInterest(
    principal,
    termDays,
    silverBank.baseInterestRate,
    creditInfo.interestRateModifier
  );

  const loan: Loan = {
    id: generateId(),
    type,
    principal,
    interestRate: silverBank.baseInterestRate * creditInfo.interestRateModifier,
    termDays,
    totalRepayment,
    remainingAmount: totalRepayment,
    dueDay: currentDay + termDays,
    status: 'active',
    createdAt: Date.now(),
    overdueDays: 0,
  };

  if (type === 'vehicle' && vehicle) {
    loan.vehicleId = vehicle.id;
    loan.vehicleName = vehicle.name;
  }

  const newLoans = [...silverBank.loans, loan];
  const newSilverBank = {
    ...silverBank,
    loans: newLoans,
    totalBorrowed: silverBank.totalBorrowed + principal,
  };

  return { loan, silverBank: newSilverBank };
};

export const getActiveLoans = (silverBank: SilverBank): Loan[] => {
  return silverBank.loans.filter(l => l.status === 'active' || l.status === 'overdue');
};

export const getTotalDebt = (silverBank: SilverBank, currentDay?: number): number => {
  const activeLoans = getActiveLoans(silverBank);
  if (currentDay === undefined) {
    return activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
  }
  return activeLoans.reduce((sum, loan) => {
    const debtInfo = calculateLoanCurrentDebt(loan, currentDay);
    return sum + debtInfo.currentDebt;
  }, 0);
};

export const getAvailableCredit = (silverBank: SilverBank): number => {
  const totalDebt = getTotalDebt(silverBank);
  return Math.max(0, silverBank.maxLoanAmount - totalDebt);
};

export const canBorrow = (
  silverBank: SilverBank,
  amount: number
): { canBorrow: boolean; reason?: string } => {
  const available = getAvailableCredit(silverBank);
  if (amount > available) {
    return {
      canBorrow: false,
      reason: `可用信用额度不足，当前可用: ${available} 金币`,
    };
  }
  if (amount <= 0) {
    return { canBorrow: false, reason: '借款金额必须大于零' };
  }
  return { canBorrow: true };
};

export const calculateLoanCurrentDebt = (
  loan: Loan,
  currentDay: number
): { currentDebt: number; totalPenalty: number; overdueDays: number; isOverdue: boolean } => {
  if (loan.status === 'paid') {
    return { currentDebt: 0, totalPenalty: 0, overdueDays: 0, isOverdue: false };
  }

  const isOverdue = currentDay > loan.dueDay;
  if (!isOverdue) {
    return {
      currentDebt: loan.remainingAmount,
      totalPenalty: 0,
      overdueDays: 0,
      isOverdue: false,
    };
  }

  const overdueDays = currentDay - loan.dueDay;
  const penaltyRate = 0.01;
  const dailyPenalty = Math.floor(loan.totalRepayment * penaltyRate);
  const totalPenalty = dailyPenalty * overdueDays;
  const currentDebt = loan.totalRepayment + totalPenalty;

  return { currentDebt, totalPenalty, overdueDays, isOverdue };
};

export const repayLoan = (
  loanId: string,
  silverBank: SilverBank,
  currentDay: number,
  paymentAmount?: number
): {
  silverBank: SilverBank;
  repaidAmount: number;
  isFullyRepaid: boolean;
  wasOnTime: boolean;
  reputationChange: number;
  creditChange: number;
  totalPenalty: number;
} => {
  const loan = silverBank.loans.find(l => l.id === loanId);
  if (!loan) {
    return {
      silverBank,
      repaidAmount: 0,
      isFullyRepaid: false,
      wasOnTime: false,
      reputationChange: 0,
      creditChange: 0,
      totalPenalty: 0,
    };
  }

  const { currentDebt, totalPenalty, overdueDays, isOverdue } = calculateLoanCurrentDebt(
    loan,
    currentDay
  );

  const amountToPay = paymentAmount || currentDebt;
  const actualPayment = Math.min(amountToPay, currentDebt);
  const isFullyRepaid = actualPayment >= currentDebt;
  const wasOnTime = !isOverdue && isFullyRepaid;

  const newLoans = silverBank.loans.map(l => {
    if (l.id !== loanId) return l;
    return {
      ...l,
      remainingAmount: Math.max(0, currentDebt - actualPayment),
      status: (isFullyRepaid ? 'paid' : (isOverdue ? 'overdue' : 'active')) as LoanStatus,
      overdueDays: isOverdue ? overdueDays : 0,
      paidAt: isFullyRepaid ? Date.now() : undefined,
    };
  });

  let creditChange = 0;
  let reputationChange = 0;

  if (isFullyRepaid) {
    if (wasOnTime) {
      creditChange = 30;
      reputationChange = 10;
    } else {
      creditChange = 10;
      reputationChange = -5;
    }
  }

  const newCreditScore = Math.max(0, Math.min(1000, silverBank.creditScore + creditChange));
  const creditInfo = calculateCreditGrade(newCreditScore);

  const newSilverBank: SilverBank = {
    ...silverBank,
    loans: newLoans,
    creditScore: newCreditScore,
    creditGrade: creditInfo.grade,
    maxLoanAmount: Math.floor(BASE_MAX_LOAN * creditInfo.maxLoanMultiplier),
    totalRepaid: silverBank.totalRepaid + actualPayment,
    onTimeRepayments: silverBank.onTimeRepayments + (wasOnTime ? 1 : 0),
    lateRepayments: silverBank.lateRepayments + (isOverdue && isFullyRepaid ? 1 : 0),
    largeCommissionUnlocked: creditInfo.unlocksLargeCommission,
  };

  return {
    silverBank: newSilverBank,
    repaidAmount: actualPayment,
    isFullyRepaid,
    wasOnTime,
    reputationChange,
    creditChange,
    totalPenalty,
  };
};

export const updateLoanOverdueStatus = (
  silverBank: SilverBank,
  currentDay: number
): {
  silverBank: SilverBank;
  newlyOverdue: Loan[];
  reputationChange: number;
  creditChange: number;
  totalPenalty: number;
} => {
  let reputationChange = 0;
  let creditChange = 0;
  let totalPenalty = 0;
  const newlyOverdue: Loan[] = [];
  const penaltyRate = 0.01;
  const dailyReputationPenalty = 5;
  const dailyCreditPenalty = 10;

  const newLoans = silverBank.loans.map(loan => {
    if (loan.status === 'paid') return loan;

    const isOverdue = currentDay > loan.dueDay;
    if (!isOverdue) return loan;

    const overdueDays = currentDay - loan.dueDay;
    const previousOverdueDays = loan.overdueDays;
    const newOverdueDays = overdueDays - previousOverdueDays;

    if (previousOverdueDays === 0) {
      newlyOverdue.push(loan);
      reputationChange -= 20;
      creditChange -= 50;
    }

    if (newOverdueDays > 0) {
      const dailyPenalty = Math.floor(loan.remainingAmount * penaltyRate);
      const periodPenalty = dailyPenalty * newOverdueDays;
      totalPenalty += periodPenalty;

      reputationChange -= dailyReputationPenalty * newOverdueDays;
      creditChange -= dailyCreditPenalty * newOverdueDays;

      return {
        ...loan,
        remainingAmount: loan.remainingAmount + periodPenalty,
        status: 'overdue' as const,
        overdueDays,
      };
    }

    return {
      ...loan,
      status: 'overdue' as const,
      overdueDays,
    };
  });

  const newCreditScore = Math.max(0, Math.min(1000, silverBank.creditScore + creditChange));
  const creditInfo = calculateCreditGrade(newCreditScore);

  const newSilverBank: SilverBank = {
    ...silverBank,
    loans: newLoans,
    creditScore: newCreditScore,
    creditGrade: creditInfo.grade,
    maxLoanAmount: Math.floor(BASE_MAX_LOAN * creditInfo.maxLoanMultiplier),
    largeCommissionUnlocked: creditInfo.unlocksLargeCommission,
  };

  return { silverBank: newSilverBank, newlyOverdue, reputationChange, creditChange, totalPenalty };
};

export const purchaseVehicleOnCredit = (
  vehicle: Vehicle,
  termDays: number,
  currentDay: number,
  silverBank: SilverBank
): {
  success: boolean;
  loan?: Loan;
  silverBank?: SilverBank;
  playerVehicle?: PlayerVehicle;
  reason?: string;
} => {
  const principal = vehicle.purchaseCost;

  const borrowCheck = canBorrow(silverBank, principal);
  if (!borrowCheck.canBorrow) {
    return { success: false, reason: borrowCheck.reason };
  }

  const { loan, silverBank: newSilverBank } = createLoan(
    'vehicle',
    principal,
    termDays,
    currentDay,
    silverBank,
    vehicle
  );

  const playerVehicle: PlayerVehicle = {
    id: generateId(),
    vehicleId: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    capacity: vehicle.capacity,
    speed: vehicle.speed,
    costPerHour: vehicle.costPerHour,
    icon: vehicle.icon,
    isAvailable: true,
  };

  return {
    success: true,
    loan,
    silverBank: newSilverBank,
    playerVehicle,
  };
};

export const getCreditGradeInfo = (grade: CreditGrade): {
  name: string;
  color: string;
  description: string;
} => {
  const info: Record<CreditGrade, { name: string; color: string; description: string }> = {
    '甲': {
      name: '甲级信用',
      color: 'text-amber-500',
      description: '信誉卓著，可享最低利率和最高额度',
    },
    '乙': {
      name: '乙级信用',
      color: 'text-emerald-500',
      description: '信誉良好，利率优惠',
    },
    '丙': {
      name: '丙级信用',
      color: 'text-blue-500',
      description: '普通信用，标准利率',
    },
    '丁': {
      name: '丁级信用',
      color: 'text-orange-500',
      description: '信用一般，利率较高',
    },
    '戊': {
      name: '戊级信用',
      color: 'text-red-500',
      description: '信用较差，高利率低额度',
    },
  };
  return info[grade];
};
