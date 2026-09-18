# CashCount System 💸

Managing personal finances is a common challenge for college students. CashCount is a minimalistic, server-rendered web application designed to help students log daily expenses, track income, and monitor monthly budgets in real time. 

## 🚀 Tech Stack
* **Backend:** Java 17, Spring Boot 3, Spring Web, Spring Data JPA
* **Frontend:** Thymeleaf, HTML5, Tailwind CSS, Flowbite
* **Database:** H2 Database (In-Memory) for rapid prototyping
* **Architecture:** MVC (Model-View-Controller)

## 📐 System Architecture

### Entity-Relationship Diagram (ERD)
```mermaid
erDiagram
    USER ||--o{ TRANSACTION : "logs"
    USER ||--o{ BUDGET : "sets"

    USER {
        Long id PK
        String username
        String password
    }
    BUDGET {
        Long id PK
        Double target_amount
        String month_year
        Long user_id FK
    }
    TRANSACTION {
        Long id PK
        String type
        String description
        Double amount
        String category 
        LocalDate date
        Long user_id FK
    }
