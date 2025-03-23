import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormatUtil } from '../../formatutil';
import { BaseComponent } from 'src/app/base/base.component';
import { MonteCarloService, MonteCarloResults } from 'src/app/monte-carlo.service';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-probability-to-retire',
  templateUrl: './probability-to-retire.component.html',
  styleUrls: ['./probability-to-retire.component.scss']
})
export class ProbabilityToRetireComponent extends BaseComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  inputForm: any = {};

  public lineChartOptions(minY: number, maxX: number): ChartConfiguration['options'] {
    return {
      responsive: true,
      // We use these empty structures as placeholders for dynamic theming.
      scales: {
          x: {
            max: maxX,
            stacked: true,
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
  public maxX: number = 80;

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

    this.route.queryParams
      .subscribe(params => {
        let initial = params["initial"] as string;
        let contribution = params["contrib"] as string;
        let expenses = params["expenses"] as string;
        let retireAge = params["retireAge"] as string;
        let expireAge = params["expireAge"] as string;
        let socialSecurityAge = params["ssAge"] as string;
        let socialSecurityIncome = params["ssIncome"] as string; 
        let taxRate = params["tax"] as string; 
        let view = params["view"] as string;
        
        this.onInitForm(initial, contribution, expenses, retireAge, expireAge, 
          socialSecurityAge, socialSecurityIncome, taxRate, view);
        this.onChange(true);
      }
    );

  }

  onInitForm(initial: string, contribution: string, expenses: string, retireAge: string, expireAge: string, 
    socialSecurityAge: string, socialSecurityIncome: string, taxRate: string, view: string) {

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
      monthlyContribution: [getValue(contribution, "$0")],
      monthlyExpenses: [getValue(expenses, "$4000")],
      retireAge: [getValue(retireAge, "62")],
      expireAge: [getValue(expireAge, "92")],
      socialSecurityAge: [getValue(socialSecurityAge, "67")],
      socialSecurityIncome: [getValue(socialSecurityIncome, "$0")],
      taxRate: [getValue(taxRate, ".15")],
      viewMode: [getValue(view, "")]
    });
  }

  onChange(init?: boolean) {
    // TODO: Use EventEmitter with form value
    console.warn(this.inputForm.value);
    let input = this.inputForm.value;

    if (!init && input.viewMode) {
      this.onInitForm(input.initialPrincipal, input.monthlyContribution, input.monthlyExpenses, input.retireAge,
        input.expireAge, input.socialSecurityAge, input.socialSecurityIncome, input.taxRate, input.viewMode);
      input = this.inputForm.value;
    }
    
    let principal = FormatUtil.parseToNumber(input.initialPrincipal);
    let contrib = FormatUtil.parseToNumber(input.monthlyContribution);
    let expenses = FormatUtil.parseToNumber(input.monthlyExpenses);
    let retireAge = FormatUtil.parseToNumber(input.retireAge);
    let expireAge = FormatUtil.parseToNumber(input.expireAge);
    let ssAge = FormatUtil.parseToNumber(input.socialSecurityAge);
    let ssIncome = FormatUtil.parseToNumber(input.socialSecurityIncome);
    let taxRate = FormatUtil.parseToNumber(input.taxRate);

    this.lifeSpan = expireAge;

    this.lineChartData.labels 
      = this.calcLabels(input.retireAge as number, input.expireAge as number);  
  
    this.lineChartData.datasets 
      = this.calcResultsets(principal, contrib, expenses, retireAge, expireAge, 
        ssAge, ssIncome, taxRate, input.viewMode);

    this.chart?.update();
  }

  calcLabels(retireAge: number, expireAge: number) : string[] {
    let labels: string[] = [];

    for (let i=retireAge; i <= expireAge; i++) {
      labels.push(this.periodLabel + " " + i);
    }

    return labels;
  }

  calcResultsets(principal: number, contrib: number, expenses: number, 
    retireAge: number, expireAge: number, ssAge: number, 
    ssIncome: number, taxRate: number, viewmode?: string): any {
  
      let results: MonteCarloResults = this.monteCarloService.performMonteCarloSimulation(
          principal, contrib, expenses, retireAge, expireAge, ssAge, ssIncome, taxRate);

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