package com.example.demo.repository;

import com.example.demo.model.Budget;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findTopByUserOrderByIdDesc(User user);
    Optional<Budget> findByUserAndMonthYear(User user, String monthYear);
    List<Budget> findByUser(User user);
    void deleteAllByUser(User user);
}
