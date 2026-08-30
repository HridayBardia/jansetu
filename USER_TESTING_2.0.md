# User Testing 2.0 Log

This document serves as the live log for recording user testing observations, feedback, and bug reports across the JanSetu Citizen & Admin portals.

---

## Testing Session Overview
- **Session Started:** 2026-08-30
- **Testing Scope:** Citizen Portal, Admin Portal, Workflow Execution, Interoperability Hub, Realtime Sync, Journey Progression.
- **Mode:** Observation & Feedback Logging

---

## Log Entries

### Entry 1: Comprehensive System Review (2026-08-30)

**1. Active Journeys Persistence (Bug/Enhancement)**
- **Observation:** Refreshing the citizen portal resets the active journeys back to their initial default state.
- **Requirement:** Adding or removing journeys must persist permanently across page reloads and login sessions. It needs to be fully wired with the backend user state so the data remains intact regardless of how long the user is logged out or how many times they log in.

**2. "Add to My Applications" Feature & Admin Sync**
- **Observation:** Goal Planner lacks a direct way to add standard legal documents (Passport, PAN, Ration Card, Voter ID, Visa, etc.) to the user's applications. Admin portal currently shows very few applications compared to the total pool.
- **Requirement:** Add an "Add to My Applications" button for document searches in the Goal Planner. Keep the existing hardcoded demo applications, but synchronize the applications list with the Admin Portal so admins have full visibility into the user's added applications.

**3. Citizen "My Applications" Tab Logic & Tracking**
- **Observation:** The "My Applications" tab in the citizen portal is currently fully hardcoded and non-functional. The "Track Workflow" button redirects to a random journey.
- **Requirement:** Make the "My Applications" tab logically functional with relevant buttons. Rename "Track Workflow" to "Track Application". Ensure it redirects to a dedicated, accurate tracking page showing approval timelines and status. Admins must be able to update these statuses from their portal.

**4. Context-Aware Government Portals Directory**
- **Observation:** In the Journey Preview, the "Official Government Portals & Domain Gateways Directory" shows irrelevant portals (e.g., showing scholarship portals when the user is applying for a passport).
- **Requirement:** Dynamically filter the Government Portals directory to only show portals relevant to the specific journey being previewed.

**5. Dashboard Statistics Sync & Welfare Schemes**
- **Observation:** The Beneficiary Dashboard displays hardcoded statistics (e.g., showing only 4 active journeys despite the user having more).
- **Requirement:** Add more National Welfare schemes. Sync the dashboard numbers (Active Journeys, total applications, etc.) with the actual live count. Ensure statistics update immediately when new items are added.

**6. Gov Interop Hub SIH Demo Version**
- **Observation:** Need a clear way to demonstrate the Interoperability Hub to SIH judges.
- **Requirement:** Add a dedicated "Demo Version/Variant" specifically for the SIH presentation. Even if partially hardcoded, it must clearly explain and visualize what the Gov Interop Hub does, how it functions, and its benefits in a single cohesive flow.

**7. Goal Planner Routing Optimization**
- **Observation:** Searching for "Voter ID" in the Goal Planner incorrectly routes to the Welfare Journey page.
- **Requirement:** Optimize the Goal Planner's NLP routing logic to accurately map searches to their correct domains (e.g., Identity documents shouldn't route to Welfare).

**8. Revoked Consent Admin Visibility & Re-ask Flow**
- **Observation:** Currently, there's no clear bridge when a citizen revokes consent.
- **Requirement:** If a user revokes consent for a document, this status must immediately sync and be visible in the Admin Portal. The Admin dashboard must include a "Re-ask for Consent" button to push a new consent request back to the citizen in real-time.

**9. Architecture & Integration Invariants**
- **Observation:** The current Supabase integration and real-time wiring are highly effective ("goated").
- **Requirement:** Maintain and protect the existing Supabase architecture. Ensure the Citizen and Admin portals remain totally synchronized across all small and large interactions without breaking the existing workflow. User roles (Citizen vs. Admin) must remain strictly distinct. Proceed with the rigor of a professional full-stack deployment, minimizing errors.
