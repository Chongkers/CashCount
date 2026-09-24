# CashCount System 💸

Managing personal finances is a common challenge for college students. CashCount is a modern, server-rendered web application designed to help students log daily expenses, track income, and monitor monthly budgets in real time.

> 📖 **Full Documentation Guide:** Please refer to [`DOCUMENTATION.md`](DOCUMENTATION.md) for complete technical architecture, H2 database details, business rules, and API endpoints.

---

## 🚀 Tech Stack
* **Backend:** Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA
* **Frontend:** Thymeleaf, HTML5, Tailwind CSS, Flowbite
* **Database:** H2 Database (In-Memory) — *No installation or database creation required!*
* **Architecture:** MVC (Model-View-Controller)

---

## ⚡ Quick Start

### 1-Click Launch (Recommended)
Double-click **`start.bat`** in the project root folder. It will:
1. Detect Java JDK 21 automatically.
2. Start the Spring Boot backend.
3. Automatically open your browser to **`http://localhost:8080/dashboard`**.

### Manual Command Line
```powershell
cd CashCount\cash-count
.\gradlew.bat bootRun
```
Then visit: `http://localhost:8080/dashboard`

---

## 📌 Prototype Note: H2 Database & Default Mock Data
* The database is an **in-memory H2 database** (`jdbc:h2:mem:cashcountdb`) running in RAM.
* Table creation and default mock transactions (User `demo@cashcount.com`, ₱7,500 maintaining balance, and ₱5,000 budget) are **automatically generated and seeded** upon startup by `DataInitializer.java`.
* To reset the prototype to its default state, simply restart the application.
* Live database console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:cashcountdb`, User: `sa`, Password: empty).
