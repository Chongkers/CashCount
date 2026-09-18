package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/")
    public String root() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String showLoginForm() {
        return "login"; 
    }

    @PostMapping("/login")
    public String processLogin(@RequestParam(required = false) String email, 
                               @RequestParam(required = false) String password) {
        // Redirect to dashboard controller
        return "redirect:/dashboard";
    }

    @GetMapping("/signup")
    public String showSignupForm() {
        return "signup"; 
    }

    @GetMapping("/forgot")
    public String showForgotForm() {
        return "forgot"; 
    }

    // New method to handle form submission
    @PostMapping("/signup")
    public String registerUser(@RequestParam String email, @RequestParam String password) {
        User newUser = new User();
        newUser.setUsername(email);
        newUser.setPassword(password); // Note: For a real app, passwords should be encrypted
        userRepository.save(newUser);
        
        return "redirect:/login"; // Redirects to the login page after successful registration
    }
}