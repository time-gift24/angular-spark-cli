import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationShowcase } from './animation-showcase';

describe('AnimationShowcase', () => {
  let component: AnimationShowcase;
  let fixture: ComponentFixture<AnimationShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimationShowcase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnimationShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
