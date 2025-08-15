# GharkoSwad

### A food delivery and social engagement platform in Nepal focused on home-cooked meals and interactive food feeds.

## Overview

GharkoSwad is a unique platform that addresses common food delivery issues in Nepal, like delays and poor app performance. It combines a robust **Spring Boot** backend with a responsive **React.js** frontend to deliver a seamless food delivery and social engagement experience. The backend ensures secure and scalable management of users, orders, and payments, while the frontend offers an an interactive food feed and real-time delivery tracking.

## Key Features

GharkoSwad streamlines food-centric app development with a modular and secure backend. Key features include:

* **Security & Authentication:** Implements JWT tokens for secure API access, OTP verification for user trust, and role-based access control to manage permissions.

* **Modular REST APIs:** Provides well-organized controllers for food, orders, payments, user profiles, and media.

* **Business Logic:** Handles core services for orders, carts, and user data.

* **Media Handling:** Enables secure storage and retrieval of images and videos.

* **Social Features:** Includes an interactive food feed with features like comments and likes to foster community engagement.

* **Scalable Architecture:** Designed with organized repositories and DTOs to support future growth.

## Tech Stack

### Backend

* **Framework:** Spring Boot

* **Build Tool:** Maven

* **Database:** MySQL

* **Security:** JWT, OTP

* **API:** RESTful with Spring MVC

* **Payment:** eSewa (sandbox for development)

### Frontend

* **Framework:** React.js

* **Styling:** CSS Modules / Tailwind CSS

* **State Management:** Redux or Context API

* **Mapping:** Leaflet.js (for delivery and location tracking)

* **API Integration:** Axios or Fetch

* **Build Tool:** Vite or Create React App

## Getting Started

### Prerequisites

* **Backend:** Java 11+, Maven, MySQL

* **Frontend:** npm or yarn

### Installation

#### Backend

1. Clone the repository:

   ```
   git clone [https://github.com/sanziv9999/GharkoSwad.git](https://github.com/sanziv9999/GharkoSwad.git)
   
   
   ```

2. Navigate to the backend directory:

   ```
   cd GharkoSwad/backend
   
   
   ```

3. Install dependencies and set up the database:

   * Configure `application.properties` with your MySQL details and email/password for mail sending.

   * Run any database migrations or scripts provided.

4. Start the server:

   ```
   mvn spring-boot:run
   
   
   ```

#### Frontend

1. Navigate to the frontend directory:

   ```
   cd GharkoSwad/frontend
   
   
   ```

2. Install dependencies:

   ```
   npm install
   
   
   ```

   or

   ```
   yarn install
   
   
   ```

3. Start the development server:

   ```
   npm start
   
   
   ```

   or

   ```
   yarn start
   
   
   ```

   Open your browser and visit `http://localhost:3000` to view the app. The frontend will automatically connect to the backend at `http://localhost:8080/api`.

## Environment Variables

### Backend

Create `application.properties` in `backend/src/main/resources`. Note that the values with `${...}` are environment variables that you will need to define on your system or in your IDE's run configuration.

```
spring.application.name=gharkoswad
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/gharkoswad?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.threads.virtual.enabled=true


spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.autSEDCh=true
spring.mail.properties.mail.smtp.starttls.enable=true


jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION} 


spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB

spring.web.resources.static-locations=classpath:/static/,classpath:/public/,classpath:/resources/,classpath:/uploads/images/

```

### Frontend

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_ESEWA_SANDBOX_URL=[https://epay.esewa.com.np/api/epay/main/v2/form](https://epay.esewa.com.np/api/epay/main/v2/form)

```

## Usage

* **Backend:** Manages API endpoints for meal listings, order processing, user authentication, media handling, and eSewa payment integration. You can test these APIs using tools like Postman.

* **Frontend:** Browse the interactive food feed, place orders, track deliveries with Leaflet.js maps, and process payments via the eSewa sandbox. You can also engage with the community through likes and comments.

## API Endpoints (Backend)

* `GET /api/meals`: Retrieve available meals.

* `POST /api/orders`: Create a new order.

* `POST /api/auth/register`: Register a new user.

* `POST /api/auth/login`: Authenticate a user.

* `GET /api/feed`: Fetch the interactive food feed.

* `POST /api/payments/esewa`: Initiate eSewa payment (sandbox) to the V2 form endpoint.

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.

2. Create a new branch: `git checkout -b feature-branch`

3. Make your changes and commit them: `git commit -m 'Add new feature'`

4. Push to the branch: `git push origin feature-branch`

5. Open a pull request.

Please ensure your code adheres to the project's coding standards and includes relevant documentation.

## Contact

For questions or feedback, please reach out via **GitHub Issues**.

Built with love for Nepalese cuisine and seamless user experiences.
