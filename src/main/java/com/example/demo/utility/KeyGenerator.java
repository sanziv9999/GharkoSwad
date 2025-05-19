package com.example.demo.utility;
import java.security.SecureRandom;
import java.util.Base64;

public class KeyGenerator {
	public static void main(String[] args) {
        byte[] key = new byte[64]; // 64 bytes = 512 bits
        new SecureRandom().nextBytes(key);
        String base64Key = Base64.getEncoder().encodeToString(key);
        System.out.println("New JWT Secret: " + base64Key);
    }

}
