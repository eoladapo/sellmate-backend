export interface ProfitCalculationInput {
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  operationalExpenses?: number;
}

export interface ProfitResult {
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  totalRevenue: number;
  totalCost: number;
}

export interface OrderProfitSummary {
  orderId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface IProfitService {
  calculateProfit(input: ProfitCalculationInput): ProfitResult;
  calculateOrderProfit(
    sellingPrice: number,
    costPrice: number,
    quantity: number,
    operationalExpenses?: number
  ): ProfitResult;
  calculateProfitMargin(sellingPrice: number, costPrice: number): number;
  calculateNetProfit(grossProfit: number, operationalExpenses: number): number;
}
