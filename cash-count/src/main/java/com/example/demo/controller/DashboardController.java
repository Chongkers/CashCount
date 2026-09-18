package com.example.demo.controller;

import com.example.demo.model.Budget;
import com.example.demo.model.Transaction;
import com.example.demo.model.User;
import com.example.demo.repository.BudgetRepository;
import com.example.demo.repository.TransactionRepository;
import com.example.demo.repository.UserRepository;
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

    private User getOrCreateDemoUser() {
        String username = "demo@cashcount.com";
        User user = userRepository.findByUsername(username);
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setPassword("password123");
            user = userRepository.save(user);
        }
        return user;
    }

    @GetMapping("/dashboard")
    public String showDashboard(Model model) {
        User user = getOrCreateDemoUser();
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

        // ── Model attributes ──────────────────────────────────────────────────
        // Transactions: passed directly — Thymeleaf renders rows, no JSON serialization
        model.addAttribute("transactions",    transactions);
        model.addAttribute("categoryClasses", CATEGORY_CLASSES);

        // Pre-formatted strings (used in Thymeleaf pipe literals like |₱ ${totalBalance}|)
        model.addAttribute("totalBalance",    String.format("%,.2f", totalBalance));
        model.addAttribute("totalIncome",     String.format("%,.2f", totalIncome));
        model.addAttribute("totalExpense",    String.format("%,.2f", totalExpense));
        model.addAttribute("budgetLimit",     String.format("%,.2f", budgetLimit));
        model.addAttribute("budgetRemaining", String.format("%,.2f", budgetRemaining));

        // Raw values for data-* attributes (used by JS budget modal pre-fill)
        model.addAttribute("budgetLimitRaw", budgetLimit);
        model.addAttribute("budgetPercent",  budgetPercent);
        model.addAttribute("budgetMonth",    budgetMonth);
        model.addAttribute("budgetYear",     budgetYear);
        model.addAttribute("budgetMonthYear", budget != null ? budget.getMonthYear() : "Monthly Budget");
        model.addAttribute("budget",         budget);

        return "dashboard";
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
                                 RedirectAttributes ra) {
        String txType = createType != null ? createType : (type != null ? type : "EXPENSE");
        User user = getOrCreateDemoUser();

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
        ra.addFlashAttribute("successMessage", "Transaction added successfully!");
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
                                    RedirectAttributes ra) {
        Transaction tx = transactionRepository.findById(id).orElse(null);
        if (tx != null) {
            tx.setTitle(title);
            tx.setType(type);
            tx.setCategory(category);
            tx.setAmount(amount);
            tx.setNotes(notes);
            try { tx.setDate(LocalDate.parse(date)); } catch (Exception e) { tx.setDate(LocalDate.now()); }
            transactionRepository.save(tx);
            ra.addFlashAttribute("successMessage", "Transaction updated successfully!");
        }
        return "redirect:/dashboard";
    }

    // ── Delete Transaction ────────────────────────────────────────────────────
    @PostMapping({"/transactions/delete/{id}", "/transactions/delete"})
    public String deleteTransaction(@PathVariable(required = false) Long id,
                                    @RequestParam(value = "id", required = false) Long paramId,
                                    RedirectAttributes ra) {
        Long targetId = id != null ? id : paramId;
        if (targetId != null) {
            transactionRepository.deleteById(targetId);
            ra.addFlashAttribute("successMessage", "Transaction deleted successfully!");
        }
        return "redirect:/dashboard";
    }

    // ── Set / Edit Budget ─────────────────────────────────────────────────────
    @PostMapping("/budget/set")
    public String setBudget(@RequestParam String month,
                            @RequestParam Integer year,
                            @RequestParam Double limit,
                            RedirectAttributes ra) {
        User user = getOrCreateDemoUser();
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
                                        RedirectAttributes ra) {
        ra.addFlashAttribute("successMessage", "Maintaining balance reference updated!");
        return "redirect:/dashboard";
    }

    // ── Clear All Data (prototype reset) ──────────────────────────────────────
    @Transactional
    @PostMapping("/data/clear")
    public String clearAllData(RedirectAttributes ra) {
        User user = getOrCreateDemoUser();
        transactionRepository.deleteAllByUser(user);
        budgetRepository.deleteAllByUser(user);
        ra.addFlashAttribute("successMessage", "All data cleared. Start fresh!");
        return "redirect:/dashboard";
    }
}
