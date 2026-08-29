const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src', 'locales', 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Keys we need to add
const newKeys = {
  // Impact Dashboard
  "impact.title": "National Impact Metrics",
  "impact.subtitle": "Real-time quantification of citizen friction reduced across India.",
  "impact.satisfactionScore": "Satisfaction Score",
  "impact.portalsBypassed": "Portals Bypassed",
  "impact.portalsBypassedDesc": "Times a citizen didn't have to create a new account.",
  "impact.docsAvoided": "Docs Avoided",
  "impact.docsAvoidedDesc": "Redundant uploads prevented via API fetching.",
  "impact.fieldsAutofilled": "Fields Autofilled",
  "impact.fieldsAutofilledDesc": "Keystrokes saved through the Canonical Data Model.",
  "impact.hoursSaved": "Hours Saved",
  "impact.hoursSavedDesc": "Cumulative time saved in application processing.",
  "impact.estimatedEconomicImpact": "Estimated Economic Impact",
  "impact.lakhs": "Lakhs",
  "impact.estimatedEconomicImpactDesc": "Saved by Government departments through automated verification, reduced manual data entry, and lower document storage requirements.",

  // Entity Match / Consequential Modals
  "adminDataQuality.confirmMatch": "Confirm Match",
  "adminDataQuality.reject": "Reject",
  "adminDataQuality.confirmContinue": "Confirm & Continue",
  "adminDataQuality.department": "Department",
  "adminDataQuality.destinationDept": "Destination Department",

  // Dynamic Admin Data
  "adminData.UIDAI (Aadhaar)": "UIDAI (Aadhaar)",
  "adminData.Citizen Profile Verification": "Citizen Profile Verification",
  "adminData.Higher Education Assistance": "Higher Education Assistance",
  "adminData.Business Registration": "Business Registration",
  "adminData.Ministry of Corp Affairs": "Ministry of Corp Affairs",
  "adminData.Revenue Department": "Revenue Department",
  "adminData.Municipal Corporation": "Municipal Corporation",
  "adminData.Higher Education Dept, Rajasthan": "Higher Education Dept, Rajasthan",
  "adminData.Healthy": "Healthy",
  "adminData.srv_mca": "srv_mca",
  "adminData.srv_uidai": "srv_uidai",
  "adminData.srv_kar_municipal": "srv_kar_municipal",

  // Table Headers
  "adminApplications.colNextAction": "Next Action",
  "adminApplications.colService": "Service",
  "adminApplications.colDepartment": "Department",
  "adminApplications.colStatus": "Status"
};

// Add to object safely
for (const [key, value] of Object.entries(newKeys)) {
  if (!enData[key]) {
    enData[key] = value;
  }
}

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
console.log('Successfully patched en.json');
