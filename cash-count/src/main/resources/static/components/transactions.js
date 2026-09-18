/**
 * CashCount System - Transactions Module
 *
 * Role: Search, filter, and paginate the server-rendered transaction rows.
 * All <tr class="tx-row"> elements are already in the DOM from Thymeleaf.
 * This module only shows/hides rows — it never re-renders HTML.
 */

let searchQuery      = '';
let selectedType     = 'ALL';
let selectedCategories = new Set();
let currentPage      = 1;
const ITEMS_PER_PAGE = 10;

// ── Row Access ────────────────────────────────────────────────────────────────

function getAllRows() {
    return Array.from(document.querySelectorAll('#transactionTableBody tr.tx-row'));
}

// ── Filter Logic ──────────────────────────────────────────────────────────────

function getFilteredRows() {
    return getAllRows().filter(row => {
        // Type filter
        if (selectedType !== 'ALL' && row.dataset.type !== selectedType) return false;
        // Category filter (multi-select)
        if (selectedCategories.size > 0 && !selectedCategories.has(row.dataset.category)) return false;
        // Search filter (title, category, notes)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const text = [row.dataset.title, row.dataset.category, row.dataset.notes || '']
                .join(' ').toLowerCase();
            if (!text.includes(q)) return false;
        }
        return true;
    });
}

function applyAllFilters() {
    currentPage = 1;
    renderVisibleRows();
}

// ── Render (show/hide rows + pagination) ──────────────────────────────────────

function renderVisibleRows() {
    const allRows  = getAllRows();
    const filtered = getFilteredRows();
    const total    = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1)          currentPage = 1;

    const start   = (currentPage - 1) * ITEMS_PER_PAGE;
    const visible = new Set(filtered.slice(start, start + ITEMS_PER_PAGE));

    allRows.forEach(row => {
        row.style.display = visible.has(row) ? '' : 'none';
    });

    // JS empty state row
    const jsEmpty = document.getElementById('jsEmptyStateRow');
    if (jsEmpty) {
        // Show JS empty state only when there are rows in DOM but filter gives 0 results
        jsEmpty.style.display = (allRows.length > 0 && total === 0) ? '' : 'none';
    }

    // Pagination info text
    const rangeEl = document.getElementById('showingRange');
    const totalEl = document.getElementById('totalCount');
    if (rangeEl && totalEl) {
        if (total === 0) {
            rangeEl.textContent = '0';
        } else {
            rangeEl.textContent = `${start + 1}-${Math.min(start + ITEMS_PER_PAGE, total)}`;
        }
        totalEl.textContent = total;
    }

    renderPaginationControls(totalPages, total);
}

// ── Pagination Controls ───────────────────────────────────────────────────────

function renderPaginationControls(totalPages, totalCount) {
    const list = document.getElementById('paginationList');
    if (!list) return;

    if (totalPages <= 1 || totalCount === 0) {
        list.innerHTML = '';
        return;
    }

    const btnBase = 'flex items-center justify-center text-sm py-2 px-3 leading-tight border';
    const btnActive = `${btnBase} text-blue-600 bg-blue-50 border-blue-300 font-bold dark:border-gray-700 dark:bg-gray-700 dark:text-white`;
    const btnInactive = `${btnBase} text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`;
    const btnArrow = 'flex items-center justify-center h-full py-1.5 px-3 text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed';

    let html = `<li>
        <button type="button" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"
            class="${btnArrow} rounded-l-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
        </button>
    </li>`;

    // Smart page range (show max 5 pages)
    let start = Math.max(1, currentPage - 2);
    let end   = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
        html += `<li><button type="button" onclick="goToPage(${i})" class="${i === currentPage ? btnActive : btnInactive}">${i}</button></li>`;
    }

    html += `<li>
        <button type="button" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"
            class="${btnArrow} rounded-r-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        </button>
    </li>`;

    list.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderVisibleRows();
}

// ── Public Event Handlers (called from dashboard.html inline events) ──────────

function handleSearch(val) {
    searchQuery = val;
    currentPage = 1;
    renderVisibleRows();
}

function handleTypeFilter(type) {
    selectedType = type;
    applyAllFilters();
}

function toggleCategoryFilter(category, isChecked) {
    if (isChecked) selectedCategories.add(category);
    else selectedCategories.delete(category);
    applyAllFilters();
}

function clearCategoryFilters() {
    selectedCategories.clear();
    document.querySelectorAll('#filterCategoryList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    applyAllFilters();
}

// ── Category Filter Checkboxes ────────────────────────────────────────────────

function renderCategoryFilterOptions() {
    const container = document.getElementById('filterCategoryList');
    if (!container) return;

    const categories = [
        'Food & Dining','Utilities','Transportation','Housing',
        'Entertainment','Salary','Freelance','Shopping','Healthcare','Other'
    ];

    container.innerHTML = categories.map((cat, idx) => `
        <li class="flex items-center">
            <input id="cat-filter-${idx}" type="checkbox" value="${escapeHtml(cat)}"
                   onchange="toggleCategoryFilter('${escapeHtml(cat)}', this.checked)"
                   class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500">
            <label for="cat-filter-${idx}"
                   class="ml-2 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none">
                ${escapeHtml(cat)}
            </label>
        </li>
    `).join('');
}

// ── Init (called from dashboard.js initDashboard) ─────────────────────────────

function initTableInteractivity() {
    renderCategoryFilterOptions();
    renderVisibleRows();
}
