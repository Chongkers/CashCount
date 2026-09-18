/**
 * CashCount System - Modals & CRUD Form Handlers Module
 *
 * Role: Modal open/close + form pre-filling from data-* attributes.
 * Transaction data comes from data-* attributes on <tr class="tx-row"> elements
 * rendered by Thymeleaf — NOT from a JavaScript data array.
 * All CRUD operations submit naturally to Spring Boot endpoints via HTML forms.
 */

// ── Modal Display Controls ────────────────────────────────────────────────────

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

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        ['setMaintainingBalanceModal','setBudgetModal','createTransactionModal',
         'updateTransactionModal','readTransactionModal','deleteTransactionModal']
            .forEach(closeModal);
    }
});

// ── Toast Notification ────────────────────────────────────────────────────────

let toastTimeout = null;
function showToast(message, variant = 'blue') {
    const toast    = document.getElementById('toastNotification');
    const msgEl    = document.getElementById('toastMessage');
    const iconCont = document.getElementById('toastIconContainer');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    if (variant === 'red') {
        iconCont.className = 'inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 text-red-500 dark:bg-red-900/60 dark:text-red-300';
        iconCont.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
    } else {
        iconCont.className = 'inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 text-emerald-500 dark:bg-emerald-900/60 dark:text-emerald-300';
        iconCont.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
    }

    toast.classList.remove('translate-y-16', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-16', 'opacity-0', 'pointer-events-none');
    }, 3500);
}

// ── Maintaining Balance Modal ─────────────────────────────────────────────────

function openBalanceModal(isSetup = false) {
    const input    = document.getElementById('baseBalanceInput');
    const subtitle = document.getElementById('balanceModalSubtitle');
    const title    = document.getElementById('balanceModalTitle');

    // Read current balance from Thymeleaf-rendered display element
    const currentBalance = typeof getCurrentBalance === 'function' ? getCurrentBalance() : 0;
    if (input) input.value = currentBalance > 0 ? currentBalance.toFixed(2) : '7500.00';
    if (subtitle) subtitle.textContent = isSetup ? 'Prototype Setup' : 'Reserve Management';
    if (title)    title.textContent    = isSetup ? 'Set Maintaining Balance' : 'Adjust Maintaining Balance';

    openModal('setMaintainingBalanceModal');
}

function handleBalanceSubmit(e) {
    const input         = document.getElementById('baseBalanceInput');
    const targetBalance = parseFloat(input ? input.value : 0);

    if (isNaN(targetBalance) || targetBalance < 0) {
        if (e) e.preventDefault();
        alert('Please enter a valid maintaining balance amount (0.00 or greater).');
        return;
    }
    // Form submits naturally to /balance/set (POST)
}

// ── Monthly Budget Modal ──────────────────────────────────────────────────────

function openBudgetModal() {
    const container = document.getElementById('budgetBarContainer');
    const hasBudget = container?.dataset.hasBudget === 'true';

    const monthSelect  = document.getElementById('budgetMonthInput');
    const yearInput    = document.getElementById('budgetYearInput');
    const limitInput   = document.getElementById('budgetLimitInput');
    const modalTitle   = document.getElementById('budgetModalTitle');

    if (hasBudget && container) {
        if (modalTitle)   modalTitle.textContent  = 'Edit Monthly Budget';
        if (monthSelect)  monthSelect.value        = container.dataset.month  || 'September';
        if (yearInput)    yearInput.value           = container.dataset.year   || new Date().getFullYear();
        if (limitInput)   limitInput.value          = parseFloat(container.dataset.limit || 0).toFixed(2);
    } else {
        if (modalTitle)   modalTitle.textContent  = 'Set Monthly Budget';
        if (monthSelect)  monthSelect.value        = new Date().toLocaleDateString('en-US', { month: 'long' });
        if (yearInput)    yearInput.value           = new Date().getFullYear();
        if (limitInput)   limitInput.value          = '';
    }

    openModal('setBudgetModal');
}

function handleBudgetSubmit(e) {
    const limit = parseFloat(document.getElementById('budgetLimitInput')?.value);
    if (isNaN(limit) || limit <= 0) {
        if (e) e.preventDefault();
        alert('Please provide a valid positive budget limit amount.');
        return;
    }
    // Form submits naturally to /budget/set (POST)
}

// ── CRUD: 1. CREATE ───────────────────────────────────────────────────────────

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
    const typeRadios = document.getElementsByName('createType');
    let type = 'EXPENSE';
    for (const r of typeRadios) { if (r.checked) { type = r.value; break; } }

    const title    = document.getElementById('createTitle')?.value.trim();
    const amount   = parseFloat(document.getElementById('createAmount')?.value);
    const date     = document.getElementById('createDate')?.value;

    // Field validation
    if (!title || isNaN(amount) || amount <= 0 || !date) {
        if (e) e.preventDefault();
        alert('Please enter valid transaction information (title, amount, and date are required).');
        return;
    }

    // Client-side maintaining balance guard (server also enforces this)
    if (type === 'EXPENSE') {
        const currentBalance = typeof getCurrentBalance === 'function' ? getCurrentBalance() : 0;
        if (amount > currentBalance) {
            if (e) e.preventDefault();
            const warningEl = document.getElementById('createBalanceWarning');
            if (warningEl) {
                warningEl.textContent = `Transaction Rejected: This expense (${formatCurrency(amount)}) exceeds your current maintaining balance (${formatCurrency(currentBalance)}).`;
                warningEl.classList.remove('hidden');
            } else {
                alert(`Transaction Rejected:\nThis expense (${formatCurrency(amount)}) exceeds your maintaining balance (${formatCurrency(currentBalance)}).`);
            }
            return;
        }
    }
    // Form submits naturally to /transactions/add (POST)
}

// ── CRUD: 2. READ / PREVIEW ───────────────────────────────────────────────────

function openReadModal(id) {
    // Read all data from data-* attributes on the server-rendered <tr> row
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    const isIncome = row.dataset.type === 'INCOME';
    const amount   = parseFloat(row.dataset.amount) || 0;

    document.getElementById('previewTitle').textContent = row.dataset.title || '';
    document.getElementById('previewId').textContent    = '#' + id;
    document.getElementById('previewDate').textContent  = typeof formatDate === 'function' ? formatDate(row.dataset.date) : row.dataset.date;
    document.getElementById('previewNotes').textContent = row.dataset.notes || 'No notes provided.';

    const amountEl = document.getElementById('previewAmount');
    if (amountEl) {
        amountEl.textContent = (isIncome ? '+ ' : '- ') + (typeof formatCurrency === 'function' ? formatCurrency(amount) : amount);
        amountEl.className   = isIncome
            ? 'text-3xl font-extrabold text-emerald-600 dark:text-emerald-400'
            : 'text-3xl font-extrabold text-red-600 dark:text-red-400';
    }

    const typeBadge = document.getElementById('previewTypeBadge');
    if (typeBadge) {
        typeBadge.textContent = isIncome ? 'Income (Cash In)' : 'Expense (Cash Out)';
        typeBadge.className   = isIncome
            ? 'text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
            : 'text-xs font-semibold px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    }

    const catBadge = document.getElementById('previewCategoryBadge');
    if (catBadge) catBadge.textContent = row.dataset.category || '';

    document.getElementById('previewEditBtn').onclick   = () => { closeModal('readTransactionModal'); openUpdateModal(id); };
    document.getElementById('previewDeleteBtn').onclick = () => { closeModal('readTransactionModal'); openDeleteModal(id); };

    openModal('readTransactionModal');
}

// ── CRUD: 3. UPDATE ───────────────────────────────────────────────────────────

function openUpdateModal(id) {
    // Read all data from data-* attributes on the server-rendered <tr> row
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    document.getElementById('editTransactionId').value = id;
    document.getElementById('editTitle').value          = row.dataset.title    || '';
    document.getElementById('editCategory').value       = row.dataset.category || '';
    document.getElementById('editAmount').value         = row.dataset.amount   || '';
    document.getElementById('editDate').value           = row.dataset.date     || '';
    document.getElementById('editNotes').value          = row.dataset.notes    || '';

    const isIncome = row.dataset.type === 'INCOME';
    const incomeEl = document.getElementById('editTypeIncome');
    const expenseEl = document.getElementById('editTypeExpense');
    if (incomeEl)  incomeEl.checked  = isIncome;
    if (expenseEl) expenseEl.checked = !isIncome;

    openModal('updateTransactionModal');
}

function handleUpdateSubmit(e) {
    const title  = document.getElementById('editTitle')?.value.trim();
    const amount = parseFloat(document.getElementById('editAmount')?.value);
    const date   = document.getElementById('editDate')?.value;

    if (!title || isNaN(amount) || amount <= 0 || !date) {
        if (e) e.preventDefault();
        alert('Please enter valid transaction information.');
        return;
    }
    // Form submits naturally to /transactions/update (POST)
}

function triggerDeleteFromEdit() {
    const id = document.getElementById('editTransactionId')?.value;
    closeModal('updateTransactionModal');
    if (id) openDeleteModal(id);
}

// ── CRUD: 4. DELETE ───────────────────────────────────────────────────────────

function openDeleteModal(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    document.getElementById('deleteTargetId').value         = id;
    document.getElementById('deleteTargetTitle').textContent = `"${row.dataset.title}"`;

    const amount = parseFloat(row.dataset.amount) || 0;
    const amountEl = document.getElementById('deleteTargetAmount');
    if (amountEl) amountEl.textContent = typeof formatCurrency === 'function' ? formatCurrency(amount) : amount;

    openModal('deleteTransactionModal');
}

function confirmDelete(e) {
    // Form submits naturally to /transactions/delete/{id} (POST)
    // Nothing to prevent — just allow the form submission
}
