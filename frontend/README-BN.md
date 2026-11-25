# HCDF React Frontend — Setup (বাংলা)

## 1. Folder
ZIP extract করে `frontend` folder কপি করুন:
`D:\HCDF-Website\frontend`

## 2. Environment
PowerShell:
```powershell
cd D:\HCDF-Website\frontend
Copy-Item .env.example .env
```
`.env`-এ API URL:
```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```
এখানে কোনো database password বা JWT secret দেবেন না।

## 3. Install and run
```powershell
npm install
npm run dev
```
Open: `http://localhost:5173`

Production build check:
```powershell
npm run build
```

## 4. Implemented screens
- Secure login using existing `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout`.
- Dashboard summary from live database API.
- User list, search, status filter, pagination and account details.
- Status changes only shown to users with `users.update`.
- Role assignment only shown to users with `users.manage_roles`.
- Role and permission catalogue.
- Role permission editor only shown to users with `permissions.manage`; SA role permission replacement is disabled.
- Sidebar navigation filtered by permission.

## 5. Token handling
Access token is held in application memory (not localStorage). Refresh token is expected in the existing HttpOnly cookie. Axios sends credentials and refreshes an expired access token once.

## 6. Backend must be running
Start backend in a separate VS Code terminal:
```powershell
cd D:\HCDF-Website\backend
npm run dev
```
Frontend CORS origin is `http://localhost:5173`. Your backend `.env` currently includes this origin.

## 7. Notes
- This is the first integrated admin frontend slice for the verified Phase 2 APIs.
- Membership/NID, donations, CMS and programme pages are not fabricated in this package because their database schemas/API contracts have not yet been verified.
- The browser hides controls when permission is missing, but the backend remains the security boundary.
