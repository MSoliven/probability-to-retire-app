import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProbabilityToRetireComponent } from './calculators/probability-to-retire/probability-to-retire.component';

const routes: Routes = [
  { path: '', component: ProbabilityToRetireComponent },
  { path: 'ProbabilityToRetire', component: ProbabilityToRetireComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
