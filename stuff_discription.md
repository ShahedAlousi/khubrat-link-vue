Objective: Design a unified module for managing employees, HR personnel, and departments.

Please design a modern, user-friendly module for managing employees and HR staff.

### Core UI/UX Philosophy

Create a unified interface that integrates three tabs, sharing a common layout and data table structure across roles, while displaying interactive actions (Create, Edit, Freeze, Delete) conditionally based on the authenticated user's role (`useAuthStore()`).

---

### 1. Module Structure and Tab Specifications

#### Tab 1: Employee and HR Management

* **Role-Specific Actions and Customizable Controls:**

* **General Manager (`auth.isGeneralManager`):**

* Main Data Table: Displays data for regular employees and HR staff (Columns: Name, Department, Job Title, Start Date, Base Salary).
... ... * Row Click Action: Clicking any row opens a sliding sidebar displaying the full profile information of the employee or HR manager (default read-only view for the General Manager).

* Top Action: "+ Add HR Staff" button (opens a data-entry sidebar with the "HR" role selected by default).

* Sidebar Controls: "Edit" and "Freeze/Deactivate" buttons appear only when viewing an **HR Manager's** profile. * The "Edit" button switches the displayed HR Manager information into editable input fields.


* **HR Manager (`auth.isHrManager`):**

* Main Data Table: Displays data for regular employees only (Columns: Name, Department, Job Title, Start Date, Base Salary).
... ... * Row Click Action: Clicking any row opens a sliding sidebar displaying the employee's full profile information.

* Top Action: "+ Add Employee" button (opens a sliding sidebar to add a regular employee).

* Sidebar Controls: "Edit" and "Freeze/Deactivate" buttons appear when viewing a **regular employee's** profile.
* The "Edit" button switches the displayed employee information into editable input fields.

* Displays an explanatory note indicating that optional fields can be updated later.

#### Tab 2: Department Management (`/departments`)

* **Unified View (General Manager and HR Manager):**

* An organized table/list of existing departments, their status (Active/Inactive), and assigned department managers (automatically updated).

* **Role-Specific Actions (HR Manager only - `auth.isHrManager`):**

* Top-of-page action: "+ Add Department" button.

* Department Workflow (Add/Edit): Department name, status toggle (enabled by default), and a manager selection dropdown (displays currently active employees only; optional when creating the department).


Displays active employees only; optional when creating the department. * Delete Department: Includes a safety check and a warning note: *"The department must be free of employees before deletion. Reassign employees via Employee Management first."*

#### Tab 3: Bulk Import (`/import`)

* **Access Control:** Access is restricted exclusively to the HR Manager (`auth.isHrManager`). This tab is completely hidden from the General Manager.


* **Features:** Download the `.xlsx` template and upload the file; include a text note explaining the tab's function to the user.


---

### 2. Role-Based Access Control (RBAC) Matrix

| Feature/Action | General Manager (`auth.isGeneralManager`) | HR Manager (`auth.isHrManager`) |


| :--- | :---: | :---: |


| View tables and side detail lists (Regular Employees and Departments) | ✅ Allowed | ✅ Allowed |
View tables and side detail lists (HR Managers) | ✅ Allowed | ❌ Hidden

| Add/Edit/Freeze **HR Staff** | ✅ Allowed | ❌ Hidden |


| Add/Edit/Freeze **Permanent Employees** | ❌ Hidden | ✅ Allowed |


| Add/Edit/Delete **Departments** | ❌ Hidden | ✅ Allowed |


| Access **Bulk Import Tab** | ❌ Hidden | ✅ Allowed |


---

### 3. Technical Constraints and Coding Standards

* **Components and Design:**

* Reuse existing components from `@/components/common` and utilities from `@/utils`. * Strictly adhere to Tailwind CSS classes, `useTheme`, and global styles defined in `src/assets/main.css`. Work within the existing project structure and coding style, ensuring consistency with the overall UI design and the specific layout requirements for the employee and department management interfaces.


* **State Management and API:**

* Manage module state using Pinia stores and `@/services`.

* Automatically determine the correct service endpoints for employees, HR, departments, and manager assignments.


* **Validation and Error Handling:**

* Client-side form validation must align with the `required` keys specified in the provided JSON API contract, utilizing `src/utils/validators.js`.


* **Code Quality:** * Write clean, maintainable, and readable code, avoiding unnecessary sub-components or redundant functions.

* If there is any ambiguity regarding a backend API endpoint contract, please request clarification before writing the code.