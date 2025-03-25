import { Component, Input } from '@angular/core';

@Component({
  selector: 'tabs-component',
  templateUrl:"./tabs.component.html",
  styleUrls: ["./tabs.component.scss"],
})
export class TabsComponent {
  @Input() tabs: Array<{ label: string, template: any }> = [];
  selectedIndex = 0;

  selectTab(index: number): void {
    this.selectedIndex = index;
  }
}
