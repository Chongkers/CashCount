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
        bar.className = `bg-[#007a33] ${base}`;
    } else {
        bar.className = `bg-[#2d9175] ${base}`;
    }

    // Update % badge color to match bar state
    const badge = document.getElementById('budgetPercentageDisplay');
    if (badge) {
        if (percent > 100) {
            badge.className = 'text-sm font-bold text-red-600 dark:text-red-400 px-2.5 py-1 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 cursor-pointer hover:bg-red-100 transition';
        } else if (percent >= 80) {
            badge.className = 'text-sm font-bold text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 cursor-pointer hover:bg-amber-100 transition';
        } else {
            badge.className = 'text-sm font-bold text-[#007a33] dark:text-[#b2e0d4] px-2.5 py-1 rounded bg-[#e0f7f1] dark:bg-[#004d00]/50 border border-[#b2e0d4] dark:border-[#007a33]/60 cursor-pointer hover:bg-[#b2e0d4]/30 transition';
        }
    }
}

// ── Preset helpers (used by balance modal) ────────────────────────────────────
function setBalancePreset(amount) {
    const input = document.getElementById('baseBalanceInput');
    if (input) input.value = Number(amount).toFixed(2);
}
