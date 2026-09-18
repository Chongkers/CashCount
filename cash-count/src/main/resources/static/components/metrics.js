/**
 * CashCount System - Metrics / Budget Bar Module
 *
 * Role: Visual-only adjustments after page load.
 * Thymeleaf renders the budget bar WIDTH (via th:style) and all numeric values.
 * This module only adjusts the bar COLOR based on the percent threshold
 * and hides the inline label if the bar is too narrow to fit text.
 */

function applyBudgetBarColor() {
    const bar = document.getElementById('budgetProgressBar');
    if (!bar) return;

    const percent = parseInt(bar.dataset.percent || '0', 10);
    const base = 'h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2';

    if (percent > 100) {
        bar.className = `bg-red-600 ${base}`;
    } else if (percent >= 80) {
        bar.className = `bg-amber-500 ${base}`;
    } else if (percent >= 50) {
        bar.className = `bg-blue-600 ${base}`;
    } else {
        bar.className = `bg-emerald-500 ${base}`;
    }



    // Update % badge color to match bar state
    const badge = document.getElementById('budgetPercentageDisplay');
    if (badge) {
        if (percent > 100) {
            badge.className = badge.className
                .replace(/text-\w+-\d+/g, 'text-red-600')
                .replace(/bg-\w+-\d+/g, 'bg-red-50')
                .replace(/border-\w+-\d+/g, 'border-red-100');
        } else if (percent >= 80) {
            badge.className = badge.className
                .replace(/text-\w+-\d+/g, 'text-amber-600')
                .replace(/bg-\w+-\d+/g, 'bg-amber-50')
                .replace(/border-\w+-\d+/g, 'border-amber-100');
        }
    }
}

// ── Preset helpers (used by balance modal) ────────────────────────────────────
function setBalancePreset(amount) {
    const input = document.getElementById('baseBalanceInput');
    if (input) input.value = Number(amount).toFixed(2);
}
