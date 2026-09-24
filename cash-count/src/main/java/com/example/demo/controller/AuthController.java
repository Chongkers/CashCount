package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping("/")
    public String root() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String showLoginForm(HttpSession session) {
        // If already logged in, go straight to dashboard
        if (session.getAttribute("userId") != null) {
            return "redirect:/dashboard";
        }
        return "login";
    }

    @PostMapping("/login")
    public String processLogin(@RequestParam(required = false) String email,
                               @RequestParam(required = false) String password,
                               HttpSession session,
                               Model model) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            model.addAttribute("errorMessage", "Please enter your email and password.");
            return "login";
        }

        User user = userRepository.findByUsername(email.trim().toLowerCase());
        if (user == null) {
            model.addAttribute("errorMessage", "No account found with that email address.");
            model.addAttribute("lastEmail", email);
            return "login";
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            model.addAttribute("errorMessage", "Incorrect password. Please try again.");
            model.addAttribute("lastEmail", email);
            return "login";
        }

        // Login successful — store user ID in session
        session.setAttribute("userId", user.getId());
        session.setMaxInactiveInterval(60 * 60); // 1 hour session timeout
        return "redirect:/dashboard";
    }

    @GetMapping("/signup")
    public String showSignupForm(HttpSession session) {
        if (session.getAttribute("userId") != null) {
            return "redirect:/dashboard";
        }
        return "signup";
    }

    @PostMapping("/signup")
    public String registerUser(@RequestParam String email,
                               @RequestParam String password,
                               RedirectAttributes ra,
                               Model model) {
        String normalizedEmail = email.trim().toLowerCase();

        // Check if account already exists
        if (userRepository.findByUsername(normalizedEmail) != null) {
            model.addAttribute("errorMessage", "An account with this email already exists.");
            model.addAttribute("lastEmail", email);
            return "signup";
        }

        // Validate password length
        if (password.length() < 6) {
            model.addAttribute("errorMessage", "Password must be at least 6 characters.");
            model.addAttribute("lastEmail", email);
            return "signup";
        }

        User newUser = new User();
        newUser.setUsername(normalizedEmail);
        newUser.setPassword(passwordEncoder.encode(password));
        newUser.setSetupComplete(false); // Will trigger setup wizard on first login
        userRepository.save(newUser);

        ra.addFlashAttribute("successMessage", "Account created! Please sign in.");
        return "redirect:/login";
    }

    @GetMapping("/forgot")
    public String showForgotForm() {
        return "forgot";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}