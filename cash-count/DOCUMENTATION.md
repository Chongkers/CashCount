# 📘 CashCount System — Prototype Documentation Guide

> **Personal Finance & Budget Management System**  
> Built with **Spring Boot 4 / Java 21**, **Thymeleaf**, **Tailwind CSS**, **Flowbite**, and **H2 In-Memory Database**.

---

## 📌 1. Essential Prototype Notice: H2 Database & Default Mock Data

> [!IMPORTANT]
> ### Zero Database Installation or Setup Required!
> - **No external database (MySQL, PostgreSQL, etc.) needs to be installed, running, or configured.**
> - The application uses an **H2 In-Memory Database** (`jdbc:h2:mem:cashcountdb`) running entirely inside Java memory.
> - When Spring Boot boots up, Hibernate automatically generates all database tables (`users`, `budget`, `transaction`) in RAM via `spring.jpa.hibernate.ddl-auto=update`.

### 🔄 Automatic Mock Data Seeding (`DataInitializer.java`)
Every time the application starts, [`DataInitializer.java`](file:///c:/Users/User/Documents/cash-count/CashCount/cash-count/src/main/java/com/example/demo/DataInitializer.java) automatically seeds a complete demo dataset into memory:

| Seeded Entity | Default Value / Record |
| :--- | :--- |
| **Demo User** | `demo@cashcount.com` (Password: `password123`) |
| **Net Maintaining Balance** | **₱ 7,500.00** (₱11,500.00 Income - ₱4,000.00 Expenses) |
| **Monthly Budget** | **₱ 5,000.00** for September 2026 |
| **Budget Usage** | **80% used** (₱4,000.00 spent of ₱5,000.00 limit $\rightarrow$ Amber badge) |
| **Transactions** | 5 pre-loaded sample transactions: |
| • *Income* | `Monthly Salary (1st Half)` — **+ ₱ 11,500.00** (Salary) |
| • *Expense* | `Meralco Electricity Bill` — **- ₱ 2,100.00** (Utilities) |
| • *Expense* | `Puregold Grocery Supplies` — **- ₱ 1,200.00** (Food & Dining) |
| • *Expense* | `Shell Fuel Refill` — **- ₱ 500.00** (Transportation) |
| • *Expense* | `Spotify & Streaming Services` — **- ₱ 200.00** (Entertainment) |

> [!TIP]
> **Restarting the server restores the default mock data.** If you modify or delete transactions during testing, simply restarting `start.bat` will reset everything back to the clean prototype state.

---

## 🔐 2. Authentication & Prototype Submission Rules

Because this project is configured as a **demonstration prototype**:

1. **Login Screen (`/login`)**:
   - **Does NOT enforce strict credentials or lock out reviewers.**
   - Evaluators or professors can type **any email and any password** (or leave default text) and click **"Sign in"** to instantly enter `/dashboard`.
2. **Sign Up Screen (`/signup`)**:
   - Accepts any registration details and simulates account creation without email verification walls.
3. **Session Behavior**:
   - The `/dashboard` automatically attaches to the pre-seeded demo user account so that all features, metrics, and transactions are immediately visible and interactive.

---

## ⚡ 3. Quick Start Guide (How to Run)

### Option A: 1-Click Launch with `start.bat` (Recommended ⭐)
1. Open the project root folder.
2. **Double-click [`start.bat`](file:///c:/Users/User/Documents/cash-count/start.bat)**.
3. The script will:
   - Auto-detect your installed Java JDK (Eclipse Adoptium 21).
   - Configure `JAVA_HOME` cleanly without path errors.
   - Run the Spring Boot backend (`gradlew.bat bootRun`).
   - **Automatically open your default browser** to `http://localhost:8080/dashboard` in ~7 seconds!

### Option B: Manual Command-Line Launch
Open PowerShell or Command Prompt in the project folder:
```powershell
cd CashCount\cash-count
.\gradlew.bat bootRun
```
Once you see `Started DemoApplication in ... seconds`, navigate to:
👉 **`http://localhost:8080/dashboard`**

### Optional: Inspecting the In-Memory Database
You can inspect the live H2 database tables directly in your browser:
- **URL**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:mem:cashcountdb`
- **Username**: `sa`
- **Password**: *(leave blank)*

---

## 🛡️ 4. Key Business Logic & Features

### 1. Total Maintaining Balance Protection (Negative Balance Guard)
- **Maintaining Balance Rule**: The total maintaining balance can **never be negative ($\ge ₱0.00$)**.
- **Guardrail Enforcement**:
  - **Client-Side:** If an expense is entered that exceeds the current clamped balance, submission is rejected immediately with an alert warning.
  - **Backend Controller:** [`DashboardController.java`](file:///c:/Users/User/Documents/cash-count/CashCount/cash-count/src/main/java/com/example/demo/controller/DashboardController.java) checks `if ("EXPENSE".equalsIgnoreCase(txType) && amount > currentBalance)`. If violated, it blocks the transaction and sends a flash error message.
- **Visual Status Badge**:
  - Balance $> 0$: `Active Balance` (Emerald green).
  - Balance $= 0$: `Depleted / Minimum` (Amber warning).

### 2. Responsive Monthly Budget & Progress Bar
- **Progress Tracking**: Shows `Spent ₱X of your ₱Y limit`.
- **Dynamic Color Thresholds**:
  - `< 80% used`: Blue progress bar and blue status badge.
  - `80% - 100% used`: Amber progress bar and amber warning badge.
  - `> 100% used`: Red progress bar, red over-limit badge, and displays `Over Limit: ₱X`.
- **Null / Unset State**:
  - If no budget is set, displays `Monthly Budget: No spending limit set`, shows a dashed placeholder bar, and prompts a `+ Set Budget` button.

### 3. Flowbite CRUD Modals
- **Create**: Add transaction with title, category, type (Income/Expense), date, and notes.
- **Read / Preview**: View full transaction card with formatted currency, category badges, and quick edit/delete buttons.
- **Update**: Edit existing transactions with re-checked balance validation.
- **Delete**: Confirmation modal before deleting any record.
- **Set Balance & Set Budget**: Modals with instant preset buttons (₱5k, ₱7.5k, ₱10k, ₱20k).

### 4. Search, Filtering & Pagination
- **Search Bar**: Real-time filtering across titles, categories, notes, and currency amounts.
- **Type Filter**: Instant toggle between `All`, `Income (+ Cash In)`, and `Expense (- Cash Out)`.
- **Category Filter Dropdown**: Multi-checkbox filtering across 10 categories (Food & Dining, Utilities, Transportation, etc.).
- **Pagination**: Paginated at 10 items per page with interactive previous/next buttons.

---

## 📁 5. Project Architecture & Modular File Structure

```
cash-count/
├── start.bat                              # 1-Click root launcher (auto Java-detect & browser launch)
├── DOCUMENTATION.md                       # This comprehensive documentation guide
└── CashCount/
    └── cash-count/
        ├── build.gradle                   # Gradle dependencies (Spring Boot 4, Thymeleaf, H2)
        ├── gradlew.bat                    # Gradle Windows wrapper
        ├── start.bat                      # Subfolder launcher backup
        └── src/
            └── main/
                ├── java/com/example/demo/
                │   ├── DemoApplication.java         # Spring Boot Entry Point
                │   ├── DataInitializer.java         # Auto-seeds default mock data in RAM
                │   ├── controller/
                │   │   ├── AuthController.java      # Login & Signup routes
                │   │   └── DashboardController.java # MVC CRUD routes & balance guard
                │   ├── model/
                │   │   ├── User.java                # JPA User Entity
                │   │   ├── Transaction.java         # JPA Transaction Entity
                │   │   └── Budget.java              # JPA Budget Entity
                │   └── repository/
                │       ├── UserRepository.java
                │       ├── TransactionRepository.java
                │       └── BudgetRepository.java
                └── resources/
                    ├── application.properties       # H2 DB & Thymeleaf configuration
                    └── templates/
                        ├── login.html               # Login page
                        ├── signup.html              # Registration page
                        ├── forgot.html              # Password recovery mock page
                        ├── dashboard.html           # Main Thymeleaf dashboard template
                        └── components/
                            ├── navbar.html          # Thymeleaf fragment: Navigation header
                            ├── hero.html            # Thymeleaf fragment: Balance & Budget Hero
                            ├── CRUD.modals.html     # Thymeleaf fragment: All 6 Flowbite modals
                            ├── footer.html          # Thymeleaf fragment: Footer
                            ├── dashboard.js         # Core state coordinator & backend data loader
                            ├── metrics.js           # Maintaining balance & budget progress bar
                            ├── transactions.js      # Search, category filter, table & pagination
                            └── modals.js            # Modal controls, CRUD forms & negative balance guard
```
