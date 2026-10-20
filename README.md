# How to Test the App

## Student Information

- **Student Name:** Paing Hein Soe
- **Student ID:** 6540031

## Test Credentials

*Run the database seed step (detailed below) to generate these users.*

- **Teacher Account:**
  - **Username:** `teacher1` (or `teacher2`, `teacher3`)
  - **Password:** `password123`
- **Student Account:**
  - **Username:** `student1` (or `student2`, `student3`)
  - **Password:** `password123`

## Prerequisites

- Node.js installed (v18+ recommended)
- A MongoDB Atlas connection string
- Git (if cloning from a repository)

### 3. Testing Walkthrough

**Teacher Flow:**
1. **Login:** Log in using `teacher1` and password `password123`.
2. **Create Course:** Fill out the "Create New Course" form (Name, Duration, Price, Max Students, Topics) and submit.
3. **Verify Creation:** Check that the new course immediately appears in the "Available Courses" list below.
4. **Toggle Status:** Click the **Toggle Status** button on your created course to change it from "Open" to "Close", and vice versa.
5. **Delete Course:** Click the **Delete** button to remove a course (a browser confirmation prompt will appear).
6. **Logout:** Click the **Logout** button in the top right corner to return to the login screen.

**Student Flow:**
1. **Login:** Log in using `student1` and password `password123`.
2. **View Courses:** You will see the dashboard with all available courses. 
3. **Enroll:** Click **Enroll Now** on an "Open" course. You will receive a success alert, and the button will turn gray and change to "Unenroll".
4. **Unenroll:** Click the **Unenroll** button to remove yourself from the course.
5. **Status Restrictions:** Verify that any course marked as "Close" by a teacher has a disabled enrollment button (unless you are already enrolled, in which case you can still unenroll).