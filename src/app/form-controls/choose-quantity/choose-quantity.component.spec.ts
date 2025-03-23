import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseQuantityComponent } from './choose-quantity.component';

describe('ChooseQuantityComponent', () => {
  let component: ChooseQuantityComponent;
  let fixture: ComponentFixture<ChooseQuantityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChooseQuantityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseQuantityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
