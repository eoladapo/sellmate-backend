import {
  IProfitService,
  ProfitCalculationInput,
  ProfitResult,
} from '../interfaces';

/**
 * Service for calculating profit metrics
 * Implements profit calculation logic for orders
 */
export class ProfitService implements IProfitService {
  /**
   * Calculate comprehensive profit metrics from input
   * @param input - Profit calculation input containing prices and quantities
   * @returns ProfitResult with all calculated metrics
   */
  calculateProfit(input: ProfitCalculationInput): ProfitResult {
    const { sellingPrice, costPrice, quantity, operationalExpenses = 0 } = input;

    const totalRevenue = sellingPrice * quantity;
    const totalCost = costPrice * quantity;
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - operationalExpenses;
    const profitMargin = this.calculateProfitMargin(sellingPrice, costPrice);

    return {
      grossProfit,
      netProfit,
      profitMargin,
      totalRevenue,
      totalCost,
    };
  }

  /**
   * Calculate profit for a single order
   * @param sellingPrice - Price per unit sold to customer
   * @param costPrice - Cost per unit to acquire/produce
   * @param quantity - Number of units
   * @param operationalExpenses - Additional expenses (shipping, packaging, etc.)
   * @returns ProfitResult with all calculated metrics
   */
  calculateOrderProfit(
    sellingPrice: number,
    costPrice: number,
    quantity: number,
    operationalExpenses: number = 0
  ): ProfitResult {
    return this.calculateProfit({
      sellingPrice,
      costPrice,
      quantity,
      operationalExpenses,
    });
  }

  /**
   * Calculate profit margin as a percentage
   * Formula: ((sellingPrice - costPrice) / sellingPrice) * 100
   * @param sellingPrice - Price per unit sold to customer
   * @param costPrice - Cost per unit to acquire/produce
   * @returns Profit margin percentage (0-100)
   */
  calculateProfitMargin(sellingPrice: number, costPrice: number): number {
    if (sellingPrice <= 0) {
      return 0;
    }
    const margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
    return Math.round(margin * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate net profit after operational expenses
   * @param grossProfit - Profit before expenses
   * @param operationalExpenses - Additional expenses
   * @returns Net profit amount
   */
  calculateNetProfit(grossProfit: number, operationalExpenses: number): number {
    return grossProfit - operationalExpenses;
  }
}
