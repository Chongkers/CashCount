/**
 * CashCount System - Dashboard Orchestrator
 *
 * Role: Shared format utilities + page initialization.
 * Data is rendered server-side by Thymeleaf — this file does NOT fetch or store data.
 * JavaScript handles ONLY: search, filter, pagination (transactions.js),
 * modal open/close and form pre-fill (modals.js), and budget bar color (metrics.js).
 */

// ── Shared Format Utilities ───────────────────────────────────────────────────

function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return '\u20B1 ' + val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    // dateStr from data-date is ISO format: "2026-09-01"
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Read Current Balance from DOM (Thymeleaf rendered ₱ X,XXX.XX) ────────────
function getCurrentBalance() {
    const el = document.getElementById('totalBalanceDisplay');
    if (!el) return 0;
    // Strip ₱, commas, spaces → parse as float
    return parseFloat(el.textContent.replace(/[₱\u20B1,\s]/g, '')) || 0;
}

// ── Prototype Actions (POST to server endpoints) ──────────────────────────────
function clearAllData() {
    if (!confirm('Delete all transactions and budget data? This cannot be undone.')) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/data/clear';
    document.body.appendChild(form);
    form.submit();
}

function resetPrototype() {
    clearAllData();
}

// ── Theme Management (Dark / Light Mode) ──────────────────────────────────────
function syncThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    const darkIcons = document.querySelectorAll('.theme-toggle-dark-icon');
    const lightIcons = document.querySelectorAll('.theme-toggle-light-icon');

    darkIcons.forEach(icon => {
        if (isDark) {
            icon.classList.remove('hidden');
        } else {
            icon.classList.add('hidden');
        }
    });

    lightIcons.forEach(icon => {
        if (isDark) {
            icon.classList.add('hidden');
        } else {
            icon.classList.remove('hidden');
        }
    });
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }
    syncThemeIcons();
}

function initTheme() {
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    syncThemeIcons();
}

// ── Initialization ────────────────────────────────────────────────────────────
function initDashboard() {
    initTheme();
    if (typeof initTableInteractivity === 'function') initTableInteractivity();
    if (typeof applyBudgetBarColor === 'function') applyBudgetBarColor();
}

document.addEventListener('DOMContentLoaded', initDashboard);
