/**
 * Theme management for dark/light mode
 */

export class ThemeManager {
  constructor() {
    this.currentTheme = this.getSavedTheme() || this.getPreferredTheme();
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeToggle();
    this.listenForSystemThemeChanges();
  }

  getPreferredTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  getSavedTheme() {
    return localStorage.getItem('texture-recreator-theme');
  }

  saveTheme(theme) {
    localStorage.setItem('texture-recreator-theme', theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.saveTheme(theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    this.updateToggleButton();
  }

  createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.innerHTML = this.getToggleIcon();
    toggle.addEventListener('click', () => this.toggleTheme());

    const container = document.getElementById('container');
    if (container) {
      container.insertBefore(toggle, container.firstChild);
    }
  }

  updateToggleButton() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.innerHTML = this.getToggleIcon();
    }
  }

  getToggleIcon() {
    if (this.currentTheme === 'dark') {
      return '☀️';
    }
    return '🌙';
  }

  listenForSystemThemeChanges() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getSavedTheme()) {
        this.applyTheme(e.matches ? 'dark' : 'light');
        this.updateToggleButton();
      }
    });
  }
}
