# Requirements Document

## Introduction

ChapterOne is an AI-powered e-learning platform (Next.js 16 + TypeScript + Tailwind CSS v4 frontend, FastAPI backend) that converts uploaded PDFs into structured interactive courses with chapters, lessons, quizzes, flashcards, a mind-map visualiser, and a streaming RAG chat companion.

The platform currently has a working but inconsistent UI: some pages use a dark zinc/violet palette with premium glass cards, others mix design languages, and no shared design-token layer enforces consistency across typography, spacing, shadows, or radius. The redesign must produce a **world-class, cohesive, production-ready UI/UX** across every page and component — inspired by the aesthetic language of Apple, Linear, Notion, Stripe, Vercel, Airbnb, Arc Browser, Framer, and Raycast — while preserving 100 % of the existing API integrations and application logic.

## Glossary

- **Design_System**: The collection of design tokens, base CSS variables, utility classes, and reusable component primitives defined in `globals.css` and optionally a dedicated `design-tokens.css`.
- **Token**: A named CSS custom property (`--color-*`, `--radius-*`, `--shadow-*`, `--spacing-*`, `--font-*`) that centralises a single design decision.
- **Component**: A reusable React/TSX UI element (Navbar, Card, Button, Input, Modal, Badge, Skeleton, etc.).
- **Page**: A Next.js route file under `src/app/`.
- **Skeleton**: A shimmer-animated placeholder that occupies the exact space of real content during loading.
- **Micro-interaction**: A small, purposeful animation (hover lift, press scale, focus ring pulse, icon spin, etc.) with a duration of 150–300 ms.
- **Design_Token_System**: See Design_System.
- **WCAG**: Web Content Accessibility Guidelines 2.1 Level AA.
- **Viewport**: One of four breakpoints — mobile (< 640 px), tablet (640–1023 px), laptop (1024–1279 px), desktop (≥ 1280 px).
- **Navbar**: The sticky top navigation bar rendered by `src/components/Navbar.tsx`.
- **Landing_Page**: `src/app/page.tsx` — the public marketing page.
- **Login_Page**: `src/app/login/page.tsx` — authentication and registration.
- **Dashboard**: `src/app/dashboard/page.tsx`.
- **Upload_Page**: `src/app/upload/page.tsx`.
- **Course_Viewer**: `src/app/courses/[id]/page.tsx`.
- **Quiz_Page**: `src/app/courses/[id]/quiz/[chapterId]/page.tsx`.
- **History_Page**: `src/app/history/page.tsx`.
- **Search_Page**: `src/app/search/page.tsx`.
- **FlashcardsModal**: `src/components/FlashcardsModal.tsx`.
- **MindmapTab**: `src/components/MindmapTab.tsx`.

## Requirements

---

### Requirement 1: Unified Design Token System

**User Story:** As a developer maintaining ChapterOne, I want all visual decisions (colours, typography, spacing, shadows, border-radius) expressed as CSS custom properties so that every page and component is consistent and future changes require editing only one place.

#### Acceptance Criteria

1. THE Design_System SHALL define a complete set of CSS custom properties in `globals.css` covering at minimum: 8 colour roles (`--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-accent`, `--color-accent-hover`), 5 radius values (`--radius-sm` through `--radius-2xl`), 4 shadow levels (`--shadow-xs` through `--shadow-xl`), a 4 px base spacing scale (`--space-1` through `--space-16`), and a type scale (`--text-xs` through `--text-5xl`); configurations that do not define all specified minimums SHALL be treated as incomplete.
2. THE Design_System SHALL set `--color-bg` to a near-black value no lighter than `#09090b` and `--color-accent` to a violet/indigo value in the range `#6366f1`–`#8b5cf6` as the primary interactive colour.
3. WHEN any Component or Page references a colour, spacing, radius, or shadow, THE Component SHALL reference the corresponding Token rather than a hard-coded Tailwind arbitrary value, so that globally updating a Token immediately reflects across all surfaces.
4. THE Design_System SHALL include at least three reusable utility classes: `.surface` (base card background + border), `.surface-raised` (elevated card), and `.btn-primary` (filled accent button with hover and focus states).
5. IF the user's operating system reports a preference for reduced motion, THEN THE Design_System SHALL suppress all CSS `transition`, `animation`, and `transform` effects by setting their durations to `0ms` inside a `@media (prefers-reduced-motion: reduce)` block.

---

### Requirement 2: Typography and Font Loading

**User Story:** As a user reading course content, I want text to be crisp, well-spaced, and consistent across all screens so that long reading sessions are comfortable.

#### Acceptance Criteria

1. THE Design_System SHALL load the Geist Sans variable font (already imported in `layout.tsx`) as the sole sans-serif typeface applied to `body`, with `-0.01em` letter-spacing and a base `line-height` of `1.6`.
2. THE Design_System SHALL define a 6-step type scale from `--text-xs` (11 px) to `--text-5xl` (56 px) with consistent `font-weight` pairings: body text at 400, labels at 600, headings at 700–800, hero text at 800–900.
3. THE Design_System SHALL ensure all body text meets WCAG AA contrast ratio (≥ 4.5 : 1) against `--color-bg`.
4. THE Component SHALL apply `overflow: hidden`, `white-space: nowrap`, and `text-overflow: ellipsis` preemptively to all text containers identified as candidates for truncation (course titles, lesson names, user names) so that ellipsis appears automatically when text overflows its container.

---

### Requirement 3: Responsive Layout Grid

**User Story:** As a user on any device, I want every page to render correctly and usably at mobile, tablet, laptop, and desktop widths so that I can study from any device.

#### Acceptance Criteria

1. THE Design_System SHALL define a maximum content width of `1280 px` centred with `auto` horizontal margins and horizontal padding of at minimum `16 px` on mobile and `24 px` on tablet and above.
2. WHEN the Viewport width is below 640 px, THE Navbar SHALL collapse all text-labelled navigation links into a hamburger menu icon that reveals a full-screen slide-over drawer.
3. WHEN the Viewport width is below 1024 px on the Course_Viewer, THE Course_Viewer SHALL stack the sidebar, reading area, and chat panel vertically, with the sidebar and chat accessible via toggle buttons rather than always-visible columns.
4. THE Dashboard, History_Page, and Search_Page SHALL use CSS Grid layouts that reflow from a single column on mobile to two or four columns on desktop without horizontal overflow.
5. THE Upload_Page SHALL vertically centre its primary card on all Viewports and constrain maximum card width to `640 px`; THE Login_Page card SHALL occupy 80 % of the desktop viewport width (max `1100 px`) and 90 vh height as specified in Requirement 5.


---

### Requirement 4: Landing Page Redesign

**User Story:** As a prospective user visiting ChapterOne for the first time, I want a premium, persuasive landing page that communicates the platform's value at a glance so that I feel compelled to sign up.

#### Acceptance Criteria

1. THE Landing_Page SHALL render a full-viewport 3D perspective grid background: a dark near-black base (`--color-bg`) with a CSS perspective-transformed grid of lines (using `perspective` and `rotateX`) receding toward a vanishing point, combined with a radial gradient glow centred behind the hero text in the accent colour at ≤ 12 % opacity and a secondary ambient glow at the bottom horizon at ≤ 6 % opacity — creating a dramatic depth effect inspired by Vercel and Linear.
2. THE Landing_Page SHALL render a sticky floating header bar with a frosted-glass blur (`backdrop-filter: blur ≥ 16 px`, `background: rgba(9,9,11,0.7)`), a ChapterOne logotype, a pill-shaped navigation row, and a "Get Started" CTA button — all within a single horizontal row; the header SHALL appear detached from the page edges with `16 px` horizontal margin and `12 px` top margin on desktop, giving it a floating island appearance.
3. THE Landing_Page SHALL display a hero section with a headline of at least `--text-5xl` font-size using a multi-stop gradient text (`from white via white to --color-accent`), a sub-headline in `--color-text-secondary`, and two CTA buttons: "Get Started Free" (primary, filled accent with glow shadow) and "Sign In" (secondary, outlined with subtle hover fill); the hero section SHALL also include a browser-frame mockup or UI preview graphic below the CTAs to demonstrate the product visually.
4. THE Landing_Page SHALL include a features section with a centred section heading, containing at least three feature cards using the existing `card-3d-*` pastel system with 3D glossy bubble decorations, hover lift (`translateY(-4px)`) within 300 ms, and distinct icons per feature; WHEN no feature card content is available, THE Landing_Page SHALL render placeholder cards to maintain page structure.
5. THE Landing_Page SHALL include a social proof / stats row between the hero and features sections, displaying at least three metrics (e.g. "10,000+ Courses Generated", "98% Satisfaction", "50+ Languages") as pill badges or stat blocks.
6. WHEN the Landing_Page is viewed on a mobile Viewport, THE Landing_Page SHALL stack the feature cards in a single column, reduce the hero headline to `--text-3xl` or larger, and collapse the 3D grid to a simpler radial glow to preserve performance.
7. THE Landing_Page SHALL include a footer with the copyright notice and the ChapterOne logotype; the footer background SHALL blend into `--color-bg` without a harsh border.
8. THE Landing_Page SHALL NOT display the Navbar component used for authenticated pages; instead it SHALL use its own inline floating header.

---

### Requirement 5: Login / Sign-Up Page Redesign

**User Story:** As a new or returning user, I want a polished, visually distinct authentication page that inspires trust and is easy to complete on any screen size so that I can sign in or register without friction.

#### Acceptance Criteria

1. THE Login_Page SHALL render a two-panel split-card layout occupying **80 % of the desktop viewport width** (max-width `1100 px`) and **90 vh** height, centred on the page, with `border-radius: 24px` and a subtle outer glow shadow — the card SHALL feel like a floating island against the dark page background.
2. THE Login_Page left panel SHALL occupy 45 % of the card width on desktop and SHALL display a **full-bleed editorial photograph** sourced from Unsplash (a dramatic landscape or abstract image with dark tones, e.g. `https://images.unsplash.com/photo-1506905925346-21bda4d32df4`) as its background using `object-fit: cover`, overlaid with a dark gradient (`linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))`) so that text placed over it remains legible; the panel SHALL display the ChapterOne logotype at the top-left and a creator attribution row (avatar + name + role) pinned to the bottom-left, matching the reference design pattern.
3. THE Login_Page left panel SHALL include left/right arrow navigation buttons in the bottom-right corner styled as circular icon buttons with a semi-transparent dark background, allowing future image carousel expansion; these buttons SHALL be present in the DOM but non-functional (decorative) in the initial implementation.
4. THE Login_Page right panel SHALL occupy 55 % of the card width on desktop and SHALL use a clean **white background** with `--color-text-primary` set to near-black (`#0a0a0a`) for this panel only — creating a high-contrast light form surface that contrasts against the dark photograph on the left; the panel SHALL contain: a large bold greeting heading (e.g. "Welcome back" / "Create account"), a sub-label, optional Google sign-in button, an "or" divider, email + password fields (plus first/last name for sign-up mode), a submit button, and a toggle link.
5. THE Login_Page right panel form fields SHALL use a light-mode input style: white or `#f9f9f9` background, `1px solid #e5e7eb` border, dark text, and a `2px solid --color-accent` focus ring — contrasting with the dark design system used on authenticated pages.
6. THE Login_Page submit button SHALL use a full-width pill shape with the accent colour fill, white text, hover glow shadow, and a spinner during async request — matching the bold CTA style seen in the reference image.
7. WHEN the Viewport is below 768 px, THE Login_Page SHALL hide the left image panel and display only the right form panel at full width (`95 vw`, max `480 px`) centred vertically; the panel SHALL revert to a dark surface background (`--color-surface`) matching the overall dark theme for mobile.
8. THE Login_Page SHALL display inline error messages using a red-tinted alert box with an `AlertCircle` icon immediately on form submission failure, without a page reload.
9. WHEN the Viewport height is constrained (less than 600 px), THE Login_Page right panel SHALL become scrollable rather than clipping content.
10. THE Login_Page page background (behind the card) SHALL use the same dark `--color-bg` with a subtle radial glow in the accent colour at ≤ 5 % opacity so the floating card has visual context.


---

### Requirement 6: Navbar Redesign

**User Story:** As an authenticated user, I want a consistent, minimal navigation bar on every authenticated page so that I can move between sections without friction and always know where I am.

#### Acceptance Criteria

1. THE Navbar SHALL be a sticky top bar with `position: sticky; top: 0; z-index: 50`, a `backdrop-filter: blur(16px)` frosted-glass effect, and a bottom border using `--color-border`.
2. THE Navbar SHALL display the ChapterOne logotype (icon + wordmark) on the left, a centred pill-shaped navigation group (Dashboard, Upload PDF, Search, History) visible only on viewports ≥ 768 px, and a right-side user section (avatar, name, logout button) on viewports ≥ 768 px.
3. WHEN the active route matches a navigation link's `href`, THE Navbar SHALL visually distinguish that link using a filled pill background (`--color-surface-raised`) and `--color-text-primary` text, compared to inactive links which use muted text.
4. WHEN the Viewport is below 768 px, THE Navbar SHALL hide the text-labelled navigation pill group and expose a hamburger (`Menu`) icon button on the right side that, when clicked, opens a full-screen overlay drawer containing all navigation links.
5. THE Navbar profile section SHALL show the user's avatar image when `user.avatar_url` is populated, otherwise show an initials-based coloured circle derived from the user's name.
6. WHEN the user clicks their avatar/name in the Navbar, THE Navbar SHALL open an "Account Settings" modal with fields for full name, avatar URL, and password update, with a save button that calls `PUT /api/auth/profile`.
7. WHEN the "Account Settings" modal is open, THE Navbar SHALL render a dark overlay (`bg-black/70 backdrop-blur-sm`) behind the modal and trap keyboard focus within the modal until it is closed.
8. THE Navbar logout button SHALL use a destructive hover state (red tint background and icon) to visually communicate the action's consequence.

---

### Requirement 7: Dashboard Redesign

**User Story:** As an authenticated learner, I want a clear, motivating dashboard that shows my learning progress and active courses at a glance so that I can quickly resume studying.

#### Acceptance Criteria

1. THE Dashboard SHALL render a personalised greeting heading using the authenticated user's name with an accent-coloured gradient, followed by a subtitle and a "Generate New Course" CTA button in the same row on desktop.
2. THE Dashboard SHALL display four statistics cards (Generated Courses, Learning Streak, Study Time, Avg Quiz Score) arranged in a 1–2–4 column responsive grid using the existing icon + label + value layout — each card using a `.surface` token-based background, a subtle left-accent border or icon colour, and a hover micro-interaction of `translateY(-2px)` within 200 ms.
3. WHEN the Dashboard data is loading, THE Dashboard SHALL render four Skeleton placeholder cards of identical dimensions to the real stat cards, using a shimmer animation.
4. THE Dashboard course cards SHALL use the existing `card-3d-*` pastel themes cycling across the colour palette, with 3D bubble decorations, progress bars, and "Resume Study Session" links — maintaining the current visual language while applying token-consistent spacing and radius values.
5. WHEN `enrolled_courses` is empty, THE Dashboard SHALL display a zero-state panel with an icon, a heading, a descriptive sentence, and a "Upload First PDF" CTA button; THE Dashboard SHALL display this zero-state regardless of whether the user has generated any courses, basing the display decision solely on whether `enrolled_courses` is empty.
6. THE Dashboard SHALL NOT display horizontal overflow or layout shifts when course title text is longer than 60 characters.

---

### Requirement 8: Upload Page Redesign

**User Story:** As a learner, I want a focused, confidence-inspiring upload experience so that I understand the multi-step course generation process and trust that my PDF is being processed correctly.

#### Acceptance Criteria

1. THE Upload_Page idle state SHALL display a centred card (`max-width: 640 px`) containing: a file-type icon, a heading, a description, a drag-and-drop zone with a dashed border that turns from `--color-border` to `--color-accent` on drag-over, and a disabled submit button that activates when a PDF file is selected.
2. WHEN a non-PDF file is selected or dropped, THE Upload_Page SHALL display an inline error message within the upload zone in a red-tinted alert style without a page reload; the file SHALL be accepted as a selection but the submit button SHALL remain disabled until a valid PDF is selected.
3. WHEN the upload process begins, THE Upload_Page SHALL replace the idle form with a progress state view showing: a phase-specific animated icon (spinner during processing, checkmark on success), a phase title, a descriptive status message, and a four-segment horizontal step indicator that lights each segment as the corresponding phase completes.
4. THE Upload_Page four phases SHALL map to segments as follows: segment 1 = "uploading", segment 2 = "processing", segment 3 = "generating", segment 4 = "success"; each active segment SHALL use `--color-accent`, completed segments SHALL use a muted accent tone, and the success segment SHALL use an emerald/green colour.
5. WHEN the phase is "success", THE Upload_Page SHALL display a green checkmark icon, a "Course Ready!" heading, and SHALL automatically navigate to the course page after a 2-second delay.
6. IF course generation fails at any phase, THEN THE Upload_Page SHALL return to the idle state and display an error message identifying which phase failed.
7. THE Upload_Page background SHALL use a subtle radial glow in the accent colour (≤ 6 % opacity) to add visual depth without distracting from the upload task.


---

### Requirement 9: Course Viewer Redesign

**User Story:** As a learner studying a course, I want a distraction-free three-panel reading environment (table of contents sidebar, lesson content area, AI chat panel) that is easy to navigate and visually comfortable for extended sessions.

#### Acceptance Criteria

1. THE Course_Viewer SHALL use a three-panel layout on desktop (≥ 1024 px): a `280 px` fixed-width left sidebar for the chapter/lesson tree, a fluid centre reading area, and a `320 px` fixed-width right chat panel — all beneath the Navbar in a `calc(100vh - navbar-height)` tall flex row with `overflow: hidden`.
2. THE Course_Viewer sidebar SHALL display chapter headings as non-interactive section labels and lesson titles as interactive buttons; the active lesson button SHALL use the accent colour background + border; completed lessons SHALL show a green `CheckCircle2` icon; incomplete lessons SHALL show a muted `Circle` icon.
3. THE Course_Viewer reading area SHALL render lesson markdown using styled `ReactMarkdown` component overrides: `h2` headings with a bottom border, `p` text at `--color-text-secondary`, `code` blocks with a dark surface background and violet monospace text, and `strong` bold with `--color-text-primary`.
4. THE Course_Viewer SHALL display an action bar below the lesson title containing: a "Mark as Complete / Completed" toggle button, a "Practice Flashcards" button, and a TTS "Listen to Lesson" / playback control row — all using consistent pill or rounded-xl button styling from the Design_System.
5. THE Course_Viewer SHALL display a tab bar with two tabs ("Lesson Explanation" and "Visual Concept Map") that switch between the markdown reading view and the MindmapTab component without re-fetching data.
6. THE Course_Viewer top header bar (above reading area) SHALL display the course title, an "Export Guide (.md)" button, and conditionally a "🏆 Claim Certificate" button when all lessons are completed.
7. WHEN the Viewport is below 1024 px, THE Course_Viewer SHALL show only the reading area by default; the sidebar SHALL be accessible via a floating toggle button (bottom-left) and the chat SHALL be accessible via a floating toggle button (bottom-right), each opening as a full-height overlay drawer.
8. THE Course_Viewer AI chat panel SHALL render user and assistant messages in distinct bubble styles (user: accent-tinted right-aligned; assistant: surface-raised left-aligned), support markdown in assistant messages, and display a typing indicator (three animated dots) while `chatLoading` is true.
9. WHEN the Course_Viewer is loading course data, THE Course_Viewer SHALL display a full-screen centred Skeleton layout that matches the three-panel structure rather than a raw spinner.

---

### Requirement 10: Quiz Page Redesign

**User Story:** As a learner taking a chapter quiz, I want each question to be clearly laid out, easy to answer, and clearly scored after submission so that I understand exactly how I performed.

#### Acceptance Criteria

1. THE Quiz_Page SHALL display a sticky header bar with a back-navigation button, the heading "Chapter Quiz Practice", a subtitle, and a quiz icon — separated from the question list by a `--color-border` bottom border.
2. THE Quiz_Page SHALL render each question inside a glass-surface card with a question number badge, the question text in `--color-text-primary` at `--text-base` size, and answer inputs below.
3. WHEN a multiple-choice or true/false question option is selected, THE Quiz_Page SHALL apply an accent-coloured border and background to that option within 150 ms, replacing any previously selected option's styling.
4. WHEN the quiz is submitted and graded, THE Quiz_Page SHALL apply a green border and background to correct options and a red border and background to the incorrect selected option, and SHALL display an explanation box beneath each question using a violet-tinted panel with a `Sparkles` icon.
5. THE Quiz_Page SHALL render a score summary banner above the question list after grading, showing the numeric score percentage, a performance message (Outstanding / Good / Keep Studying), a "Retake Quiz" button, and a "Return to Course" button.
6. WHEN the score is ≥ 70 %, THE Quiz_Page SHALL trigger a canvas-confetti celebration effect.
7. IF any question is left unanswered when the user clicks submit, THEN THE Quiz_Page SHALL display an inline error message and SHALL NOT submit the quiz to the server.
8. WHEN the quiz is loading, THE Quiz_Page SHALL display Skeleton placeholder cards in the shape of question cards rather than a raw spinner.


---

### Requirement 11: History Page Redesign

**User Story:** As a learner, I want a clean chronological timeline of my activity (uploads, completions, quiz attempts) so that I can track my learning journey at a glance.

#### Acceptance Criteria

1. THE History_Page SHALL render a vertical timeline layout using a left border line and dot-icon markers for each event, with a colour-coded icon per event type: violet for upload, emerald for completion, amber for quiz.
2. THE History_Page SHALL render each timeline event as a light pastel card using the `card-3d-*` colour palette matching the event type, with the event title, a formatted timestamp, and any relevant metadata (quiz score, upload status).
3. WHEN the `events` array is literally empty (zero items), THE History_Page SHALL display a zero-state centred panel with a `Clock` icon, a "Timeline Empty" heading, and a descriptive instruction message; THE History_Page SHALL NOT display the zero-state when the array contains items even if some items fail to render.
4. WHEN the History_Page is loading, THE History_Page SHALL display three Skeleton timeline entry placeholders rather than a raw spinner.
5. THE History_Page SHALL include a page header with a back-to-dashboard button, a "Learning History" heading, and a subtitle — separated from the timeline by a `--color-border` bottom border.

---

### Requirement 12: Search Page Redesign

**User Story:** As a learner, I want a powerful search interface that lets me find content across my courses using both keyword and semantic search so that I can quickly locate specific knowledge.

#### Acceptance Criteria

1. THE Search_Page SHALL display a search form card using `.surface` token styling containing: a course selector dropdown, a text query input, and a "Query DB" submit button — all in a horizontal row on desktop and stacked vertically on mobile.
2. THE Search_Page results area SHALL show a result count heading and render each result as a pastel card: purple/violet for semantic results, grey for keyword results, each with a result-type badge, an optional lesson title, a text snippet, and for keyword results a "Read Lesson" navigation link.
3. WHEN the search is in progress, THE Search_Page SHALL disable the submit button and replace its label with a spinner and "Searching..." text.
4. WHEN the query returns zero results, THE Search_Page SHALL display an inline empty-state message within the results area, rather than showing a blank space.
5. WHEN no courses exist for the user, THE Search_Page SHALL display a zero-state panel with a `BookOpen` icon and an instruction to generate a course first, and SHALL prevent the search form from being submitted.
6. THE Search_Page SHALL load the user's courses on mount and pre-select the first course so that the form is immediately usable without additional interaction; WHEN no courses exist, THE Search_Page SHALL display only the zero-state panel and SHALL NOT render the search form.

---

### Requirement 13: FlashcardsModal Redesign

**User Story:** As a learner practising recall, I want the flashcard review modal to be visually polished, smooth to interact with, and clearly guide me through the spaced-repetition grading flow so that I can review efficiently.

#### Acceptance Criteria

1. THE FlashcardsModal SHALL render as a centred overlay modal (`max-width: 512 px`) over a `bg-black/80 backdrop-blur-sm` full-screen backdrop, with a `rounded-3xl` container using `.surface-raised` token styling.
2. THE FlashcardsModal card area SHALL be a flippable card with a 3D CSS flip animation (Y-axis rotation, 500 ms, `transform-style: preserve-3d`, `backface-visibility: hidden`): front side showing the question with a violet "Question" label; back side showing the answer with an emerald "Correct Answer" label.
3. WHEN the card is clicked, THE FlashcardsModal SHALL toggle the flip state, rotating the card 180 degrees on the Y-axis within 500 ms.
4. WHEN the card is in the flipped (answer) state, THE FlashcardsModal SHALL display three spaced-repetition grading buttons (Hard / Good / Easy) with red, amber, and emerald colour coding respectively, replacing the "Reveal Answer Card" single button.
5. WHEN no flashcards exist for a lesson, THE FlashcardsModal SHALL display a zero-state view with a `HelpCircle` icon, descriptive text, and a "Generate Flashcards" button that triggers AI generation and updates the card list on completion; THE FlashcardsModal SHALL always show this zero-state when no flashcards exist for the current lesson, regardless of any prior review session state.
6. THE FlashcardsModal header SHALL display the modal title with a `Sparkles` icon, the lesson name truncated to one line, a card progress indicator ("CARD X OF Y"), and a close button.
7. WHEN the FlashcardsModal is generating flashcards, THE FlashcardsModal SHALL disable the generate button and display a spinner + "AI Writing Flashcards..." label; THE FlashcardsModal SHALL keep the button disabled until generation completes successfully, re-enabling it only on successful completion.


---

### Requirement 14: MindmapTab Redesign

**User Story:** As a learner, I want the concept mind-map to be a beautiful, interactive tree visualisation that clearly shows the hierarchy of chapters and lessons so that I can understand the course structure at a glance.

#### Acceptance Criteria

1. THE MindmapTab SHALL render inside a `.surface-raised` token-styled panel with a header row containing a `GitFork` icon, a "Visual Concept Map" heading, and a "Dynamic Visual View" badge.
2. THE MindmapTab SHALL render the course root node as an accent-coloured pill, each chapter node as a dark surface pill with a folder icon, and each lesson node as a small rounded tag with a `BookOpen` icon — connected by border-line connectors in a tree hierarchy.
3. WHEN a chapter or root node expand/collapse toggle is clicked, THE MindmapTab SHALL animate the child nodes in/out using a CSS max-height or opacity transition within 200 ms.
4. THE MindmapTab SHALL default to root and all chapter nodes expanded on initial render.
5. WHEN the mind map is loading, THE MindmapTab SHALL display a centred `Loader2` spinner with a "Mapping course nodes..." caption; WHEN loading completes successfully, THE MindmapTab SHALL automatically display the mind map content without requiring any additional user trigger.
6. IF the mind map fetch fails, THEN THE MindmapTab SHALL display a dashed-border error panel with a descriptive error message; IF the loading component itself fails to render during fetch, THE MindmapTab SHALL display nothing and wait for either successful completion or the error state.

---

### Requirement 15: Animation and Micro-Interaction System

**User Story:** As a user interacting with ChapterOne, I want subtle, purposeful animations on every interactive element so that the interface feels alive and premium without being distracting.

#### Acceptance Criteria

1. THE Design_System SHALL define transition defaults: all interactive elements (buttons, cards, links, inputs) SHALL use `transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)` as their base transition, overridable per-component.
2. WHEN the user hovers a card with the `.glass-panel-hover` class, THE Component SHALL apply `translateY(-2px)` and a subtle box-shadow increase within 200 ms.
3. WHEN the user hovers a `.btn-primary` button, THE Component SHALL immediately apply `translateY(-1px)` and a coloured glow shadow (`box-shadow: 0 8px 20px -4px var(--color-accent) at 35% opacity`) within 200 ms with no conditional delay.
4. WHEN the user focuses any input via keyboard, THE Component SHALL display a `2px solid var(--color-accent)` outline ring at `2px` offset, replacing the browser default, visible without requiring hover.
5. THE Design_System SHALL provide a `.skeleton` utility class that renders a `--color-surface-raised` background with a shimmer animation (`background: linear-gradient(90deg, var(--color-surface), var(--color-surface-raised), var(--color-surface))` animated over 1.5 s) for use as loading placeholders.
6. WHEN any modal (FlashcardsModal, Navbar profile modal) opens, THE Component SHALL fade the backdrop from 0 to full opacity over 150 ms and scale the modal container from `scale(0.96)` to `scale(1)` over 200 ms.

---

### Requirement 16: Accessibility

**User Story:** As a user with visual, motor, or cognitive disabilities, I want every interactive element to be keyboard-navigable, screen-reader-announced, and visually distinguishable so that ChapterOne is fully usable without a pointing device.

#### Acceptance Criteria

1. THE Design_System SHALL ensure all interactive elements (buttons, links, inputs, select dropdowns, modal close buttons) have a visible focus indicator meeting WCAG 2.1 AA: a minimum `3:1` contrast ratio between the focus indicator colour and adjacent colours.
2. THE Navbar SHALL assign `aria-current="page"` to the active navigation link.
3. WHEN a modal (FlashcardsModal, profile modal) opens, THE Component SHALL move focus to the modal's first focusable element and SHALL prevent focus from leaving the modal until it is closed (focus trap).
4. WHEN a modal closes, THE Component SHALL return focus to the trigger element that opened it.
5. THE FlashcardsModal flippable card SHALL have `role="button"` and `aria-label` describing the current flip state ("Click to reveal answer" / "Click to return to question") so that screen readers can announce the action.
6. ALL icon-only buttons (close, logout, toggle) SHALL have an `aria-label` attribute describing their action.
7. ALL images used as UI decoration SHALL have `aria-hidden="true"` or an empty `alt=""` attribute.
8. THE Quiz_Page multiple-choice option buttons SHALL use `role="radio"` and `aria-checked` attributes to convey their selection state to assistive technology.


---

### Requirement 17: Skeleton Loading States

**User Story:** As a user navigating between pages, I want smooth skeleton loading placeholders instead of raw spinners so that the page feels fast and the content layout is predictable before data arrives.

#### Acceptance Criteria

1. THE Dashboard SHALL replace its raw spinner with a skeleton layout matching the actual page structure: a two-element greeting row skeleton, four stat card skeletons, a section heading skeleton, and two course card skeletons.
2. THE Course_Viewer SHALL replace its raw spinner with a skeleton layout: a sidebar skeleton (chapter headings and lesson list), a reading area skeleton (heading bar, lesson title block, three content paragraphs), and a chat skeleton (header + three message bubbles).
3. THE Quiz_Page SHALL replace its raw spinner with Skeleton question card placeholders (three cards, each with a question text block and four option blocks).
4. THE History_Page SHALL replace its raw spinner with three Skeleton timeline entry cards.
5. THE FlashcardsModal loading state SHALL display a Skeleton card of the same dimensions as the flip card.
6. ALL Skeleton elements SHALL use the `.skeleton` utility class defined in Requirement 15, Acceptance Criterion 5.

---

### Requirement 18: Component Extraction and Reusability

**User Story:** As a developer building or maintaining ChapterOne, I want common UI patterns (buttons, input fields, cards, badges, alerts) extracted into reusable component classes or JSX components so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. THE Design_System SHALL define at minimum the following utility classes in `globals.css`: `.btn-primary` (filled accent, hover lift), `.btn-secondary` (outlined, hover subtle fill), `.btn-ghost` (transparent, hover surface fill), `.input-field` (replacing the current `.input-premium`), `.badge` (small rounded label), `.alert-error` (red-tinted error panel), `.alert-success` (green-tinted success panel).
2. THE Design_System `.input-field` class SHALL include placeholder colour at `--color-text-secondary` opacity 50 %, a focus ring using `--color-accent`, and a disabled state with reduced opacity and `cursor: not-allowed`.
3. THE Navbar, FlashcardsModal, and all Page components SHALL reference these shared utility classes instead of duplicating equivalent inline Tailwind class strings.
4. WHEN the `glitter-card`, `shape-3d-capsule`, or `shape-3d-*` classes are actively referenced by any Page or Component, THE Design_System SHALL define those classes or replace their usages with equivalent token-based alternatives; unreferenced undefined classes that exist in the codebase do not require action.

