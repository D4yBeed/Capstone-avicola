import { TestBed } from '@angular/core/testing';

import { Firebase } from './firebase.service';

describe('Firebase', () => {
  let service: Firebase;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Firebase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
