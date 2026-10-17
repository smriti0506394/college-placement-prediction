/**
 * ============================================================================
 * College Placement Predictor - Client-side Script
 * ============================================================================
 * 
 * IMPORTANT ARCHITECTURE NOTE:
 * This script contains ZERO machine learning or probability calculation logic.
 * It strictly acts as a client interface:
 * 1. Collects and validates the 22 student feature inputs.
 * 2. Formats them into the required JSON schema with proper types.
 * 3. Sends an HTTP POST request to the Flask ML backend (http://127.0.0.1:5000/predict).
 * 4. Displays the real prediction results returned by the trained Logistic Regression model.
 * ============================================================================
 */

// API endpoint where your Flask application is hosted
const FLASK_API_URL = "https://college-placement-prediction-m49q.onrender.com/predict";

// DOM Elements
const placementForm = document.getElementById("placementForm");
const predictBtn = document.getElementById("predictBtn");
const btnStateReady = predictBtn.querySelector(".btn-state-ready");
const btnStateLoading = predictBtn.querySelector(".btn-state-loading");
const fillSampleBtn = document.getElementById("fillSampleBtn");

// Result View Panels
const initialResultView = document.getElementById("initialResultView");
const successResultView = document.getElementById("successResultView");
const errorResultView = document.getElementById("errorResultView");

// Dynamic Result Elements
const outcomeContainer = document.getElementById("outcomeContainer");
const outcomeIcon = document.getElementById("outcomeIcon");
const predictionStatusText = document.getElementById("predictionStatusText");
const placedProbabilityValue = document.getElementById("placedProbabilityValue");
const placedProgressBar = document.getElementById("placedProgressBar");
const notPlacedProbabilityValue = document.getElementById("notPlacedProbabilityValue");
const notPlacedProgressBar = document.getElementById("notPlacedProgressBar");
const resetResultBtn = document.getElementById("resetResultBtn");

// Error View Elements
const errorMessageText = document.getElementById("errorMessageText");
const dismissErrorBtn = document.getElementById("dismissErrorBtn");

// About Modal Elements
const aboutNavLink = document.getElementById("aboutNavLink");
const aboutModal = document.getElementById("aboutModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalOkBtn = document.getElementById("modalOkBtn");

/* ============================================================================
   1. SAMPLE DATA PRE-FILLER (For Fast Testing & Verification)
   ============================================================================ */
// Sample values matching the reference ML profile specification
const SAMPLE_STUDENT_PROFILE = {
  age: 21,
  gender: "Female",
  state: "Gujarat",
  branch: "Computer Science",
  college_tier: "Tier 2",
  cgpa: 8.2,
  attendance_percentage: 85,
  dsa_problems_solved: 250,
  aptitude_score: 75,
  communication_score: 80,
  projects_count: 3,
  internships_count: 1,
  certifications_count: 4,
  open_source_contributions: 20,
  github_contributions: 50,
  linkedin_activity_score: 70,
  hackathons_participated: 2,
  competitive_programming_rating: 900,
  study_hours_per_week: 20,
  soft_skills_score: 80,
  leadership_experience: "Yes",
  extracurricular_activities: "Yes"
};

/**
 * Populates all 22 form fields with sample values for easy testing
 */
function fillSampleData() {
  for (const [key, value] of Object.entries(SAMPLE_STUDENT_PROFILE)) {
    const field = document.getElementById(key);
    if (field) {
      field.value = value;
      field.classList.remove("input-error");
    }
  }
}

if (fillSampleBtn) {
  fillSampleBtn.addEventListener("click", () => {
    fillSampleData();
  });
}

/* ============================================================================
   2. FORM EXTRACTION & VALIDATION
   ============================================================================ */

/**
 * Gathers the 22 inputs from the form, validates them, and converts
 * numeric fields into JavaScript Number types.
 * 
 * Returns the exact JSON object expected by the Flask backend, or null if invalid.
 */
function getFormData() {
  // Clear any existing error highlights
  const inputs = placementForm.querySelectorAll(".form-control");
  inputs.forEach(input => input.classList.remove("input-error"));

  // 1. Basic Information
  const ageVal = document.getElementById("age").value.trim();
  const genderVal = document.getElementById("gender").value;
  const stateVal = document.getElementById("state").value;
  const branchVal = document.getElementById("branch").value;
  const collegeTierVal = document.getElementById("college_tier").value;

  // 2. Academic Performance
  const cgpaVal = document.getElementById("cgpa").value.trim();
  const attendanceVal = document.getElementById("attendance_percentage").value.trim();
  const studyHoursVal = document.getElementById("study_hours_per_week").value.trim();

  // 3. Technical Skills
  const dsaVal = document.getElementById("dsa_problems_solved").value.trim();
  const aptitudeVal = document.getElementById("aptitude_score").value.trim();
  const cpRatingVal = document.getElementById("competitive_programming_rating").value.trim();
  const projectsVal = document.getElementById("projects_count").value.trim();
  const internshipsVal = document.getElementById("internships_count").value.trim();
  const certificationsVal = document.getElementById("certifications_count").value.trim();

  // 4. Professional / Online Activity
  const openSourceVal = document.getElementById("open_source_contributions").value.trim();
  const githubVal = document.getElementById("github_contributions").value.trim();
  const linkedinVal = document.getElementById("linkedin_activity_score").value.trim();
  const hackathonsVal = document.getElementById("hackathons_participated").value.trim();

  // 5. Soft Skills
  const communicationVal = document.getElementById("communication_score").value.trim();
  const softSkillsVal = document.getElementById("soft_skills_score").value.trim();
  const leadershipVal = document.getElementById("leadership_experience").value;
  const extracurricularVal = document.getElementById("extracurricular_activities").value;

  // Validation: Check that none of the 22 required fields are empty
  const fieldsToCheck = [
    { id: "age", val: ageVal },
    { id: "gender", val: genderVal },
    { id: "state", val: stateVal },
    { id: "branch", val: branchVal },
    { id: "college_tier", val: collegeTierVal },
    { id: "cgpa", val: cgpaVal },
    { id: "attendance_percentage", val: attendanceVal },
    { id: "study_hours_per_week", val: studyHoursVal },
    { id: "dsa_problems_solved", val: dsaVal },
    { id: "aptitude_score", val: aptitudeVal },
    { id: "competitive_programming_rating", val: cpRatingVal },
    { id: "projects_count", val: projectsVal },
    { id: "internships_count", val: internshipsVal },
    { id: "certifications_count", val: certificationsVal },
    { id: "open_source_contributions", val: openSourceVal },
    { id: "github_contributions", val: githubVal },
    { id: "linkedin_activity_score", val: linkedinVal },
    { id: "hackathons_participated", val: hackathonsVal },
    { id: "communication_score", val: communicationVal },
    { id: "soft_skills_score", val: softSkillsVal },
    { id: "leadership_experience", val: leadershipVal },
    { id: "extracurricular_activities", val: extracurricularVal }
  ];

  let hasError = false;
  let firstErrorField = null;

  for (const item of fieldsToCheck) {
    if (!item.val || item.val === "") {
      const el = document.getElementById(item.id);
      if (el) {
        el.classList.add("input-error");
        if (!firstErrorField) firstErrorField = el;
      }
      hasError = true;
    }
  }

  if (hasError) {
    if (firstErrorField) {
      firstErrorField.focus();
      firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    alert("Please fill in all 22 required student features before predicting.");
    return null;
  }

  // Parse numerical values to ensure numbers (not strings) in JSON
  const payload = {
    age: parseInt(ageVal, 10),
    gender: genderVal,
    state: stateVal,
    branch: branchVal,
    college_tier: collegeTierVal,
    cgpa: parseFloat(cgpaVal),
    attendance_percentage: parseFloat(attendanceVal),
    dsa_problems_solved: parseInt(dsaVal, 10),
    aptitude_score: parseFloat(aptitudeVal),
    communication_score: parseFloat(communicationVal),
    projects_count: parseInt(projectsVal, 10),
    internships_count: parseInt(internshipsVal, 10),
    certifications_count: parseInt(certificationsVal, 10),
    open_source_contributions: parseInt(openSourceVal, 10),
    github_contributions: parseInt(githubVal, 10),
    linkedin_activity_score: parseFloat(linkedinVal),
    hackathons_participated: parseInt(hackathonsVal, 10),
    competitive_programming_rating: parseInt(cpRatingVal, 10),
    study_hours_per_week: parseFloat(studyHoursVal),
    soft_skills_score: parseFloat(softSkillsVal),
    leadership_experience: leadershipVal,
    extracurricular_activities: extracurricularVal
  };

  return payload;
}

/* ============================================================================
   3. UI STATE MANAGERS
   ============================================================================ */

/**
 * Controls the loading state of the primary predict button
 */
function setLoadingState(isLoading) {
  if (isLoading) {
    predictBtn.disabled = true;
    btnStateReady.style.display = "none";
    btnStateLoading.style.display = "inline-flex";
  } else {
    predictBtn.disabled = false;
    btnStateReady.style.display = "inline-flex";
    btnStateLoading.style.display = "none";
  }
}

/**
 * Switches the right-hand card between:
 * - 'initial': Default guidance screen
 * - 'success': Real ML prediction results screen
 * - 'error': Connection / Server failure screen
 */
function showResultView(viewName) {
  initialResultView.style.display = viewName === "initial" ? "flex" : "none";
  successResultView.style.display = viewName === "success" ? "flex" : "none";
  errorResultView.style.display = viewName === "error" ? "flex" : "none";
}

/**
 * Renders the prediction response received from the Flask server
 * 
 * Expected Flask JSON format:
 * {
 *   "prediction": "Placed",              // or "Not Placed"
 *   "placed_probability": 79.65,
 *   "not_placed_probability": 20.35
 * }
 */
function displayPredictionResult(data) {
  // Normalize string for safety
  const rawPrediction = data.prediction ? String(data.prediction).trim() : "";
  const isPlaced = rawPrediction.toLowerCase() === "placed" || rawPrediction === "1";

  // Update outcome status badge
  if (isPlaced) {
    predictionStatusText.textContent = "PLACED";
    outcomeContainer.className = "prediction-outcome-box status-placed";
    outcomeIcon.innerHTML = "✓";
  } else {
    predictionStatusText.textContent = "NOT PLACED";
    outcomeContainer.className = "prediction-outcome-box status-not-placed";
    outcomeIcon.innerHTML = "✕";
  }

  // Handle probabilities dynamically from server response
  let placedProb = 0;
  let notPlacedProb = 0;

  if (typeof data.placed_probability !== "undefined") {
    placedProb = Number(data.placed_probability);
  }
  if (typeof data.not_placed_probability !== "undefined") {
    notPlacedProb = Number(data.not_placed_probability);
  }

  // Format display numbers to 2 decimal places
  placedProbabilityValue.textContent = `${placedProb.toFixed(2)}%`;
  notPlacedProbabilityValue.textContent = `${notPlacedProb.toFixed(2)}%`;

  // Animate progress bars
  placedProgressBar.style.width = "0%";
  notPlacedProgressBar.style.width = "0%";

  setTimeout(() => {
    placedProgressBar.style.width = `${Math.min(Math.max(placedProb, 0), 100)}%`;
    notPlacedProgressBar.style.width = `${Math.min(Math.max(notPlacedProb, 0), 100)}%`;
  }, 100);

  // Switch to the success view panel
  showResultView("success");

  // Scroll to results smoothly on mobile / small screens
  if (window.innerWidth < 860) {
    successResultView.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Displays error message in the right result card
 */
function displayError(message) {
  errorMessageText.textContent = message;
  showResultView("error");

  if (window.innerWidth < 860) {
    errorResultView.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ============================================================================
   4. FORM SUBMISSION & FLASK API CONNECTION
   ============================================================================ */
placementForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // 1. Collect and validate inputs
  const formData = getFormData();
  if (!formData) {
    return; // Validation failed
  }

  // 2. Set UI to loading state
  setLoadingState(true);

  try {
    // 3. Make HTTP POST request to Flask ML Backend
    const response = await fetch(FLASK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    // 4. Verify HTTP response status
    if (!response.ok) {
      // Backend returned 4xx or 5xx status
      throw new Error(`HTTP_${response.status}`);
    }

    // 5. Parse JSON response from Flask
    const result = await response.json();

    // Check if backend returned an error message inside JSON
    if (result.error) {
      displayError("Something went wrong while generating the prediction. Please try again.");
    } else {
      // 6. Display real ML model output
      displayPredictionResult(result);
    }

  } catch (error) {
    console.error("API Request Error:", error);

    // Differentiate between network connection failure and backend calculation error
    if (error.message && error.message.startsWith("HTTP_")) {
      displayError("Something went wrong while generating the prediction. Please try again.");
    } else {
      // Fetch failed due to network / CORS / server offline
      displayError("Unable to connect to the prediction server. Please try again in a minute.");

  } finally {
    // 7. Reset button loading state
    setLoadingState(false);
  }
});

/* ============================================================================
   5. RESULT RESET & ACTION HANDLERS
   ============================================================================ */
if (resetResultBtn) {
  resetResultBtn.addEventListener("click", () => {
    showResultView("initial");
    const firstInput = document.getElementById("age");
    if (firstInput) firstInput.focus();
  });
}

if (dismissErrorBtn) {
  dismissErrorBtn.addEventListener("click", () => {
    showResultView("initial");
  });
}

/* ============================================================================
   6. ABOUT MODAL HANDLERS
   ============================================================================ */
function openAboutModal() {
  aboutModal.classList.add("open");
  aboutModal.setAttribute("aria-hidden", "false");
}

function closeAboutModal() {
  aboutModal.classList.remove("open");
  aboutModal.setAttribute("aria-hidden", "true");
}

if (aboutNavLink) {
  aboutNavLink.addEventListener("click", (e) => {
    e.preventDefault();
    openAboutModal();
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeAboutModal);
}

if (modalOkBtn) {
  modalOkBtn.addEventListener("click", closeAboutModal);
}

// Close modal if user clicks outside of modal-card
window.addEventListener("click", (event) => {
  if (event.target === aboutModal) {
    closeAboutModal();
  }
});

// Close modal on Escape key
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && aboutModal.classList.contains("open")) {
    closeAboutModal();
  }
});
