# User Profile and Notes Application

This is a User Profile and Notes Application where users can create, edit, and manage their profiles and notes. The application supports managing personal information like usernames, bios, profile pictures, and allows users to create, view, and manage their notes. Notes can be marked as public or protected and can be shared using a unique share ID.

Features Implemented

1. User Authentication
   Users can log in and sign up securely.
   JWT tokens are used for authentication.

2. User Profile Management
   Users can edit their usernames, bios, and profile pictures.
   Profile picture updates are handled with image upload and base64 validation.

3. Notes Management
   Users can create, view, and delete notes.
   Notes can be marked as public or protected.
   Notes are linked to the user’s profile and stored with a unique share ID.

4. Frontend
   Built with React to create a responsive and interactive UI.
   Tailwind CSS for styling.
   Implemented a rich text editor to allow users to format their notes content.

5. Backend
   Express is used to handle API requests for user and notes data.
   MySQL database for storing user and notes information.
   Database setup with MySQL2 for connection pooling.

6. Image Handling
   Users can upload profile pictures which are processed and stored in base64 format.

7. Database
   Users and notes are stored in separate tables.
   MySQL relationships are used to link notes to users.
   Database seeding functionality to prepopulate user data and notes for testing.

8. Note Sharing
   Each note has a unique share ID that can be copied to the clipboard.

9. Password Hashing
   Passwords are securely hashed using bcryptjs before being stored in the database.

10. Session Management
    User sessions are managed using JWT to ensure secure and persistent logins.

11. CRUD Operations for Notes
    Users can create, update, and delete notes associated with their profiles.

12. Note Visibility
    Users can choose between public and protected visibility for each note, allowing privacy control.

13. Secure Password Handler for Registration

14. Error Handling and Logging
    Comprehensive error handling in the backend to capture and log errors for debugging and monitoring.

15. Responsive Design
    The frontend is fully responsive, ensuring the application is usable on both desktop and mobile devices.

# Demo Link

You can access the demo of the application at http://localhost:5000.

Prerequisites
To run this application locally, you'll need the following software installed:

Node.js (for the backend server)

Download and install from Node.js.
MySQL (for the database)

Download and install from MySQL.
Steps to Run the Project
Clone the repository or download the project files.

Open a terminal and navigate to the project folder:

`cd path/to/your/note-share`

Install dependencies:

`npm install`

Start the development server:

`npm run dev`

Visit the application at http://localhost:5000 in your browser.

Feel free to update or expand it further based on any additional project details!
