/**
 * CashCount System - Transactions & Table Management Module
 * Handles search, category filtering, type filtering, table rendering, and pagination.
 */

// Category Badge Styling Tokens
const categoryBadgeClasses = {
    'Food & Dining': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'Utilities': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'Transportation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'Housing': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    'Entertainment': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    'Salary': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    'Freelance': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    'Shopping': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    'Healthcare': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
};

// Filter & Pagination State
let searchQuery = '';
let selectedType = 'ALL';
let selectedCategories = new Set();
let currentPage = 1;
const itemsPerPage = 10;

// Filter Evaluation
function getFilteredTransactions() {
    if (!Array.isArray(transactions)) return [];

    return transactions.filter(item => {
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const matchTitle = (item.title || '').toLowerCase().includes(q);
            const matchCategory = (item.category || '').toLowerCase().includes(q);
            const matchNotes = (item.notes || '').toLowerCase().includes(q);
            const matchAmount = (item.amount || '').toString().includes(q);
            if (!matchTitle && !matchCategory && !matchNotes && !matchAmount) {
                return false;
            }
        }

        if (selectedType !== 'ALL' && item.type !== selectedType) {
            return false;
        }

        if (selectedCategories.size > 0 && !selectedCategories.has(item.category)) {
            return false;
        }

        return true;
    });
}

function handleSearch(val) {
    searchQuery = val;
    currentPage = 1;
    renderTable();
}

function handleTypeFilter(type) {
    selectedType = type;
    currentPage = 1;
    renderTable();
}

function toggleCategoryFilter(category, isChecked) {
    if (isChecked) {
        selectedCategories.add(category);
    } else {
        selectedCategories.delete(category);
    }
    currentPage = 1;
    renderTable();
}

function clearCategoryFilters() {
    selectedCategories.clear();
    const checkboxes = document.querySelectorAll('#filterCategoryList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    currentPage = 1;
    renderTable();
}

function renderCategoryFilterOptions() {
    const container = document.getElementById('filterCategoryList');
    if (!container) return;

    const allCategories = ['Food & Dining', 'Utilities', 'Transportation', 'Housing', 'Entertainment', 'Salary', 'Freelance', 'Shopping', 'Healthcare', 'Other'];
    container.innerHTML = allCategories.map((cat, idx) => `
        <li class="flex items-center">
            <input id="cat-filter-${idx}" type="checkbox" value="${cat}" onchange="toggleCategoryFilter('${cat}', this.checked)" class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500">
            <label for="cat-filter-${idx}" class="ml-2 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none">${cat}</label>
        </li>
    `).join('');
}

// Table Rendering & Pagination
function renderTable() {
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;

    const filtered = getFilteredTransactions();
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

    if (paginatedItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex flex-col items-center justify-center space-y-2">
                        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span class="text-base font-semibold text-gray-700 dark:text-gray-300">No transactions found</span>
                        <span class="text-xs text-gray-500">Try adjusting your search query or filters, or add a new transaction.</span>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = paginatedItems.map(item => {
            const isIncome = item.type === 'INCOME';
            const categoryClass = categoryBadgeClasses[item.category] || categoryBadgeClasses['Other'];
            const typeBadge = isIncome 
                ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">+ Income</span>`
                : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">- Expense</span>`;

            const amountDisplay = isIncome 
                ? `<span class="font-bold text-emerald-600 dark:text-emerald-400">+ ${formatCurrency(item.amount)}</span>`
                : `<span class="font-bold text-red-600 dark:text-red-400">- ${formatCurrency(item.amount)}</span>`;

            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td class="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        <div class="flex items-center space-x-3">
                            <div class="p-2 rounded-lg ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'} flex-shrink-0">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    ${isIncome 
                                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>' 
                                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path>'}
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-white">${escapeHtml(item.title)}</div>
                                ${item.notes ? `<div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">${escapeHtml(item.notes)}</div>` : ''}
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">
                        <span class="px-2.5 py-1 text-xs font-medium rounded-md border ${categoryClass}">
                            ${escapeHtml(item.category)}
                        </span>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">${typeBadge}</td>
                    <td class="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">${formatDate(item.date)}</td>
                    <td class="px-4 py-3.5 whitespace-nowrap">${amountDisplay}</td>
                    <td class="px-4 py-3.5 whitespace-nowrap text-right text-sm">
                        <div class="inline-flex items-center space-x-1">
                            <button type="button" onclick="openReadModal('${item.id}')" title="Preview Details" class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700 rounded-lg transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            </button>
                            <button type="button" onclick="openUpdateModal('${item.id}')" title="Edit Transaction" class="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:bg-gray-700 rounded-lg transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button type="button" onclick="openDeleteModal('${item.id}')" title="Delete Transaction" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Pagination numbers
    const showingRangeEl = document.getElementById('showingRange');
    const totalCountEl = document.getElementById('totalCount');
    if (showingRangeEl && totalCountEl) {
        if (totalCount === 0) {
            showingRangeEl.textContent = '0';
        } else {
            const from = startIndex + 1;
            const to = Math.min(startIndex + itemsPerPage, totalCount);
            showingRangeEl.textContent = `${from}-${to}`;
        }
        totalCountEl.textContent = totalCount;
    }

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const list = document.getElementById('paginationList');
    if (!list) return;

    if (totalPages <= 1) {
        list.innerHTML = '';
        return;
    }

    let html = `
        <li>
            <button type="button" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                <span class="sr-only">Previous</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        const isActive = (i === currentPage);
        html += `
            <li>
                <button type="button" onclick="goToPage(${i})" class="flex items-center justify-center text-sm py-2 px-3 leading-tight ${isActive 
                    ? 'text-blue-600 bg-blue-50 border border-blue-300 font-bold dark:border-gray-700 dark:bg-gray-700 dark:text-white' 
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}">
                    ${i}
                </button>
            </li>
        `;
    }

    html += `
        <li>
            <button type="button" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                <span class="sr-only">Next</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        </li>
    `;

    list.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderTable();
}
