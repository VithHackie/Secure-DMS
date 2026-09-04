# Secure Digital Document Management System (DMS) — Setup & Contribution Guide
## This guide provides step-by-step instructions to set up, run, and test the Law Enforcement DMS application locally from scratch.

### Step 1: Install Prerequisites
Before cloning the repository, ensure your system has the following tools installed:

Node.js (v18+ recommended): Download and install from nodejs.org. This automatically installs npm.

PostgreSQL (v14+ recommended): Download and install from postgresql.org. Ensure the PostgreSQL service is running on your local machine.

Git: Installed and configured.

### Step 2: Clone the Repository & Setup Database
Clone the repository and navigate into the project folder:
```
Bash
git clone <repository-url>
cd <project-folder-name>
```
Open your PostgreSQL terminal (psql) or a database GUI client (like pgAdmin or DBeaver) and create a new database:
SQL
CREATE DATABASE dms_database;
Run your schema creation SQL script to set up all tables (users, cases, documents, audit_logs) and custom types:
```
Bash
psql -U postgres -d dms_database -f path/to/creation.sql
```
### Step 3: Configure and Run the Backend

Navigate to the backend directory:
```
Bash
cd Backend
```
Install the required backend dependencies:
```
Bash
npm install
```
Create a .env file in the root of the Backend directory with the following configuration (update credentials to match your local PostgreSQL setup):

Code snippet
```
PORT=8080
DBNAME=dms_database
DBUSER=postgres
DBPASSWORD=your_postgres_password
JWT_SECRET=your_super_secret_jwt_key
```
**Start the Express backend server:**
```
Bash
node index.js
```
(You should see DATABASE IS CONNECTED!!! and SERVER IS RUNNING ON PORT 8080 in your console).

### Step 4: Configure and Run the Frontend
Open a new terminal window/tab and navigate to the frontend directory:
```
Bash
cd Frontend
```
Install the frontend dependencies:
```
Bash
npm install
```
Start the Vite/React development server:
```
Bash
npm run dev
```
Open your browser and navigate to the local development URL provided by Vite (usually http://localhost:5173).

### Step 5: Unit Testing the Application
To verify that the application components, API endpoints, and database connections are fully operational:

Test the Backend Health Route:
Run a curl command or open http://localhost:8080/api/health in your browser to confirm the server responds.

Test User Authentication & Registration:

Navigate to /reg on your frontend application.

Register a new user account (this hits the /signup route, hashes the password via bcrypt, generates a JWT, and stores it in context/local storage).

Verify that the user record successfully populates your PostgreSQL users table.

Test logging out via the dashboard button and signing back in through the /login route.
