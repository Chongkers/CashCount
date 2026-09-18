/**
 * CashCount System - Modals & CRUD Form Handlers Module
 * Controls Flowbite dialog visibility, form validation,
 * negative-balance guardrails, and toast notifications.
 */

// --- Modal Display Controls ---
function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('flex');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    el.classList.add('hidden');
    el.classList.remove('flex');
    el.setAttribute('aria-hidden', 'true');

    const anyOpen = document.querySelectorAll('[id$="Modal"].flex');
    if (anyOpen.length === 0) {
        document.body.classList.remove('overflow-hidden');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        ['setMaintainingBalanceModal', 'setBudgetModal', 'createTransactionModal', 'updateTransactionModal', 'readTransactionModal', 'deleteTransactionModal'].forEach(closeModal);
    }
});

// --- Toast Notification Helper ---
let toastTimeout = null;
function showToast(message, variant = 'blue') {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    const iconContainer = document.getElementById('toastIconContainer');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;

    if (variant === 'red') {
        iconContainer.className = 'inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 text-red-500 dark:bg-red-900/60 dark:text-red-300';
        iconContainer.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
    } else {
        iconContainer.className = 'inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 text-emerald-500 dark:bg-emerald-900/60 dark:text-emerald-300';
        iconContainer.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
    }

    toast.classList.remove('translate-y-16', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-16', 'opacity-0', 'pointer-events-none');
    }, 3500);
}

// --- Maintaining Balance Modal ---
function openBalanceModal(isSetup = false) {
    const input = document.getElementById('baseBalanceInput');
    const labelInput = document.getElementById('reserveNameInput');
    const subtitle = document.getElementById('balanceModalSubtitle');
    const title = document.getElementById('balanceModalTitle');

    const currentClamped = typeof getMaintainingBalance === 'function' ? getMaintainingBalance().clamped : 0;
    if (input) {
        input.value = currentClamped > 0 ? currentClamped.toFixed(2) : '7500.00';
    }
    if (labelInput) {
        labelInput.value = reserveFundName || 'Maintaining cash reserve';
    }
    if (subtitle) {
        subtitle.textContent = isSetup ? 'Prototype Setup' : 'Reserve Management';
    }
    if (title) {
        title.textContent = isSetup ? 'Set Maintaining Balance' : 'Adjust Maintaining Balance';
    }
    openModal('setMaintainingBalanceModal');
}

function handleBalanceSubmit(e) {
    const isBackend = window.__SERVER_DATA__ && window.__SERVER_DATA__.hasBackend;
    const input = document.getElementById('baseBalanceInput');
    const labelInput = document.getElementById('reserveNameInput');
    const targetBalance = parseFloat(input ? input.value : 0);

    if (isNaN(targetBalance) || targetBalance < 0) {
        if (e) e.preventDefault();
        alert('Please enter a valid maintaining balance amount (0.00 or greater).');
        return;
    }

    if (!isBackend) {
        if (e) e.preventDefault();
        let netTransactions = 0;
        transactions.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'INCOME') netTransactions += amt;
            else netTransactions -= amt;
        });

        baseMaintainingBalance = targetBalance - netTransactions;
        if (labelInput && labelInput.value.trim()) {
            reserveFundName = labelInput.value.trim();
        }

        recalculateMetrics();
        closeModal('setMaintainingBalanceModal');
        showToast(`Maintaining balance set to ${formatCurrency(targetBalance)}!`, 'emerald');
    }
    // With Spring Boot active, the form naturally POSTs to /balance/set
}

// --- Monthly Budget Modal ---
function openBudgetModal() {
    const monthSelect = document.getElementById('budgetMonthInput');
    const yearInput = document.getElementById('budgetYearInput');
    const limitInput = document.getElementById('budgetLimitInput');
    const modalTitle = document.getElementById('budgetModalTitle');

    if (monthlyBudget) {
        if (modalTitle) modalTitle.textContent = 'Edit Monthly Budget';
        if (monthSelect) monthSelect.value = monthlyBudget.month || 'September';
        if (yearInput) yearInput.value = monthlyBudget.year || 2026;
        if (limitInput) limitInput.value = monthlyBudget.limit || 5000;
    } else {
        if (modalTitle) modalTitle.textContent = 'Set Monthly Budget';
        if (monthSelect) monthSelect.value = 'September';
        if (yearInput) yearInput.value = 2026;
        if (limitInput) limitInput.value = '';
    }

    openModal('setBudgetModal');
}

function handleBudgetSubmit(e) {
    const isBackend = window.__SERVER_DATA__ && window.__SERVER_DATA__.hasBackend;
    const month = document.getElementById('budgetMonthInput').value;
    const year = parseInt(document.getElementById('budgetYearInput').value, 10) || 2026;
    const limit = parseFloat(document.getElementById('budgetLimitInput').value);

    if (isNaN(limit) || limit <= 0) {
        if (e) e.preventDefault();
        alert('Please provide a valid positive budget limit amount.');
        return;
    }

    if (!isBackend) {
        if (e) e.preventDefault();
        monthlyBudget = { month, year, limit };
        recalculateMetrics();
        closeModal('setBudgetModal');
        showToast(`Budget for ${month} ${year} set to ${formatCurrency(limit)}!`, 'emerald');
    }
    // With Spring Boot active, the form naturally POSTs to /budget/set
}

// --- CRUD: 1. CREATE ---
function openCreateModal() {
    const form = document.getElementById('createTransactionForm');
    if (form) form.reset();
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('createDate');
    if (dateInput) dateInput.value = today;

    const warningEl = document.getElementById('createBalanceWarning');
    if (warningEl) warningEl.classList.add('hidden');

    openModal('createTransactionModal');
}

function handleCreateSubmit(e) {
    const isBackend = window.__SERVER_DATA__ && window.__SERVER_DATA__.hasBackend;
    const typeRadios = document.getElementsByName('createType');
    let type = 'EXPENSE';
    for (const r of typeRadios) {
        if (r.checked) type = r.value;
    }

    const title = document.getElementById('createTitle').value.trim();
    const category = document.getElementById('createCategory').value;
    const amount = parseFloat(document.getElementById('createAmount').value);
    const date = document.getElementById('createDate').value;
    const notes = document.getElementById('createNotes').value.trim();

    if (!title || isNaN(amount) || amount <= 0 || !date) {
        if (e) e.preventDefault();
        alert('Please enter valid transaction information.');
        return;
    }

    // REQUIREMENT: Maintaining Balance cannot accept negative values
    const { clamped } = getMaintainingBalance();
    if (type === 'EXPENSE' && amount > clamped) {
        if (e) e.preventDefault();
        alert(`Transaction Rejected:\nThis expense (${formatCurrency(amount)}) exceeds your current maintaining balance (${formatCurrency(clamped)}).\nMaintaining balance cannot be negative.`);
        return;
    }

    if (!isBackend) {
        if (e) e.preventDefault();
        const newTx = {
            id: 'tx-' + Date.now(),
            title,
            category,
            type,
            amount,
            date,
            notes
        };

        transactions.unshift(newTx);
        recalculateMetrics();
        renderTable();
        closeModal('createTransactionModal');
        showToast(`Transaction "${title}" added successfully!`, 'emerald');
    }
    // With Spring Boot active, the form posts directly to /transactions/add
}

// --- CRUD: 2. READ / PREVIEW ---
function openReadModal(id) {
    const item = transactions.find(t => t.id === id);
    if (!item) return;

    const isIncome = item.type === 'INCOME';
    document.getElementById('previewTitle').textContent = item.title;
    document.getElementById('previewId').textContent = '#' + item.id.toUpperCase();
    document.getElementById('previewDate').textContent = formatDate(item.date);
    document.getElementById('previewNotes').textContent = item.notes || 'No notes provided.';

    const amountEl = document.getElementById('previewAmount');
    amountEl.textContent = (isIncome ? '+ ' : '- ') + formatCurrency(item.amount);
    amountEl.className = isIncome 
        ? 'text-3xl font-extrabold text-emerald-600 dark:text-emerald-400'
        : 'text-3xl font-extrabold text-red-600 dark:text-red-400';

    const typeBadge = document.getElementById('previewTypeBadge');
    typeBadge.textContent = isIncome ? 'Income (Cash In)' : 'Expense (Cash Out)';
    typeBadge.className = isIncome 
        ? 'text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
        : 'text-xs font-semibold px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';

    const catBadge = document.getElementById('previewCategoryBadge');
    catBadge.textContent = item.category;
    catBadge.className = 'text-xs font-medium px-2.5 py-0.5 rounded border ' + (categoryBadgeClasses[item.category] || categoryBadgeClasses['Other']);

    document.getElementById('previewEditBtn').onclick = () => {
        closeModal('readTransactionModal');
        openUpdateModal(item.id);
    };
    document.getElementById('previewDeleteBtn').onclick = () => {
        closeModal('readTransactionModal');
        openDeleteModal(item.id);
    };

    openModal('readTransactionModal');
}

// --- CRUD: 3. UPDATE ---
function openUpdateModal(id) {
    const item = transactions.find(t => t.id === id);
    if (!item) return;

    document.getElementById('editTransactionId').value = item.id;
    document.getElementById('editTitle').value = item.title;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editAmount').value = item.amount;
    document.getElementById('editDate').value = item.date;
    document.getElementById('editNotes').value = item.notes || '';

    if (item.type === 'INCOME') {
        document.getElementById('editTypeIncome').checked = true;
    } else {
        document.getElementById('editTypeExpense').checked = true;
    }

    openModal('updateTransactionModal');
}

function handleUpdateSubmit(e) {
    const isBackend = window.__SERVER_DATA__ && window.__SERVER_DATA__.hasBackend;
    const id = document.getElementById('editTransactionId').value;
    const itemIndex = transactions.findIndex(t => t.id === id);

    const typeRadios = document.getElementsByName('type');
    let type = 'EXPENSE';
    for (const r of typeRadios) {
        if (r.checked) type = r.value;
    }

    const title = document.getElementById('editTitle').value.trim();
    const category = document.getElementById('editCategory').value;
    const amount = parseFloat(document.getElementById('editAmount').value);
    const date = document.getElementById('editDate').value;
    const notes = document.getElementById('editNotes').value.trim();

    if (!title || isNaN(amount) || amount <= 0 || !date) {
        if (e) e.preventDefault();
        alert('Please enter valid transaction information.');
        return;
    }

    // Negative maintaining balance check
    let simulatedBalance = baseMaintainingBalance || 0;
    transactions.forEach((t, idx) => {
        if (idx === itemIndex) return;
        if (t.type === 'INCOME') simulatedBalance += t.amount;
        else simulatedBalance -= t.amount;
    });
    if (type === 'INCOME') simulatedBalance += amount;
    else simulatedBalance -= amount;

    if (simulatedBalance < 0) {
        if (e) e.preventDefault();
        alert(`Update Rejected:\nThis modification would result in a negative maintaining balance (${formatCurrency(simulatedBalance)}).\nMaintaining balance cannot be negative.`);
        return;
    }

    if (!isBackend) {
        if (e) e.preventDefault();
        transactions[itemIndex] = {
            ...transactions[itemIndex],
            title,
            category,
            type,
            amount,
            date,
            notes
        };

        recalculateMetrics();
        renderTable();
        closeModal('updateTransactionModal');
        showToast(`Transaction "${title}" updated successfully!`, 'emerald');
    }
    // With Spring Boot active, the form naturally POSTs to /transactions/update
}

function triggerDeleteFromEdit() {
    const id = document.getElementById('editTransactionId').value;
    closeModal('updateTransactionModal');
    openDeleteModal(id);
}

// --- CRUD: 4. DELETE ---
function openDeleteModal(id) {
    const item = transactions.find(t => t.id === id);
    if (!item) return;

    document.getElementById('deleteTargetId').value = item.id;
    document.getElementById('deleteTargetTitle').textContent = `"${item.title}"`;
    document.getElementById('deleteTargetAmount').textContent = formatCurrency(item.amount);

    openModal('deleteTransactionModal');
}

function confirmDelete(e) {
    const isBackend = window.__SERVER_DATA__ && window.__SERVER_DATA__.hasBackend;
    const id = document.getElementById('deleteTargetId').value;
    const item = transactions.find(t => t.id === id);
    const title = item ? item.title : 'Transaction';

    if (!isBackend) {
        if (e) e.preventDefault();
        transactions = transactions.filter(t => t.id !== id);
        recalculateMetrics();
        renderTable();
        closeModal('deleteTransactionModal');
        showToast(`"${title}" was deleted.`, 'red');
    }
    // With Spring Boot active, the form submits to /transactions/delete
}
