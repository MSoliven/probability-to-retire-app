import { TestBed } from '@angular/core/testing';

import { MonteCarloService } from './monte-carlo.service';

describe('MonteCarloService', () => {
  let service: MonteCarloService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonteCarloService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
