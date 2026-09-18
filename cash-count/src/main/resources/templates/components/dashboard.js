/**
 * CashCount System - Main Dashboard Orchestrator & State Coordinator
 * Coordinates data synchronization between the Spring Boot backend and modular components.
 * Modules:
 * - metrics.js: Maintaining balance & budget progress bar
 * - transactions.js: Search, category filtering, table rendering & pagination
 * - modals.js: Flowbite dialog controls, CRUD validation & toast notifications
 */

// Shared State
let transactions = [];
let monthlyBudget = null; // { month: 'September', year: 2026, limit: 5000.00 }
let baseMaintainingBalance = 0;
let reserveFundName = 'Maintaining cash reserve';

// Shared Formatters & Utilities
function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return '₱ ' + val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Data Synchronization with Spring Boot Backend
function loadData() {
    const serverData = window.__SERVER_DATA__;
    const isBackendActive = serverData && serverData.hasBackend;

    if (isBackendActive && Array.isArray(serverData.transactions)) {
        transactions = serverData.transactions.map(t => {
            let dateStr = '';
            if (typeof t.date === 'string') {
                dateStr = t.date;
            } else if (Array.isArray(t.date) && t.date.length >= 3) {
                dateStr = `${t.date[0]}-${String(t.date[1]).padStart(2, '0')}-${String(t.date[2]).padStart(2, '0')}`;
            } else {
                dateStr = new Date().toISOString().split('T')[0];
            }

            return {
                id: String(t.id),
                title: t.title || t.description || 'Untitled',
                category: t.category || 'Other',
                type: t.type || 'EXPENSE',
                amount: parseFloat(t.amount) || 0,
                date: dateStr,
                notes: t.notes || ''
            };
        });
    } else {
        transactions = [];
    }

    if (isBackendActive && serverData.budget && serverData.budgetLimit) {
        const rawLimit = parseFloat(String(serverData.budgetLimit).replace(/,/g, '')) || 0;
        let monthName = 'September';
        let yearVal = 2026;
        if (serverData.budgetMonthYear) {
            const parts = serverData.budgetMonthYear.split(' ');
            if (parts.length >= 1) monthName = parts[0];
            if (parts.length >= 2) yearVal = parseInt(parts[1], 10) || 2026;
        }
        monthlyBudget = {
            month: monthName,
            year: yearVal,
            limit: rawLimit
        };
    } else {
        monthlyBudget = null;
    }

    baseMaintainingBalance = 0;
}

// Lifecycle Initialization
function initDashboard() {
    loadData();
    if (typeof renderCategoryFilterOptions === 'function') {
        renderCategoryFilterOptions();
    }
    if (typeof recalculateMetrics === 'function') {
        recalculateMetrics();
    }
    if (typeof renderTable === 'function') {
        renderTable();
    }
}

document.addEventListener('DOMContentLoaded', initDashboard);
