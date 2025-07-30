package com.example.demo.model;


import jakarta.persistence.Embeddable;

@Embeddable
public class Recipe {

    private String name;
    private String ingredients;
    private String instructions;
    private String cookingTime;
    private String serves;
    private String difficulty;

    // Constructors
    public Recipe() {}

    public Recipe(String name, String ingredients, String instructions, String cookingTime, String serves, String difficulty) {
        this.name = name;
        this.ingredients = ingredients;
        this.instructions = instructions;
        this.cookingTime = cookingTime;
        this.serves = serves;
        this.difficulty = difficulty;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIngredients() { return ingredients; }
    public void setIngredients(String ingredients) { this.ingredients = ingredients; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getCookingTime() { return cookingTime; }
    public void setCookingTime(String cookingTime) { this.cookingTime = cookingTime; }
    public String getServes() { return serves; }
    public void setServes(String serves) { this.serves = serves; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}