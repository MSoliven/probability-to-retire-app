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
  readonly investmentReturnsMean = 0.007;
  readonly investmentReturnsVolatility = 0.015;
  readonly inflationRateVolatility = 0.0005;
  readonly inflationRateMean = 0.0025;

   // Main Monte Carlo simulation function
   performMonteCarloSimulation(
    initialBalance: number,
    contribution: number,
    expenses: number,
    retireAge: number,
    expireAge: number,
    socialSecurityAge: number,
    socialSecurityIncome: number,
    taxRate: number,
  ): MonteCarloResults {

    // indexed by iteration# and then year
    const annualBalances: number[][] = [];

    let retirementDuration = expireAge - retireAge;
    let retirementDurationMonths = retirementDuration * 12;
    let socialSecurityMonths = retirementDurationMonths - (expireAge - socialSecurityAge) * 12;

    for (let i = 0; i < this.numSimulations; i++) {
      // Generate random investment returns and inflation rates for each month
      const investmentReturns = Array.from({ length: retirementDurationMonths }, () =>
        this.randomNormal(this.investmentReturnsMean, this.investmentReturnsVolatility)
      );
      const inflationRates = Array.from({ length: retirementDurationMonths }, () =>
        this.randomNormal(this.inflationRateMean, this.inflationRateVolatility)
      );

      this.performSingleSimulation(
        initialBalance,
        contribution,
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
    contribution: number,
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

      // Adjust contributions and expenses for inflation
      contribution = contribution * (1 + inflationRates[month]);
      retirementExpenses = retirementExpenses * (1 + inflationRates[month]);

      // Apply taxes on investment returns
      const afterTaxReturn = investmentReturns[month] * (1 - taxRate);

      // Update balance for the month
      balance =
        balance * (1 + afterTaxReturn) +
        contribution -
        retirementExpenses;

      // Adjust social security for inflation
      socialSecurityIncome = socialSecurityIncome * (1 + inflationRates[month]);

      // Consider Social Security benefits
      if (month >= socialSecurityMonths) {
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
}
