# Wisdom Forms

**Wisdom Forms** is a premium, organization-centric form builder application designed to replace Google Forms for Wisdom Kasaragod. It features a modern glassmorphism design, role-based access control, organization management, and comprehensive data analysis tools.

**Live URL**: [forms.wisdomkasaragod.in](https://forms.wisdomkasaragod.in)

## Features

-   **Premium UI/UX**: Glassmorphism design system, smooth animations, and responsive layout without heavy frameworks (Vanilla CSS).
-   **Organization Management**: 
    -   Superadmins can create organizations.
    -   Admins are assigned to organizations and manage forms within their scope.
-   **Authentication**: Google Sign-In with a manual approval workflow for new admins.
-   **Form Builder**: 
    -   Drag-and-drop feeling (list-based) question management.
    -   Support for Text, Paragraph, Radio, Checkbox, and Dropdown fields.
    -   Logo upload via ImgBB.
    -   Customizable URL slugs per form.
    -   Publish/Unpublish toggle.
-   **Public Access**:
    -   Public catalog landing page showing all active forms.
    -   Dynamic public form routing: `forms.wisdomkasaragod.in/:orgSlug/:formSlug`.
-   **Data Management**:
    -   View form responses in a tabular format.
    -   Export responses to PDF.

## Tech Stack

-   **Frontend**: React (Vite)
-   **Styling**: Vanilla CSS (Variables, Flexbox/Grid)
-   **Backend**: Firebase (Authentication, Firestore)
-   **PDF Generation**: `jspdf`, `jspdf-autotable`
-   **Hosting**: Firebase Hosting (Recommended)

## Setup & compatibility

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Config**:
    Create a `.env` file with your Firebase and ImgBB credentials:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    VITE_FIREBASE_MEASUREMENT_ID=...
    # VITE_IMGBB_API_KEY=... (Optional for logo upload)
    ```
4.  **Run Locally**:
    ```bash
    npm run dev
    ```

## Firebase Security Rules

See [firestore.rules](./firestore.rules) for detailed security configuration ensuring data isolation between organizations.

## Deployment

Build for production:
```bash
npm run build
```

Deploy to Firebase:
```bash
firebase deploy
```
