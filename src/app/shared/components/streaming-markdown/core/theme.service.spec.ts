/**
 * ThemeService Tests
 *
 * Tests for the theme service stub implementation.
 * Verifies basic theme management functionality.
 *
 * Phase 9.1, Step 4: Write Tests
 */

import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be provided at root level', () => {
      // Service should be singleton
      const service2 = TestBed.inject(ThemeService);
      expect(service).toBe(service2);
    });
  });

  describe('Theme Signal', () => {
    it('should have theme signal', () => {
      expect(service.theme).toBeDefined();
    });

    it('should initialize with light theme', () => {
      expect(service.theme()).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should have toggleTheme method', () => {
      expect(service.toggleTheme).toBeDefined();
    });

    it('should toggle from light to dark', () => {
      service.setTheme('light');
      service.toggleTheme();
      expect(service.theme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      service.setTheme('dark');
      service.toggleTheme();
      expect(service.theme()).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('should have setTheme method', () => {
      expect(service.setTheme).toBeDefined();
    });

    it('should set theme to light', () => {
      service.setTheme('light');
      expect(service.theme()).toBe('light');
    });

    it('should set theme to dark', () => {
      service.setTheme('dark');
      expect(service.theme()).toBe('dark');
    });

    it('should update theme signal', () => {
      service.setTheme('dark');
      expect(service.theme()).toBe('dark');
      service.setTheme('light');
      expect(service.theme()).toBe('light');
    });
  });

  describe('isDark', () => {
    it('should have isDark method', () => {
      expect(service.isDark).toBeDefined();
    });

    it('should return true when theme is dark', () => {
      service.setTheme('dark');
      expect(service.isDark()).toBe(true);
    });

    it('should return false when theme is light', () => {
      service.setTheme('light');
      expect(service.isDark()).toBe(false);
    });
  });

  describe('isLight', () => {
    it('should have isLight method', () => {
      expect(service.isLight).toBeDefined();
    });

    it('should return true when theme is light', () => {
      service.setTheme('light');
      expect(service.isLight()).toBe(true);
    });

    it('should return false when theme is dark', () => {
      service.setTheme('dark');
      expect(service.isLight()).toBe(false);
    });
  });

  describe('getCurrentTheme', () => {
    it('should have getCurrentTheme method', () => {
      expect(service.getCurrentTheme).toBeDefined();
    });

    it('should return current theme value', () => {
      service.setTheme('light');
      expect(service.getCurrentTheme()).toBe('light');

      service.setTheme('dark');
      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should match theme signal value', () => {
      service.setTheme('light');
      expect(service.getCurrentTheme()).toBe(service.theme());

      service.setTheme('dark');
      expect(service.getCurrentTheme()).toBe(service.theme());
    });
  });

  describe('IThemeService Interface Compliance', () => {
    it('should have readonly theme signal', () => {
      expect(service.theme).toBeDefined();
      expect(typeof service.theme).toBe('function');
    });

    it('should implement all required interface methods', () => {
      expect(service.toggleTheme).toBeDefined();
      expect(service.setTheme).toBeDefined();
      expect(service.isDark).toBeDefined();
      expect(service.isLight).toBeDefined();
    });
  });

  describe('Stub Implementation', () => {
    it('should be ready for Phase 10 expansion', () => {
      // Verify all basic functionality works
      expect(service.theme()).toBe('light');
      service.toggleTheme();
      expect(service.theme()).toBe('dark');
      service.setTheme('light');
      expect(service.theme()).toBe('light');
      expect(service.isLight()).toBe(true);
      expect(service.isDark()).toBe(false);
    });

    it('should persist theme changes in memory', () => {
      service.setTheme('dark');
      expect(service.theme()).toBe('dark');
      expect(service.getCurrentTheme()).toBe('dark');

      // Multiple changes should persist
      service.setTheme('light');
      expect(service.theme()).toBe('light');

      service.toggleTheme();
      expect(service.theme()).toBe('dark');
    });
  });
});
