package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * EmailService — sends transactional emails to the registered user's email address.
 * All sends are @Async so they never block the HTTP request/response cycle.
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    // ── Internal helper ───────────────────────────────────────────────────────
    @Async
    public void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("CashCount <" + fromAddress + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            // Log but never crash the app if email fails
            System.err.println("[EmailService] Failed to send to " + to + ": " + e.getMessage());
        }
    }

    // ── Welcome email (on signup) ─────────────────────────────────────────────
    @Async
    public void sendWelcome(String to) {
        String subject = "Welcome to CashCount! 🎉";
        String body = """
                Hi there,

                Your CashCount account has been created successfully.

                CashCount helps you track your income, expenses, and monthly budget
                all in one place — accessible anytime, locally on your device.

                Get started by logging in and completing your account setup.

                — The CashCount Team
                """;
        send(to, subject, body);
    }

    // ── Transaction confirmation ──────────────────────────────────────────────
    @Async
    public void sendTransactionConfirmation(String to, String type, String title,
                                            double amount, String category, String date) {
        boolean isIncome = "INCOME".equalsIgnoreCase(type);
        String subject = isIncome
                ? "✅ Income Recorded — ₱" + String.format("%,.2f", amount)
                : "📤 Expense Recorded — ₱" + String.format("%,.2f", amount);

        String body = String.format("""
                Hi,

                A transaction has been recorded in your CashCount account:

                  Type     : %s
                  Title    : %s
                  Category : %s
                  Amount   : ₱%,.2f
                  Date     : %s

                If you did not make this transaction, please review your account.

                — CashCount
                """,
                isIncome ? "Income" : "Expense",
                title,
                category,
                amount,
                date);

        send(to, subject, body);
    }

    // ── Budget warning (80 %+ used) ───────────────────────────────────────────
    @Async
    public void sendBudgetWarning(String to, double budgetLimit, double totalExpense,
                                  int budgetPct, String monthYear) {
        String subject = budgetPct >= 100
                ? "🚨 Budget Exceeded for " + monthYear
                : "⚠️ Budget Alert: " + budgetPct + "% Used for " + monthYear;

        String body = String.format("""
                Hi,

                Here is a budget update for %s:

                  Budget Limit : ₱%,.2f
                  Total Spent  : ₱%,.2f
                  Used         : %d%%

                %s

                Review your transactions at: http://localhost:8080/dashboard

                — CashCount
                """,
                monthYear,
                budgetLimit,
                totalExpense,
                budgetPct,
                budgetPct >= 100
                        ? "⚠️  You have EXCEEDED your budget. Consider reviewing your expenses."
                        : "You are approaching your budget limit. Spend carefully!");

        send(to, subject, body);
    }

    // ── Budget set confirmation ───────────────────────────────────────────────
    @Async
    public void sendBudgetSet(String to, String monthYear, double limit) {
        String subject = "📅 Budget Set for " + monthYear;
        String body = String.format("""
                Hi,

                Your monthly budget for %s has been set:

                  Budget Limit : ₱%,.2f

                CashCount will notify you when you reach 80%% and again if you exceed 100%%.

                — CashCount
                """,
                monthYear, limit);
        send(to, subject, body);
    }
}
