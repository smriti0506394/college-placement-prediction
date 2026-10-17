# 🎓 College Placement Predictor — Frontend

A clean, modern, academic web frontend for the **College Placement Prediction** Machine Learning system. Built purely with **HTML5, CSS3, and vanilla JavaScript** (zero external frontend frameworks).

---

## 📁 Project Structure

```text
College_Placement_Predictor/
│
├── index.html      # Responsive two-column semantic layout
├── style.css       # Academic styling, soft blue/purple theme, clean cards
├── script.js       # Form validation, JSON serialization & Flask API fetch handler
└── README.md       # Integration instructions & backend guide
```

---

## 🚀 How to Run the Frontend

1. Simply double-click `index.html` to open it in any web browser.
2. Alternatively, serve it using any local static server:
   ```bash
   # Python HTTP server:
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

---

## 🔌 Connecting to your Flask Backend

The frontend is pre-configured to communicate with your Flask API at:
```http
POST http://127.0.0.1:5000/predict
Content-Type: application/json
```

### 1. Expected Request Payload (22 Model Features)
```json
{
  "age": 21,
  "gender": "Female",
  "state": "Gujarat",
  "branch": "Computer Science",
  "college_tier": "Tier 2",
  "cgpa": 8.2,
  "attendance_percentage": 85,
  "dsa_problems_solved": 250,
  "aptitude_score": 75,
  "communication_score": 80,
  "projects_count": 3,
  "internships_count": 1,
  "certifications_count": 4,
  "open_source_contributions": 20,
  "github_contributions": 50,
  "linkedin_activity_score": 70,
  "hackathons_participated": 2,
  "competitive_programming_rating": 900,
  "study_hours_per_week": 20,
  "soft_skills_score": 80,
  "leadership_experience": "Yes",
  "extracurricular_activities": "Yes"
}
```

### 2. Expected Response Format from Flask
```json
{
  "prediction": "Placed",
  "placed_probability": 79.65,
  "not_placed_probability": 20.35
}
```

*(If not placed, return `"prediction": "Not Placed"` along with respective probabilities).*

---

## 🐍 Example Flask Backend Setup (`app.py`)

Make sure `flask-cors` is installed to allow cross-origin requests from the browser:

```bash
pip install flask flask-cors joblib scikit-learn numpy pandas
```

Sample Flask route:
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enables cross-origin requests from the frontend

# Load trained artifacts
model = joblib.load("placement_model.pkl")
scaler = joblib.load("placement_scaler.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        
        # 1. Transform incoming JSON into DataFrame / feature vector
        # 2. Apply preprocessing & scaling (using placement_scaler.pkl)
        # 3. Predict using placement_model.pkl
        # 4. Extract class and predict_proba
        
        # Example output structure:
        return jsonify({
            "prediction": "Placed",
            "placed_probability": 79.65,
            "not_placed_probability": 20.35
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(port=5000, debug=True)
```

---

## ✨ Features & Architecture Highlights

- **Strict Machine Learning Separation**: JavaScript contains zero client-side guessing, dummy math, or heuristic estimates. All predictions are generated exclusively by your trained Logistic Regression model.
- **22 Trained Attributes Only**: No extraneous fields (`Student ID`, `Package LPA`, etc.).
- **Responsive 2-Column Layout**: Left card for student details (organized into 5 clear sections with a 3-column desktop grid), and Right card for real-time model results.
- **Complete Error Handling**: Clear feedback if the Flask backend is offline or if an error occurs.
- **Convenient "Fill Sample Data" Button**: Test the full submission pipeline with one click.
