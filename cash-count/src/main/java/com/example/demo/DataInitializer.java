package com.example.demo;

import com.example.demo.model.Budget;
import com.example.demo.model.Transaction;
import com.example.demo.model.User;
import com.example.demo.repository.BudgetRepository;
import com.example.demo.repository.TransactionRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    public DataInitializer(UserRepository userRepository, 
                           TransactionRepository transactionRepository, 
                           BudgetRepository budgetRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
    }

    @Override
    public void run(String... args) {
        // Seed default demo user if not existing
        String demoEmail = "demo@cashcount.com";
        User user = userRepository.findByUsername(demoEmail);
        if (user == null) {
            user = new User();
            user.setUsername(demoEmail);
            user.setPassword("password123");
            user = userRepository.save(user);

            // Seed initial transactions
            Transaction tx1 = new Transaction();
            tx1.setUser(user);
            tx1.setTitle("Monthly Salary (1st Half)");
            tx1.setType("INCOME");
            tx1.setCategory("Salary");
            tx1.setAmount(11500.00);
            tx1.setDate(LocalDate.of(2026, 9, 1));
            transactionRepository.save(tx1);

            Transaction tx2 = new Transaction();
            tx2.setUser(user);
            tx2.setTitle("Meralco Electricity Bill");
            tx2.setType("EXPENSE");
            tx2.setCategory("Utilities");
            tx2.setAmount(2100.00);
            tx2.setDate(LocalDate.of(2026, 9, 5));
            transactionRepository.save(tx2);

            Transaction tx3 = new Transaction();
            tx3.setUser(user);
            tx3.setTitle("Puregold Grocery Supplies");
            tx3.setType("EXPENSE");
            tx3.setCategory("Food & Dining");
            tx3.setAmount(1200.00);
            tx3.setDate(LocalDate.of(2026, 9, 8));
            transactionRepository.save(tx3);

            Transaction tx4 = new Transaction();
            tx4.setUser(user);
            tx4.setTitle("Shell Fuel Refill");
            tx4.setType("EXPENSE");
            tx4.setCategory("Transportation");
            tx4.setAmount(500.00);
            tx4.setDate(LocalDate.of(2026, 9, 11));
            transactionRepository.save(tx4);

            Transaction tx5 = new Transaction();
            tx5.setUser(user);
            tx5.setTitle("Spotify & Streaming Services");
            tx5.setType("EXPENSE");
            tx5.setCategory("Entertainment");
            tx5.setAmount(200.00);
            tx5.setDate(LocalDate.of(2026, 9, 14));
            transactionRepository.save(tx5);

            // Seed initial budget
            Budget budget = new Budget();
            budget.setUser(user);
            budget.setMonthYear("September 2026");
            budget.setTargetAmount(5000.00);
            budgetRepository.save(budget);
        }
    }
}
