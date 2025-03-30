import { Component, Inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormatUtil } from '../../formatutil';
import { BaseComponent } from 'src/app/base/base.component';
import { MonteCarloService, MonteCarloResults } from 'src/app/services/monte-carlo.service';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-probability-to-retire',
  templateUrl: './probability-to-retire.component.html',
  styleUrls: ['./probability-to-retire.component.scss']
})
export class ProbabilityToRetireComponent extends BaseComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @ViewChild('template1', { static: true }) template1!: TemplateRef<any>;
  @ViewChild('template2', { static: true }) template2!: TemplateRef<any>;
  @ViewChild('template3', { static: true }) template3!: TemplateRef<any>;

  inputForm: any = {};
  tabData = [
    { label: 'Main', template: this.template1 },
    { label: 'Other income', template: this.template2 },
    { label: 'Portfolio', template: this.template3 }
  ];

  public lineChartOptions(minY: number, maxX: number): ChartConfiguration['options'] {
    return {
      responsive: true,
      // We use these empty structures as placeholders for dynamic theming.
      scales: {
          x: {
            max: maxX,
            stacked: true,
            ticks: {
              autoSkip: true,  // Enable autoskip
              maxTicksLimit: 10, // Optional: Limit the maximum number of labels
            }
          },
          y: {
            min: minY
          }
        },
        plugins: {
          legend: {
            display: true,
          },
          datalabels: {
            // anchor: 'end',
            // align: 'end',
            display: false
          }
        },
      maintainAspectRatio: false
      };
  }

  public lineChartType: ChartType = 'line';
  
  public chartPlugins = [
    DataLabelsPlugin
  ];

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Growth' }
    ]
  };

  public tableDataRows: any[] = [];
  
  public periodLabel: string = "Age";
  public periodContribLabel: string = "Monthly";

  public viewMode:string = "";
  public minY: number = 0;
  public maxY: number = 30000000;
  public maxX: number = 150;

  public probabilityOfSuccess: number = -1;
  public lifeSpan: number = -1;
  public brokeAge: number = -1;

  constructor(public override router: Router, 
    public override route: ActivatedRoute, 
    private fb: FormBuilder,
    private monteCarloService: MonteCarloService) { 
    super(router, route);
  }

  override ngOnInit(): void {

    this.tabData[0].template = this.template1;
    this.tabData[1].template = this.template2;
    this.tabData[2].template = this.template3;
    
    this.route.queryParams
      .subscribe(params => {
        let initial = params["initial"] as string;
        let contrib = params["contrib"] as string;
        let contribAdj = params["contribAdj"] as string;
        let contribAge = params["contribAge"] as string;
        let expenses = params["expenses"] as string;
        let retireAge = params["retireAge"] as string;
        let expireAge = params["expireAge"] as string;
        let ssAge = params["ssAge"] as string;
        let ssIncome = params["ssIncome"] as string; 
        let stocks = params["stocks"] as string;
        let bonds = params["bonds"] as string; 
        let tax = params["tax"] as string; 
        let view = params["view"] as string;
        
        this.onInitForm(initial, contrib, contribAdj, contribAge, expenses, retireAge, expireAge, 
          ssAge, ssIncome, stocks, bonds, tax, view);
        this.onChange(true);
      }
    );

  }

  onInitForm(initial: string, contrib: string, contribAdj: string, contribAge: string, expenses: string, retireAge: string, expireAge: string, 
    ssAge: string, ssIncome: string, stocks: string, bonds: string, tax: string, view: string) {

    const getValue = (val: string, def: any) => {
      if (!val) return def;
      return val;
    };

    if (view) {
      switch(view.toLowerCase()) {
        case "readonly":
          this.readOnly = true;
          this.compact = true;
          break;
        case "readonlychart":
          this.readOnly = true;
          this.compact = true;
          break;
        case "compact":
          this.readOnly = false;
          this.compact = true;
          break;
        case "compactchart":
          this.readOnly = false;
          this.compact = true;
          break;
        default: 
          this.readOnly = false;
      }
      this.viewMode = view;
    }

    this.inputForm = this.fb.group({
      initialPrincipal: [getValue(initial, "$1,000,000"), Validators.required],
      monthlyContribution: [getValue(contrib, "$0")],
      isMonthlyContributionAdj: [getValue(contribAdj, false)],
      monthlyContributionAge: [getValue(contribAge, "62")],
      monthlyExpenses: [getValue(expenses, "$4,000")],
      retireAge: [getValue(retireAge, "62")],
      expireAge: [getValue(expireAge, "92")],
      socialSecurityAge: [getValue(ssAge, "67")],
      socialSecurityIncome: [getValue(ssIncome, "$0")],
      stocksPercentage: [getValue(stocks, "75")],
      bondsPercentage: [getValue(bonds, "25")],
      taxRate: [getValue(tax, ".15")],
      viewMode: [getValue(view, "")]
    });

    this.inputForm.get('isMonthlyContributionAdj')?.disable();
    // Watch for changes in 'monthlyContribution' and enable/disable the checkbox dynamically
    this.inputForm.get('monthlyContribution')?.valueChanges.subscribe((value: string) => {
      if (value === "$0") {
        this.inputForm.get('isMonthlyContributionAdj')?.disable(); // Disable checkbox if input is 0
      } else {
        this.inputForm.get('isMonthlyContributionAdj')?.enable(); // Enable checkbox if input is not 0
      }
    });

    let isUpdating = false; // Flag to prevent circular updates

    this.inputForm.get('stocksPercentage')?.valueChanges.subscribe((value: string) => {
      if (!isUpdating) {
        isUpdating = true;
        this.inputForm.get('bondsPercentage')?.setValue((100-FormatUtil.parseToNumber(value)).toFixed(0));
        isUpdating = false;
      }
    });

    this.inputForm.get('bondsPercentage')?.valueChanges.subscribe((value: string) => {
      if (!isUpdating) {
        isUpdating = true;
        this.inputForm.get('stocksPercentage')?.setValue((100-FormatUtil.parseToNumber(value)).toFixed(0));
        isUpdating = false;
      }
    });

  }

  onChange(init?: boolean) {
    // TODO: Use EventEmitter with form value
    console.warn(this.inputForm.value);
    let input = this.inputForm.value;

    if (!init && input.viewMode) {
      this.onInitForm(input.initialPrincipal, input.monthlyContribution, input.isMonthlyContributionAdj, input.monthlyContributionAge,
        input.monthlyExpenses, input.retireAge, input.expireAge, input.socialSecurityAge, input.socialSecurityIncome, 
        input.stocksPercentage, input.bondsPercentage, input.taxRate, input.viewMode);
      input = this.inputForm.value;
    }
    
    let principal = FormatUtil.parseToNumber(input.initialPrincipal);
    let monthlyContribution = FormatUtil.parseToNumber(input.monthlyContribution);
    let isMonthlyContributionAdj = input.isMonthlyContributionAdj;
    let monthlyContributionAge = FormatUtil.parseToNumber(input.monthlyContributionAge);
    let expenses = FormatUtil.parseToNumber(input.monthlyExpenses);
    let retireAge = FormatUtil.parseToNumber(input.retireAge);
    let expireAge = FormatUtil.parseToNumber(input.expireAge);
    let ssAge = FormatUtil.parseToNumber(input.socialSecurityAge);
    let ssIncome = FormatUtil.parseToNumber(input.socialSecurityIncome);
    let stocksPercentage = FormatUtil.parseToNumber(input.stocksPercentage);
    let bondsPercentage = FormatUtil.parseToNumber(input.bondsPercentage);    
    let taxRate = FormatUtil.parseToNumber(input.taxRate);

    this.lifeSpan = expireAge;

    this.lineChartData.labels 
      = this.calcLabels(parseInt(input.retireAge), parseInt(input.expireAge));  
  
    this.lineChartData.datasets 
      = this.calcResultsets(principal, monthlyContribution, isMonthlyContributionAdj, monthlyContributionAge, expenses, retireAge, expireAge, 
        ssAge, ssIncome, stocksPercentage, bondsPercentage, taxRate, input.viewMode);

    this.chart?.update();
  }

  calcLabels(retireAge: number, expireAge: number) : string[] {

    if (retireAge > expireAge) {
      throw new Error('retireAge must be less than or equal to expireAge');
    }
    
    let labels: string[] = [];

    for (let i=retireAge; i <= expireAge; i++) {
      labels.push(this.periodLabel + " " + i);
    }

    return labels;
  }

  calcResultsets(principal: number, monthlyContribution: number, isMonthlyContributionAgeAdj: boolean, monthlyContributionAge: number, expenses: number, 
    retireAge: number, expireAge: number, ssAge: number, 
    ssIncome: number, stocksPercentage: number, bondsPercentage: number,
    taxRate: number, viewmode?: string): any {
  
      let results: MonteCarloResults = this.monteCarloService.performMonteCarloSimulation(
          principal, monthlyContribution, isMonthlyContributionAgeAdj, monthlyContributionAge, expenses, retireAge, expireAge, ssAge, ssIncome, 
          stocksPercentage, bondsPercentage, taxRate);

      this.probabilityOfSuccess = results.probabilityOfSuccess;

      if (this.probabilityOfSuccess < .5) {
        this.brokeAge = retireAge + results.earliestBrokeYear;
      }
      else {
        this.brokeAge = -1; // don't show
      }

      // if (balance < 0 || principal < 0) {
      //   this.minY = balance < principal ? balance : principal;
      // }
      // else {
      //   this.minY = 0;
      // }

      return [{
        data: results.medianResults,
        label: "Median"
      },{
        data: results.tenthPercentileResults,
        label: "10th Percentile"
      }];

    }
  
}