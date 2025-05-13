package com.example.demo.restcontroller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
public class authRestController {
	
	
	@GetMapping("api/test")
	public String getTest() {
		return "This is test";
	}
	

}
