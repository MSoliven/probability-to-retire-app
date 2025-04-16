import { Injectable } from '@angular/core';
import * as math from "mathjs";

export class MonteCarloResults {
  medianResults: number[];
  tenthPercentileResults: number[];
  medianEndingBalance: number;
  tenthEndingBalance: number;
  probabilityOfSuccess: number;
  earliestBrokeYear: number;

  constructor(medianResults: number[], tenthPercentileResults: number[], 
    medianEndingBalance: number, tenthEndingBalance: number,
    probabilityOfSuccess: number, earliestBrokeYear: number) {
    this.medianResults = medianResults;
    this.tenthPercentileResults = tenthPercentileResults;
    this.medianEndingBalance = medianEndingBalance;
    this.tenthEndingBalance = tenthEndingBalance;
    this.probabilityOfSuccess = probabilityOfSuccess;
    this.earliestBrokeYear = earliestBrokeYear
  }
}

@Injectable({
  providedIn: 'root'
})
export class MonteCarloService {

  constructor() { }

  // READ-ONLY parameters for the simulation
  readonly numSimulations = 1000;
  readonly investmentReturnsMean = 0.00685;
  readonly investmentReturnsVolatility = 0.02675;
  readonly inflationRateVolatility = 0.0005;
  readonly inflationRateMean = 0.0025;  

  // Main Monte Carlo simulation function
  performMonteCarloSimulation(
    initialBalance: number,
    monthlyContribution: number,
    isMonthlyContributionAdusted: boolean,
    monthlyContributionAge: number,
    expenses: number,
    retireAge: number,
    expireAge: number,
    socialSecurityAge: number,
    socialSecurityIncome: number,
    stocksPercentage: number,
    bondsPercentage: number,
    taxRate: number,
  ): MonteCarloResults {

    // indexed by iteration# and then year
    const annualBalances: number[][] = [];

    let retirementDuration = expireAge - retireAge;
    let retirementDurationMonths = retirementDuration * 12;
    let socialSecurityMonths = -1;
    if (expireAge > socialSecurityAge) {
      socialSecurityMonths = retirementDurationMonths - (expireAge - socialSecurityAge) * 12;
      if (socialSecurityMonths < 0) 
        socialSecurityMonths = 0;
    }

    let monthlyContributionMonths = -1;
    if (expireAge > monthlyContributionAge) {
      monthlyContributionMonths = retirementDurationMonths - (expireAge - monthlyContributionAge) * 12;
      if (monthlyContributionMonths < 0) 
        monthlyContributionMonths = 0;
    }

    let riskProfile = this.getPortfolioMeanAndStdDev(stocksPercentage, bondsPercentage);

    for (let i = 0; i < this.numSimulations; i++) {
      // Generate random investment returns and inflation rates for each month
      const investmentReturns = Array.from({ length: retirementDurationMonths }, () =>
        this.randomNormal(riskProfile.monthlyMean, riskProfile.monthlyStdDev)
      );
      const inflationRates = Array.from({ length: retirementDurationMonths }, () =>
        this.randomNormal(this.inflationRateMean, this.inflationRateVolatility)
      );

      this.performSingleSimulation(
        initialBalance,
        monthlyContribution,
        isMonthlyContributionAdusted,
        monthlyContributionMonths,
        expenses,
        retirementDuration,
        investmentReturns,
        inflationRates,
        socialSecurityMonths,
        socialSecurityIncome,
        taxRate,
        annualBalances[i] = []
      );
    }

    const medianBalances: number[] = [];
    const tenthPercentileBalances: number[] = [];
    const yearEndBalances: number[] = [];

    let earliestBrokeYear = retirementDuration;

    // For each year, calculate median and 10th percentile
    for (let y = 0; y <= retirementDuration; y++) {
      const yearBalances: number[] = [];
      for (let i = 0; i < this.numSimulations; i++) {
        if (y < earliestBrokeYear && annualBalances[i][y] < 0) {
          earliestBrokeYear = y;
        }
        yearBalances.push(annualBalances[i][y]);
        if (y == (retirementDuration - 1)) {
          yearEndBalances.push(annualBalances[i][y]);
        }
      }

      medianBalances[y] = math.median(yearBalances);
      tenthPercentileBalances[y] = math.quantileSeq(yearBalances, 0.1);
    }

    const probabilitySuccess = yearEndBalances.filter((result) => result >= 0).length / 
      this.numSimulations;

    return new MonteCarloResults(
      medianBalances,
      tenthPercentileBalances,
      medianBalances[retirementDuration], 
      tenthPercentileBalances[retirementDuration],
      probabilitySuccess,
      earliestBrokeYear
    );
  }

  private performSingleSimulation(
    initialBalance: number,
    monthlyContribution: number,
    isMonthlyContributionAdusted: boolean,
    monthlyContributionMonths: number,
    retirementExpenses: number,
    retirementDuration: number,
    investmentReturns: number[],
    inflationRates: number[],
    socialSecurityMonths: number,
    socialSecurityIncome: number,
    taxRate: number,
    annualBalances: number[]
  ): void {
    const numMonths = retirementDuration * 12;
    let balance = initialBalance;
    let year = 0;
  
    for (let month = 0; month < numMonths; month++) {

      // Adjust expenses for inflation
      retirementExpenses = retirementExpenses * (1 + inflationRates[month]);

      // Apply taxes on investment returns
      const afterTaxReturn = investmentReturns[month] * (1 - taxRate);
;
      if (monthlyContributionMonths >= 0 && month >= monthlyContributionMonths)  {
        // Adjust monthlyContribution for inflation
        monthlyContribution = monthlyContribution * (isMonthlyContributionAdusted ? (1 + inflationRates[month]) : 1);

        // Update balance for the month
        balance = balance * (1 + afterTaxReturn) + monthlyContribution - retirementExpenses;
      }
      else {
         // Update balance for the month
         balance = balance * (1 + afterTaxReturn) - retirementExpenses;
      }

      // Adjust social security for inflation
      socialSecurityIncome = socialSecurityIncome * (1 + inflationRates[month]);

      // Consider Social Security benefits
      if (socialSecurityMonths >= 0 && month >= socialSecurityMonths) {
        balance += socialSecurityIncome;
      }

      if (month % 12 === 0) {
        // get yearly balance
        annualBalances.push(balance);
      }
    }
    annualBalances.push(balance);
  }

  // Standard Normal variate using Box-Muller transform.
  private randomNormal(mean=0, stdev=1): number {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
  }

  private getPortfolioMeanAndStdDev(stocksWeight: number, bondsWeight: number) {
    let yearlyMean: number;
    let yearlyStdDev: number;
  
    // Assign realistic yearly values based on ranges in 0.05 increments
    if (stocksWeight > 95) {
      yearlyMean = 0.12; // Higher return for extremely stock-heavy portfolios
      yearlyStdDev = 0.22; // Higher volatility for high stock allocations
    } else if (stocksWeight > 75) {
      yearlyMean = 0.10;
      yearlyStdDev = 0.18;
    } else if (stocksWeight > 55) {
      yearlyMean = 0.08;
      yearlyStdDev = 0.13;
    } else if (stocksWeight > 35) {
      yearlyMean = 0.06;
      yearlyStdDev = 0.10;
    } else if (stocksWeight > 15) {
      yearlyMean = 0.04;
      yearlyStdDev = 0.07;
    } else {
      yearlyMean = 0.03; // Lower return for bond-heavy portfolios
      yearlyStdDev = 0.05; // Lower volatility for high bond allocations
    }
  
    // Convert yearly values to monthly values
    const monthlyMean = yearlyMean / 12;
    const monthlyStdDev = yearlyStdDev / Math.sqrt(12);
  
    return {
      stocksWeight,
      bondsWeight,
      yearlyMean,
      yearlyStdDev,
      monthlyMean,
      monthlyStdDev,
    };
  }
  
}
