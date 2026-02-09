import { TestBed } from '@angular/core/testing';
import { PanelHeaderComponent } from './panel-header.component';
import { signal } from '@angular/core';

describe('PanelHeaderComponent', () => {
  it('should create', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [PanelHeaderComponent],
    }).createComponent(PanelHeaderComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display session name', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [PanelHeaderComponent],
    }).createComponent(PanelHeaderComponent);

    fixture.componentRef.setInput('sessionName', signal('Test Session'));
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('.session-name');
    expect(nameEl?.textContent).toContain('Test Session');
  });

  it('should emit rename event when editing completes', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [PanelHeaderComponent],
    }).createComponent(PanelHeaderComponent);

    let emittedName = '';
    (fixture.componentRef.rename as any).subscribe((name: string) => (emittedName = name));

    fixture.componentRef.setInput('sessionName', signal('Old Name'));
    fixture.detectChanges();

    fixture.componentRef.onNameEditComplete('New Name');
    expect(emittedName).toBe('New Name');
  });
});
