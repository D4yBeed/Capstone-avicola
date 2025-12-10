import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroHuevosPage } from './registro-huevos.page';

describe('RegistroHuevosPage', () => {
  let component: RegistroHuevosPage;
  let fixture: ComponentFixture<RegistroHuevosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroHuevosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
