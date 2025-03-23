import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-base',
  template: `
    <p>
      base works!
    </p>
  `,
  styles: [
  ]
})
export class BaseComponent implements OnInit {

  public readOnly: boolean = false;
  public compact: boolean = false;

  constructor(public router: Router, public route: ActivatedRoute) { }

  ngOnInit(): void {

    this.route.queryParams
      .subscribe(params => {
        let view = params["view"] as string;
        this.compact = (view.toLowerCase() == "compact");
      }
    );

  }

  openPage(routename: string) {
    this.router.navigateByUrl(`/${routename}`);
  }
}
