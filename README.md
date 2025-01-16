# Commune Website

Welcome to the Commune Website! This is an application that allows users to create and join communes. Communes can be of various types, such as normal or ecommerce, and users can post content, manage their profiles, and search for communes.

## Prerequisites

Before you begin, ensure you have the following software installed:

- **Node.js** (v14.x or higher)
- **npm** (package managers for Node.js)
- **MySQL** (or any other database you plan to use)

### Setting up the project

Follow these steps to get the project up and running locally.

#### 1. Clone the repository

Clone the repository to your local machine using Git:

```bash
git clone "https://github.com/rakibul23n28/Commune.git"
```

2. Install dependencies
   Navigate to the project folder and install the required dependencies:

```bash
cd commune
npm install
```

3. Create a database called "commune"

```bash
CREATE DATABASE commune;
```

5. Run the server
   To start the development server, run the following command:

```bash
npm run dev
```

This will start the server and automatically restart it when you make code changes.

The server should now be running on http://localhost:5000. You can visit this URL to test the application.

```bash
/commune
│
├── /client                  # Front-end React application
├── /server                  # Back-end Express API
│   ├── /controllers         # API route controllers
│   ├── /models              # Database models
│   ├── /routes              # API routes
│   └── /utils               # Helper functions
├── /public                  # Static assets (e.g., images, CSS)
├── /uploads                 # User-uploaded files
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
└── README.md                # Project documentation
```
