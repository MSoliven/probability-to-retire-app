import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbabilityToRetireComponent } from './probability-to-retire.component';

describe('ProbabilityToRetireComponent', () => {
  let component: ProbabilityToRetireComponent;
  let fixture: ComponentFixture<ProbabilityToRetireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProbabilityToRetireComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProbabilityToRetireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
