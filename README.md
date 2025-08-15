GharkoSwad
A niche food delivery and social engagement platform in Nepal focused on homecooked meals and interactive food feeds, addressing key user pain points like delivery delays and app performance.
Overview
GharkoSwad is a comprehensive platform combining a robust backend framework and an intuitive frontend interface. Built with Spring Boot, the backend offers a secure, scalable, and maintainable architecture that handles user management, order processing, media storage, and social interactions seamlessly. The frontend, built with React.js, provides a responsive and interactive user experience, showcasing homecooked meals and fostering community engagement.
Why GharkoSwad?
This project aims to streamline the development of food-centric applications with a robust, modular backend. The core features include:

Security & Authentication: JWT tokens, OTP verification, role-based access control.
Modular REST APIs: Controllers for food management, orders, payments, user profiles, and media access.
Business Logic Layer: Services managing orders, carts, payments, and user data.
Media Handling: Secure storage and retrieval of images and videos.
Social Features: Food feeds, comments, likes, fostering community engagement.
Scalable Architecture: Organized repositories and DTOs for maintainability and growth.

Tech Stack
Backend

Framework: Spring Boot
Build Tool: Maven
Database: MySQL
Security: JWT, OTP
API: RESTful with Spring MVC
Payment: eSewa (sandbox for development)

Frontend

Framework: React.js
Styling: CSS Modules / Tailwind CSS
State Management: Redux or Context API
Mapping: Leaflet.js for map and delivery tracking
API Integration: Axios or Fetch
Build Tool: Vite or Create React App

Getting Started
Prerequisites

Backend: Java 11+, Maven, MySQL
Frontend: npm or yarn (for building the React.js app)

Installation
Backend

Clone the repository:git clone https://github.com/sanziv9999/GharkoSwad.git


Navigate to the backend directory:cd GharkoSwad/backend


Install dependencies and set up the database:
Configure application.properties with MySQL details.
Run database migrations or scripts if provided.


Start the server:mvn spring-boot:run



Frontend

Navigate to the frontend directory:
cd GharkoSwad/frontend


Install dependencies:
npm install

or
yarn install


Start the development server:
npm start

or
yarn start


Open your browser and visit http://localhost:3000 to view the app. The frontend will connect to the backend at http://localhost:8080/api.


Environment Variables
Backend
Create application.properties in backend/src/main/resources:
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/gharkoswad
spring.datasource.username=your_username
spring.datasource.password=your_password
jwt.secret=your_jwt_secret_key
esewa.sandbox.merchant_code=your_merchant_code
esewa.sandbox.merchant_key=your_merchant_key

Frontend
Create a .env file in the frontend directory:
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_ESEWA_SANDBOX_URL=https://uat.esewa.com.np/epay/main

Usage

Backend: Manages API endpoints for meal listings, order processing, user authentication, media handling, and eSewa payment integration. Test APIs using tools like Postman.
Frontend: Browse the interactive food feed, place orders, track deliveries with Leaflet.js maps, and process payments via eSewa sandbox. Engage with the community via likes and comments.

API Endpoints (Backend)

GET /api/meals: Retrieve available meals.
POST /api/orders: Create a new order.
POST /api/auth/register: Register a user.
POST /api/auth/login: Authenticate a user.
GET /api/feed: Fetch the interactive food feed.
POST /api/payments/esewa: Initiate eSewa payment (sandbox).

Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a new branch (git checkout -b feature-branch).
Make your changes and commit them (git commit -m 'Add new feature').
Push to the branch (git push origin feature-branch).
Open a pull request.

Please ensure your code adheres to the project's coding standards and includes relevant documentation.

Contact
For questions or feedback, reach out via GitHub Issues.

Built with love for Nepalese cuisine and seamless user experiences.
