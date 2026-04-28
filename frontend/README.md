# LearnSync

**LearnSync** is an intelligent productivity platform designed to streamline academic and personal scheduling through AI-powered assistance. Built with Next.js, LearnSync combines conversational AI, calendar management, and document editing into a unified workspace.

---

## 🌟 Features

### 🤖 AI-Powered Chat Assistant

#### Persistent Conversations
- **Thread-Based Chat**: Create and manage multiple conversation threads with unique identifiers
- **Conversation History**: All chat history is automatically saved and can be revisited anytime
- **Lazy Conversation Creation**: Conversations are created automatically when you send your first message
- **Conversation Management**: Delete conversations with a confirmation dialog to prevent accidental deletion
- **Smart Navigation**: Switch between conversations seamlessly with highlighted active conversation indicators
- **History Load Reliability**: Conversation loading is deduplicated and race-safe to prevent duplicate requests and stale thread rendering

#### Intelligent Routine Generation
- **AI Schedule Extraction**: Upload images of class schedules or routines, and the AI extracts structured data
- **Interactive Approval Widget**: Review and edit extracted schedules before confirming
  - Add, edit, or delete individual classes
  - Modify course names, days, and time slots
  - Visual confirmation before committing to your calendar
- **Automatic Recurring Events**: The system automatically generates weekly recurrence patterns based on class days
  - 16-week semester duration by default
  - Smart day detection from your schedule
  - Customizable recurrence patterns
- **One-Click Calendar Integration**: Approved routines are instantly added to your calendar as recurring events

#### PDF Document Support
- **PDF Upload & Viewing**: Upload PDF documents directly in chat conversations
- **Built-in PDF Viewer**: View PDFs side-by-side with your chat
  - Zoom in/out controls
  - Page rotation
  - Multi-page navigation
  - Professional document preview

#### Real-Time Streaming
- **Live AI Responses**: Watch AI responses appear in real-time as they're generated
- **Status Indicators**: Visual feedback showing when AI is thinking or processing
- **Server-Sent Events**: Efficient streaming for instant response updates

#### Toast Notifications
- **Action Feedback**: Get instant confirmation for successful operations
- **Error Notifications**: Clear error messages when something goes wrong
- **Auto-Dismiss**: Notifications automatically disappear after a set duration

---

### 🧠 Intelligent Learning Tools

#### Interactive Mind Maps & Knowledge Graphs
- **Visual Learning**: Automatically generate interactive mind maps from your course materials
- **Spatial Workspace**: Explore concepts in a 2D infinite canvas powered by React Flow
- **Smart Layouts**: Auto-arranged nodes using Dagre for optimal readability
- **Deep Integration**: Seamlessly connected to your chat contexts and course documents

#### Smart Quiz System
- **AI-Generated Assessments**: Create quizzes instantly from your notes and uploaded files
- **Adaptive Difficulty**: Customize difficulty levels to match your learning progress
- **Performance Tracking**: Detailed score summaries and feedback on answers
- **Knowledge Reinforcement**: Test your understanding of specific topics or entire courses

#### Modern Course Dashboard
- **Centralized Management**: Manage all your courses in a clean, "Zen-style" dashboard
- **Quick Actions Hub**: One-click access to common tasks for each course
- **Customizable Identity**: Personalize course icons, themes, and colors
- **Interactive Previews**: Mini-map previews of your course knowledge graph
- **Viewport-Fitted Layout**: Panels are constrained to screen height with internal scrolling to avoid content falling below view

---

### 📅 Advanced Calendar Management

#### Full-Featured Calendar
- **Multiple Views**: Switch between day, week, and month views
- **Interactive Events**: Click, drag, and drop events to reschedule
- **Event Details**: View comprehensive event information including:
  - Title, description, and location
  - Start and end times
  - Creator and organizer information
  - Attendees list
  - Reminder settings
  - Recurrence patterns

#### Recurring Events
- **RFC 5545 Compliant**: Fully compliant with the RRULE specification for calendar recurrence
- **Advanced Recurrence Patterns**:
  - **Frequencies**: Daily, Weekly, Monthly, Yearly
  - **Interval Configuration**: Repeat every N days/weeks/months/years (1-99)
  - **Day Selection**: Choose specific days of the week for weekly recurrence
  - **Flexible End Options**:
    - Never end
    - End after N occurrences
    - End on a specific date
- **Live Preview**: See human-readable summaries of your recurrence patterns
  - Example: "Every 2 weeks on Mon, Wed, Fri until May 30, 2026"
- **Per-Event Recurrence**: Each event can have its own unique recurrence pattern

#### Event Creation & Editing
- **Quick Event Creation**: Click any date or time slot to create a new event
- **Drag & Drop**: Move events by dragging them to new dates/times
- **Rich Event Forms**:
  - Summary/title
  - Detailed descriptions
  - Location information
  - Multiple attendees via email
  - Custom reminder settings
  - Recurrence configuration
- **Edit Existing Events**: Click any event to view and edit its details
- **Delete Events**: Remove events with a single click

#### Timezone Support
- **Automatic Timezone Handling**: All events respect your configured timezone
- **UTC Conversion**: RRULE dates are automatically converted to UTC for compatibility
- **Display in Local Time**: Events are shown in your local timezone

#### Calendar Integration
- **Google Calendar Sync**: Seamlessly integrates with Google Calendar
- **Multi-Calendar Support**: Manage events across multiple calendars
- **Real-Time Updates**: Changes are immediately reflected in your calendar

---

### 📝 Rich Text Editor

#### Professional Document Editing
- **WYSIWYG Editor**: What You See Is What You Get editing experience
- **Rich Formatting Options**:
  - Bold, Italic, Underline, Strikethrough
  - Multiple heading levels (H1, H2, H3)
  - Ordered and unordered lists
  - Text highlighting
  - Text alignment (Left, Center, Right, Justify)
  - Block quotes
  - Horizontal rules

#### Document Management
- **Auto-Save**: Your work is continuously saved as you type
- **Document Naming**: Rename documents with editable titles
- **Clean Interface**: Distraction-free writing environment

#### Export Options
- **PDF Export**: Convert your documents to professional PDF files
  - High-quality output
  - Proper formatting preservation
  - Custom margins and page settings
- **DOCX Export**: Export to Microsoft Word format
  - Full formatting support
  - Compatible with Word and other processors
- **HTML Export**: Save documents as HTML for web publishing
- **Text Export**: Plain text export for maximum compatibility

#### Toolbar Features
- **Formatting Toolbar**: Quick access to all formatting options
- **Undo/Redo**: Full history management
- **Keyboard Shortcuts**: Efficient editing with standard shortcuts
- **Live Preview**: See formatting changes instantly

---

### 📊 Dashboard

#### Live Daily Command Center
- **Personalized Greeting**: Dynamic greeting by time of day and user profile
- **Real-Time Data Widgets**: Dashboard fetches live data from calendar, routine, messaging, and chat services
- **Manual Refresh**: One-click refresh to reload all dashboard panels

#### Action Hub
- **Working Quick Actions**: Buttons navigate directly to live workflows
  - New Chat
  - Add Event
  - Messages
  - Class Schedule

#### Today Plan Panel
- **Upcoming Events**: Next events are loaded from calendar APIs
- **Next Class Preview**: Shows the next routine class based on weekday/time
- **Timezone-Aware Display**: Times are rendered using user timezone settings when available
- **Empty-State Guidance**: Clear prompts when no events or routine data exists

#### Attention Panel
- **Unread Message Count**: Aggregated unread thread count from messaging contacts
- **Unread Contact Highlights**: Top contacts requiring reply are surfaced first
- **Conversation Activity Snapshot**: Total AI conversation count and most recent activity time

#### Live Metrics
- **Events This Week**: Count of current-week scheduled events
- **Classes Today**: Routine classes scheduled for the current weekday
- **Weekly Class Count**: Total classes in the current routine
- **Unread Threads**: Number of contacts with unread messages

---

### ⚙️ Settings & Customization

#### Appearance Settings
- **Theme Selection**: Choose from multiple carefully crafted themes
  - **Themes Available**:
    - Sunrise Calm (warm, gradient-based)
    - Midnight Blue (cool, professional)
    - Forest Zen (nature-inspired)
    - Sunset Glow (vibrant, energetic)
    - Ocean Breeze (calm, maritime)
    - And more...
  - **Live Preview**: See color palettes before applying
  - **Theme Persistence**: Your theme preference is saved across sessions
  - **Instant Switching**: No page reload required

#### Calendar Preferences
- **Timezone Configuration**: Set your preferred timezone
  - Searchable timezone dropdown
  - Automatic timezone detection
  - Persisted across sessions
- **Default Calendar View**: Choose your preferred view (day/week/month)
- **Working Hours**: Configure your typical work schedule

#### Notification Settings
- **Event Reminders**: Configure default reminder times
- **Push Notifications**: Toggle browser notifications
- **Email Notifications**: Control email alert preferences

#### Account Management
- **Profile Information**: Update your display name and email
- **Password Management**: Change your password securely
- **Session Management**: View and control active sessions
- **Sign Out**: Secure logout from all devices

---

### 🔐 Authentication

#### Multiple Sign-In Options
- **Google Authentication**: Sign in with your Google account
  - One-click authentication
  - Secure OAuth 2.0 flow
  - Automatic profile sync
- **Email & Password**: Traditional email-based authentication
  - Secure password hashing
  - Password strength requirements (8-72 characters)
  - Confirmation password validation

#### Account Creation
- **Simple Sign-Up**: Create an account in seconds
  - Username selection
  - Email verification
  - Password creation with validation
- **Profile Setup**: Automatic profile initialization with sensible defaults

#### Security Features
- **Secure Session Management**: JWT-based authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Password Requirements**: Enforced password strength policies
- **Error Handling**: Clear, actionable error messages

---

### 🎨 User Experience

#### Modern UI/UX
- **Clean Design**: Minimal, distraction-free interface
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Eye-friendly dark theme options
- **Smooth Animations**: Polished transitions and micro-interactions
- **Accessibility**: ARIA labels and keyboard navigation support

#### Navigation
- **Collapsible Sidebar**: Maximize workspace when needed
- **Active State Indicators**: Always know where you are
- **Breadcrumbs**: Clear navigation hierarchy
- **Quick Actions**: Access common features from anywhere

#### Visual Feedback
- **Loading States**: Clear indicators for async operations
- **Error States**: Helpful error messages with recovery suggestions
- **Success Confirmations**: Positive feedback for completed actions
- **Progress Indicators**: Track long-running operations

#### Performance
- **Fast Load Times**: Optimized bundle sizes and lazy loading
- **Smooth Scrolling**: Hardware-accelerated animations
- **Efficient Rendering**: Virtual scrolling for large lists
- **Optimistic Updates**: Instant UI feedback before server confirmation

---

### 🔔 Smart Notifications

#### Toast System
- **Success Notifications**: Green checkmark for successful operations
- **Error Notifications**: Red alerts for failures with descriptive messages
- **Info Notifications**: Blue informational messages
- **Customizable Duration**: Auto-dismiss after configurable timeout
- **Dismissible**: Manual close button on each notification
- **Non-Intrusive**: Bottom-right positioning doesn't block content

---

### 📱 Sidebar Navigation

#### Always Accessible
- **Persistent Navigation**: Sidebar available on all pages
- **Visual Branding**: LearnSync logo and branding
- **Active Page Highlighting**: Current page clearly indicated
- **Icon + Label**: Clear navigation items
- **Collapsible**: Toggle between expanded and collapsed states

#### Navigation Items
- **Dashboard**: Overview and quick stats
- **Chat**: AI assistant conversations
- **Text Editor**: Document creation and editing
- **Calendar**: Event management
- **Settings**: Preferences and configuration

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- pnpm package manager (or npm/yarn)
- Backend API server running (see backend documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   - Set up your backend API URL
   - Configure authentication endpoints

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign in or create an account

---

## 🎯 Use Cases

### For Students
- **Schedule Management**: Keep track of classes, assignments, and study sessions
- **Routine Automation**: Quickly create semester schedules from images
- **Study Planning**: Use the calendar to block study time and set reminders
- **Note Taking**: Draft essays, take notes, and organize coursework in the editor
- **AI Assistance**: Get help with scheduling, planning, and organization

### For Professionals
- **Meeting Management**: Track meetings, deadlines, and appointments
- **Document Creation**: Write reports, memos, and documentation
- **Team Coordination**: Share calendars and collaborate on schedules
- **Productivity Tracking**: Monitor your work patterns and productivity

### For Personal Use
- **Life Organization**: Manage personal appointments and tasks
- **Event Planning**: Plan parties, trips, and social events
- **Habit Tracking**: Use recurring events to build routines
- **Journal Writing**: Use the editor for daily journaling

---

## 💡 Tips & Tricks

### Calendar Tips
- **Quick Event Creation**: Double-click any time slot to create an event
- **Drag to Reschedule**: Click and drag events to move them
- **Recurring Events**: Use the recurrence modal to set up repeating events
- **Bulk Operations**: Create routines to add multiple related events at once

### Chat Tips
- **Upload PDFs**: Drag and drop PDFs directly into chat
- **Review Routines**: Carefully check AI-extracted schedules before confirming
- **Multiple Conversations**: Organize different topics in separate threads
- **Delete Old Chats**: Clean up your conversation list regularly

### Editor Tips
- **Keyboard Shortcuts**: Use standard shortcuts (Ctrl+B for bold, etc.)
- **Format First**: Set up headings and structure before detailed writing
- **Export Often**: Save your work in multiple formats as backups
- **Use Templates**: Create template documents for recurring document types

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Calendar**: FullCalendar with timezone support
- **Editor**: TipTap with rich text extensions
- **Mind Mapping**: React Flow (@xyflow/react) with Dagre layout engine
- **PDF Viewing**: react-pdf with zoom and rotation controls
- **State Management**: Zustand for global state
- **HTTP Client**: Axios for API communication
- **Authentication**: JWT with multiple OAuth providers

---

## 📄 License

This project is part of a learning management system designed to enhance productivity and organization for students and professionals.

---

## 🤝 Support

For questions, issues, or feature requests, please contact the development team or refer to the project documentation.

---

**LearnSync** - Synchronize your learning, schedule, and productivity in one intelligent platform.
