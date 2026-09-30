package com.example.demo.controller;

import com.example.demo.model.Budget;
import com.example.demo.model.Transaction;
import com.example.demo.model.User;
import com.example.demo.repository.BudgetRepository;
import com.example.demo.repository.TransactionRepository;
import com.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Controller
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    // ── Category badge CSS classes map (passed to Thymeleaf for server-side rendering) ──
    private static final Map<String, String> CATEGORY_CLASSES;
    static {
        CATEGORY_CLASSES = new LinkedHashMap<>();
        CATEGORY_CLASSES.put("Food & Dining",  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800");
        CATEGORY_CLASSES.put("Utilities",      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800");
        CATEGORY_CLASSES.put("Transportation", "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800");
        CATEGORY_CLASSES.put("Housing",        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800");
        CATEGORY_CLASSES.put("Entertainment",  "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800");
        CATEGORY_CLASSES.put("Salary",         "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800");
        CATEGORY_CLASSES.put("Freelance",      "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800");
        CATEGORY_CLASSES.put("Shopping",       "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800");
        CATEGORY_CLASSES.put("Healthcare",     "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800");
        CATEGORY_CLASSES.put("Other",          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600");
    }

    /**
     * Gets the logged-in user from session, or returns null if not authenticated.
     */
    private User getLoggedInUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    @GetMapping("/dashboard")
    public String showDashboard(HttpSession session, Model model) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        List<Transaction> transactions = transactionRepository.findByUserOrderByDateDesc(user);

        // ── Compute totals ────────────────────────────────────────────────────
        double totalIncome = 0;
        double totalExpense = 0;
        for (Transaction t : transactions) {
            double amt = t.getAmount() != null ? t.getAmount() : 0.0;
            if ("INCOME".equalsIgnoreCase(t.getType())) totalIncome += amt;
            else totalExpense += amt;
        }
        double totalBalance = Math.max(0.0, totalIncome - totalExpense);

        // ── Budget ────────────────────────────────────────────────────────────
        Budget budget = budgetRepository.findTopByUserOrderByIdDesc(user).orElse(null);
        double budgetLimit = budget != null && budget.getTargetAmount() != null ? budget.getTargetAmount() : 0.0;
        int budgetPercent = budgetLimit > 0 ? (int) Math.round((totalExpense / budgetLimit) * 100) : 0;
        double budgetRemaining = budgetLimit - totalExpense;

        String budgetMonth = "September";
        String budgetYear  = String.valueOf(LocalDate.now().getYear());
        if (budget != null && budget.getMonthYear() != null) {
            String[] parts = budget.getMonthYear().split(" ");
            budgetMonth = parts[0];
            if (parts.length > 1) budgetYear = parts[1];
        }

        // ── Setup wizard flag ─────────────────────────────────────────────────
        model.addAttribute("showSetupWizard", !user.isSetupComplete());

        // ── Model attributes ──────────────────────────────────────────────────
        model.addAttribute("transactions",    transactions);
        model.addAttribute("categoryClasses", CATEGORY_CLASSES);

        // Pre-formatted strings (used in Thymeleaf pipe literals like |₱ ${totalBalance}|)
        model.addAttribute("totalBalance",    String.format("%,.2f", totalBalance));
        model.addAttribute("totalIncome",     String.format("%,.2f", totalIncome));
        model.addAttribute("totalExpense",    String.format("%,.2f", totalExpense));
        model.addAttribute("budgetLimit",     String.format("%,.2f", budgetLimit));
        model.addAttribute("budgetRemaining", String.format("%,.2f", budgetRemaining));

        // Raw numeric values for JS notification logic and data-* attributes
        model.addAttribute("totalBalanceRaw", totalBalance);
        model.addAttribute("budgetLimitRaw",  budgetLimit);
        model.addAttribute("budgetPercent",   budgetPercent);
        model.addAttribute("budgetMonth",     budgetMonth);
        model.addAttribute("budgetYear",      budgetYear);
        model.addAttribute("budgetMonthYear", budget != null ? budget.getMonthYear() : "Monthly Budget");
        model.addAttribute("budget",          budget);

        // ── Notification flags ─────────────────────────────────────────────────
        // showTxSuccess is set as a flash attribute by POST handlers
        Boolean showTxSuccess = (Boolean) model.asMap().getOrDefault("showTxSuccess", Boolean.FALSE);
        boolean lowBalance    = totalBalance < 1000.0 && Boolean.TRUE.equals(showTxSuccess);
        boolean overBudget    = budgetLimit > 0 && totalExpense > budgetLimit && Boolean.TRUE.equals(showTxSuccess);
        model.addAttribute("showTxSuccess",  showTxSuccess);
        model.addAttribute("showLowBalance", lowBalance);
        model.addAttribute("showOverBudget", overBudget);
        // Defaults for notification fields not set via flash (dashboard direct visit)
        if (!model.containsAttribute("lastTxType"))   model.addAttribute("lastTxType",   null);
        if (!model.containsAttribute("lastTxAmount")) model.addAttribute("lastTxAmount", null);

        // User info for navbar
        model.addAttribute("userEmail", user.getUsername());

        return "dashboard";
    }

    // ── First-Time Setup ──────────────────────────────────────────────────────
    @PostMapping("/setup/complete")
    public String completeSetup(@RequestParam Double balance,
                                @RequestParam String month,
                                @RequestParam Integer year,
                                @RequestParam Double budgetLimit,
                                HttpSession session,
                                RedirectAttributes ra) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        // Create initial income transaction for the maintaining balance
        Transaction initialDeposit = new Transaction();
        initialDeposit.setUser(user);
        initialDeposit.setTitle("Initial Maintaining Balance");
        initialDeposit.setType("INCOME");
        initialDeposit.setCategory("Salary");
        initialDeposit.setAmount(balance);
        initialDeposit.setDate(LocalDate.now());
        initialDeposit.setNotes("Starting balance set during account setup");
        transactionRepository.save(initialDeposit);

        // Create budget
        String monthYear = month + " " + year;
        Budget budget = new Budget();
        budget.setUser(user);
        budget.setMonthYear(monthYear);
        budget.setTargetAmount(budgetLimit);
        budgetRepository.save(budget);

        // Mark setup as complete
        user.setSetupComplete(true);
        userRepository.save(user);

        ra.addFlashAttribute("successMessage", "Welcome to CashCount! Your account is all set up.");
        return "redirect:/dashboard";
    }

    // ── Add Transaction ───────────────────────────────────────────────────────
    @PostMapping("/transactions/add")
    public String addTransaction(@RequestParam String title,
                                 @RequestParam(value = "createType", required = false) String createType,
                                 @RequestParam(value = "type",       required = false) String type,
                                 @RequestParam String category,
                                 @RequestParam Double amount,
                                 @RequestParam String date,
                                 @RequestParam(required = false) String notes,
                                 HttpSession session,
                                 RedirectAttributes ra) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        String txType = createType != null ? createType : (type != null ? type : "EXPENSE");

        // Server-side negative balance guard
        List<Transaction> existing = transactionRepository.findByUser(user);
        double income = 0, expense = 0;
        for (Transaction t : existing) {
            double a = t.getAmount() != null ? t.getAmount() : 0.0;
            if ("INCOME".equalsIgnoreCase(t.getType())) income += a;
            else expense += a;
        }
        double currentBalance = Math.max(0.0, income - expense);

        if ("EXPENSE".equalsIgnoreCase(txType) && amount > currentBalance) {
            ra.addFlashAttribute("errorMessage",
                "Transaction Rejected: Expense exceeds current maintaining balance. Balance cannot be negative.");
            return "redirect:/dashboard";
        }

        Transaction tx = new Transaction();
        tx.setUser(user);
        tx.setTitle(title);
        tx.setType(txType);
        tx.setCategory(category);
        tx.setAmount(amount);
        tx.setNotes(notes);
        try { tx.setDate(LocalDate.parse(date)); } catch (Exception e) { tx.setDate(LocalDate.now()); }

        transactionRepository.save(tx);
        ra.addFlashAttribute("successMessage", txType.equals("INCOME") ? "Income recorded successfully!" : "Expense recorded successfully!");
        ra.addFlashAttribute("showTxSuccess",  Boolean.TRUE);
        ra.addFlashAttribute("lastTxType",     txType);
        ra.addFlashAttribute("lastTxAmount",   amount);
        return "redirect:/dashboard";
    }

    // ── Update Transaction ────────────────────────────────────────────────────
    @PostMapping("/transactions/update")
    public String updateTransaction(@RequestParam Long id,
                                    @RequestParam String title,
                                    @RequestParam String type,
                                    @RequestParam String category,
                                    @RequestParam Double amount,
                                    @RequestParam String date,
                                    @RequestParam(required = false) String notes,
                                    HttpSession session,
                                    RedirectAttributes ra) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        Transaction tx = transactionRepository.findById(id).orElse(null);
        if (tx != null && tx.getUser().getId().equals(user.getId())) {
            tx.setTitle(title);
            tx.setType(type);
            tx.setCategory(category);
            tx.setAmount(amount);
            tx.setNotes(notes);
            try { tx.setDate(LocalDate.parse(date)); } catch (Exception e) { tx.setDate(LocalDate.now()); }
            transactionRepository.save(tx);
            ra.addFlashAttribute("successMessage", "Transaction updated successfully!");
            ra.addFlashAttribute("showTxSuccess",  Boolean.TRUE);
            ra.addFlashAttribute("lastTxType",     type);
            ra.addFlashAttribute("lastTxAmount",   amount);
        }
        return "redirect:/dashboard";
    }

    // ── Delete Transaction ────────────────────────────────────────────────────
    @PostMapping({"/transactions/delete/{id}", "/transactions/delete"})
    public String deleteTransaction(@PathVariable(required = false) Long id,
                                    @RequestParam(value = "id", required = false) Long paramId,
                                    HttpSession session,
                                    RedirectAttributes ra) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        Long targetId = id != null ? id : paramId;
        if (targetId != null) {
            Transaction tx = transactionRepository.findById(targetId).orElse(null);
            if (tx != null && tx.getUser().getId().equals(user.getId())) {
                transactionRepository.deleteById(targetId);
                ra.addFlashAttribute("successMessage", "Transaction deleted successfully!");
                ra.addFlashAttribute("showTxSuccess",  Boolean.TRUE);
            }
        }
        return "redirect:/dashboard";
    }

    // ── Set / Edit Budget ─────────────────────────────────────────────────────
    @PostMapping("/budget/set")
    public String setBudget(@RequestParam String month,
                            @RequestParam Integer year,
                            @RequestParam Double limit,
                            HttpSession session,
                            RedirectAttributes ra) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        String monthYear = month + " " + year;
        Budget budget = budgetRepository.findByUserAndMonthYear(user, monthYear).orElse(new Budget());
        budget.setUser(user);
        budget.setMonthYear(monthYear);
        budget.setTargetAmount(limit);
        budgetRepository.save(budget);
        ra.addFlashAttribute("successMessage", "Monthly budget set for " + monthYear + "!");
        return "redirect:/dashboard";
    }

    // ── Set Maintaining Balance (informational only — balance is computed from transactions) ──
    @PostMapping("/balance/set")
    public String setMaintainingBalance(@RequestParam(required = false) Double balance,
                                        @RequestParam(required = false) Double baseBalance,
                                        HttpSession session,
                                        RedirectAttributes ra) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        ra.addFlashAttribute("successMessage", "Maintaining balance reference updated!");
        return "redirect:/dashboard";
    }

    // ── Clear All Data (prototype reset) ──────────────────────────────────────
    @Transactional
    @PostMapping("/data/clear")
    public String clearAllData(HttpSession session, RedirectAttributes ra) {
        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        transactionRepository.deleteAllByUser(user);
        budgetRepository.deleteAllByUser(user);

        // Reset setup state so wizard shows again
        user.setSetupComplete(false);
        userRepository.save(user);

        ra.addFlashAttribute("successMessage", "All data cleared. Start fresh!");
        return "redirect:/dashboard";
    }

    // ── Monthly Report Page ────────────────────────────────────────────────────
    @GetMapping("/report")
    public String showReport(HttpSession session, Model model,
                             jakarta.servlet.http.HttpServletResponse response) {
        // Always serve fresh data — never let the browser cache this page
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setDateHeader("Expires", 0);

        User user = getLoggedInUser(session);
        if (user == null) return "redirect:/login";

        // Always fetch the latest list directly from DB (no caching)
        List<Transaction> allTransactions = transactionRepository.findByUserOrderByDateDesc(user);

        // Budget data (for label + limit display only)
        Budget budget = budgetRepository.findTopByUserOrderByIdDesc(user).orElse(null);
        String budgetMonthYear = budget != null ? budget.getMonthYear() : null;
        double budgetLimit     = budget != null && budget.getTargetAmount() != null ? budget.getTargetAmount() : 0.0;

        // Always use ALL transactions — no month filter so nothing gets missed
        double totalIncome  = allTransactions.stream()
                                .filter(t -> "INCOME".equalsIgnoreCase(t.getType()))
                                .mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0).sum();
        double totalExpense = allTransactions.stream()
                                .filter(t -> !"INCOME".equalsIgnoreCase(t.getType()))
                                .mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0).sum();
        double netBalance   = totalIncome - totalExpense;
        int    budgetPct    = budgetLimit > 0 ? (int) Math.round((totalExpense / budgetLimit) * 100) : 0;

        model.addAttribute("reportTransactions",    allTransactions);
        model.addAttribute("categoryClasses",       CATEGORY_CLASSES);
        model.addAttribute("reportMonthYear",       budgetMonthYear != null ? budgetMonthYear : "All Transactions");
        model.addAttribute("reportTotalIncome",     String.format("%,.2f", totalIncome));
        model.addAttribute("reportTotalExpense",    String.format("%,.2f", totalExpense));
        model.addAttribute("reportNetBalance",      String.format("%,.2f", netBalance));
        model.addAttribute("reportBudgetLimit",     String.format("%,.2f", budgetLimit));
        model.addAttribute("reportBudgetPct",       budgetPct);
        model.addAttribute("reportGeneratedAt",     LocalDate.now().toString());
        model.addAttribute("userEmail",             user.getUsername());

        return "report";
    }
}
