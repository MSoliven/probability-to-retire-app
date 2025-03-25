import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProbabilityToRetireComponent } from './calculators/probability-to-retire/probability-to-retire.component';
import { KeyPipe } from './key.pipe';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChooseQuantityComponent } from './form-controls/choose-quantity/choose-quantity.component';
import { OnlyNumberDirective } from './directives/only-number.directive';
import { BaseComponent } from './base/base.component';
import { TabsComponent } from './form-controls/tabs/tabs.component';

@NgModule({
  declarations: [
    AppComponent,
    ProbabilityToRetireComponent,
    KeyPipe,
    ChooseQuantityComponent,
    OnlyNumberDirective,
    BaseComponent,
    TabsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgChartsModule
  ],
  providers: [CurrencyPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
