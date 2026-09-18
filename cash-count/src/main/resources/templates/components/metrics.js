/**
 * CashCount System - Metrics & Responsive Budget Bar Module
 * Handles maintaining balance calculations, non-negative clamping,
 * and responsive monthly budget threshold progress bars.
 */

// --- Balance & Metric Calculations ---
function getMaintainingBalance() {
    let totalIncome = 0;
    let totalExpense = 0;

    if (Array.isArray(transactions)) {
        transactions.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'INCOME') totalIncome += amt;
            else totalExpense += amt;
        });
    }

    const rawBalance = (baseMaintainingBalance || 0) + totalIncome - totalExpense;
    return {
        base: baseMaintainingBalance,
        raw: rawBalance,
        clamped: Math.max(0, rawBalance), // Maintaining balance cannot be negative
        totalIncome,
        totalExpense
    };
}

function recalculateMetrics() {
    const { clamped, totalIncome, totalExpense } = getMaintainingBalance();

    // 1. Maintaining Balance Display (Never negative)
    const balanceEl = document.getElementById('totalBalanceDisplay');
    const statusBadge = document.getElementById('balanceStatusBadge');
    const reserveLabelEl = document.getElementById('reserveNameLabel');

    if (reserveLabelEl && reserveFundName) {
        reserveLabelEl.textContent = reserveFundName;
    }
    if (balanceEl) {
        balanceEl.textContent = formatCurrency(clamped);
        if (clamped === 0) {
            balanceEl.className = 'my-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400';
            if (statusBadge) {
                statusBadge.textContent = 'Depleted / Minimum';
                statusBadge.className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
            }
        } else {
            balanceEl.className = 'my-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white';
            if (statusBadge) {
                statusBadge.textContent = 'Active Balance';
                statusBadge.className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
            }
        }
    }

    // Cash Flow Summary
    const cashFlowEl = document.getElementById('cashFlowSummary');
    if (cashFlowEl) {
        cashFlowEl.textContent = `+${formatCurrency(totalIncome)} in / -${formatCurrency(totalExpense)} out`;
    }

    // 2. Responsive Monthly Budget & Threshold Progress Bar
    const headingEl = document.getElementById('budgetMonthHeading');
    const subTextEl = document.getElementById('budgetSubText');
    const percentBadge = document.getElementById('budgetPercentageDisplay');
    const progressText = document.getElementById('budgetProgressText');
    const progressBar = document.getElementById('budgetProgressBar');
    const emptyBar = document.getElementById('budgetEmptyBar');
    const inlineLabel = document.getElementById('budgetBarInlineLabel');
    const remainingEl = document.getElementById('budgetRemainingText');
    const limitEl = document.getElementById('budgetLimitBadge');
    const setBudgetBtnText = document.getElementById('setBudgetBtnText');

    if (!monthlyBudget) {
        // Budget is null / not set
        if (headingEl) headingEl.textContent = 'Monthly Budget';
        if (subTextEl) subTextEl.textContent = 'No spending limit set. Click "Set Budget" to track monthly expenses.';
        if (percentBadge) {
            percentBadge.textContent = '+ Set Budget';
            percentBadge.className = 'text-xs font-bold text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer';
        }
        if (progressText) {
            progressText.textContent = `Current expenses: ${formatCurrency(totalExpense)}. No budget limit is active.`;
        }
        if (progressBar) progressBar.style.width = '0%';
        if (emptyBar) emptyBar.classList.remove('hidden');
        if (remainingEl) remainingEl.innerHTML = 'Remaining: <span class="italic text-gray-400">Not set</span>';
        if (limitEl) limitEl.innerHTML = 'Limit: <span class="italic text-gray-400">None</span>';
        if (setBudgetBtnText) setBudgetBtnText.textContent = 'Set Monthly Budget';
    } else {
        // Budget limit active
        const limit = parseFloat(monthlyBudget.limit) || 0;
        const spent = totalExpense;
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const remaining = limit - spent;

        if (headingEl) headingEl.textContent = `${monthlyBudget.month} ${monthlyBudget.year} Budget`;
        if (subTextEl) subTextEl.textContent = 'Monthly spending limit & threshold tracking';
        if (emptyBar) emptyBar.classList.add('hidden');
        if (setBudgetBtnText) setBudgetBtnText.textContent = 'Edit Budget';

        if (progressText) {
            progressText.textContent = `Spent ${formatCurrency(spent)} of your ${formatCurrency(limit)} limit.`;
        }

        // Percentage Badge Color Codes
        if (percentBadge) {
            percentBadge.textContent = `${percentage}% used`;
            if (percentage > 100) {
                percentBadge.className = 'text-xs font-extrabold text-red-700 dark:text-red-300 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800';
            } else if (percentage >= 80) {
                percentBadge.className = 'text-xs font-bold text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800';
            } else {
                percentBadge.className = 'text-xs font-bold text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800';
            }
        }

        // Progress Bar Width and Adaptive Color
        if (progressBar) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            if (percentage > 100) {
                progressBar.className = 'bg-red-600 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 shadow-sm';
            } else if (percentage >= 80) {
                progressBar.className = 'bg-amber-500 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 shadow-sm';
            } else {
                progressBar.className = 'bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 shadow-sm';
            }
        }

        if (inlineLabel) {
            inlineLabel.textContent = `${percentage}%`;
            inlineLabel.style.display = percentage >= 15 ? 'inline' : 'none';
        }

        if (remainingEl) {
            if (remaining >= 0) {
                remainingEl.innerHTML = `Remaining: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${formatCurrency(remaining)}</strong>`;
            } else {
                remainingEl.innerHTML = `Over Limit: <strong class="text-red-600 dark:text-red-400 font-bold">${formatCurrency(Math.abs(remaining))}</strong>`;
            }
        }

        if (limitEl) {
            limitEl.innerHTML = `Limit: <strong class="text-gray-800 dark:text-gray-100 font-bold">${formatCurrency(limit)}</strong>`;
        }
    }
}

function setBalancePreset(amount) {
    const input = document.getElementById('baseBalanceInput');
    if (input) {
        input.value = Number(amount).toFixed(2);
    }
}
