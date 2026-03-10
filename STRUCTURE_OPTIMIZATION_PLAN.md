# File Structure Optimization Plan

## Analysis
The current file structure in `app/` is flat and mixes screens with components. Additionally, there seems to be a broken navigation target.

### Issues Identified
1.  **Mixed Concerns**: `app/menuButtonAndModal.tsx` is a component, not a screen, but it is located in the `app/` directory.
2.  **Flat Structure**: All screens are in the root of `app/`, making it hard to distinguish flows (Auth, Settings, Main).
3.  **Broken Redirect**: `app/index.tsx` redirects to `/main`, but no `main.tsx` or `main/` directory exists in `app/`.
4.  **Component Organization**: `components/` contains a mix of generic UI and domain-specific components.

## Proposed New Structure

```
/
├── app/
│   ├── (auth)/                 # Authentication Group
│   │   ├── login.tsx           # Moved from app/login.tsx
│   │   ├── register.tsx        # Moved from app/register.tsx
│   │   ├── onboarding.tsx      # Moved from app/onboarding.tsx
│   │   └── _layout.tsx         # Auth layout
│   ├── (main)/                 # Main Application Group
│   │   ├── index.tsx           # Main Dashboard/Home (Maybe rename chat-list or create new?)
│   │   ├── chat-list.tsx       # Moved from app/chat-list.tsx
│   │   ├── chat-detail.tsx     # Moved from app/chat-detail.tsx
│   │   ├── food-detail.tsx     # Moved from app/food-detail.tsx
│   │   ├── BarcodeScan.tsx     # Moved from app/BarcodeScan.tsx
│   │   └── _layout.tsx         # Main layout with MenuButtonAndModal provider?
│   ├── (settings)/             # Settings Group
│   │   ├── settings.tsx        # Moved from app/settings.tsx (rename to index?)
│   │   ├── profile-edit.tsx    # Moved from app/profile-edit.tsx
│   │   ├── change-password.tsx # Moved from app/change-password.tsx
│   │   ├── delete-account.tsx  # Moved from app/delete-account.tsx
│   │   └── login-history.tsx   # Moved from app/login-history.tsx
│   ├── index.tsx               # Entry Point (redirect logic)
│   ├── _layout.tsx             # Root Layout
│   └── +not-found.tsx
├── components/
│   ├── ui/                     # Generic UI (Buttons, Alerts)
│   │   ├── CustomAlert.tsx
│   │   ├── FloatingActionButton.tsx
│   │   ├── ...
│   ├── features/               # Domain Components
│   │   ├── FoodItem.tsx
│   │   ├── SmileFoodLogo.tsx
│   │   └── MenuButtonAndModal.tsx # Moved from app/menuButtonAndModal.tsx
│   └── ...
```

## Action Items
1.  **Move Component**: Move `app/menuButtonAndModal.tsx` to `components/features/MenuButtonAndModal.tsx`.
2.  **Create Groups**: Create `(auth)`, `(main)`, `(settings)` folders in `app/`.
3.  **Move Files**: Move respective files into these groups.
4.  **Fix Navigation**: Update `app/index.tsx` to redirect to the correct main screen (e.g., `/chat-list` or create a new `/(main)/index.tsx`).
5.  **Refactor Imports**: Update imports in moved files.

## Questions for User
- What should be the main screen when logged in? (Currently `index.tsx` goes to `/main` which is missing). Is it `chat-list`?
