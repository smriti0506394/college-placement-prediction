from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

# ---------------------------------------------------------
# 1. Create Flask application
# ---------------------------------------------------------
app = Flask(__name__)

# Allow the frontend to communicate with Flask
CORS(app)


# ---------------------------------------------------------
# 2. Load trained model and scaler
# ---------------------------------------------------------

# Load the Logistic Regression model
model = joblib.load("placement_model.pkl")

# Load the StandardScaler used during model training
scaler = joblib.load("placement_scaler.pkl")


# ---------------------------------------------------------
# 3. Load the original dataset
# ---------------------------------------------------------

# We use the original dataset to make sure that
# categorical encoding is exactly the same as training.
dataset = pd.read_csv("clg_plcmnt_dataset.csv")


# ---------------------------------------------------------
# 4. Map frontend names to dataset column names
# ---------------------------------------------------------

column_map = {
    "age": "Age",
    "gender": "Gender",
    "state": "State",
    "branch": "Branch",
    "college_tier": "College_Tier",
    "cgpa": "CGPA",
    "attendance_percentage": "Attendance_Percentage",
    "dsa_problems_solved": "DSA_Problems_Solved",
    "aptitude_score": "Aptitude_Score",
    "communication_score": "Communication_Score",
    "projects_count": "Projects_Count",
    "internships_count": "Internships_Count",
    "certifications_count": "Certifications_Count",
    "open_source_contributions": "Open_Source_Contributions",
    "github_contributions": "GitHub_Contributions",
    "linkedin_activity_score": "LinkedIn_Activity_Score",
    "hackathons_participated": "Hackathons_Participated",
    "competitive_programming_rating": "Competitive_Programming_Rating",
    "study_hours_per_week": "Study_Hours_Per_Week",
    "soft_skills_score": "Soft_Skills_Score",
    "leadership_experience": "Leadership_Experience",
    "extracurricular_activities": "Extracurricular_Activities"
}


# ---------------------------------------------------------
# 5. Home route
# ---------------------------------------------------------

@app.route("/")
def home():

    # This message confirms that Flask is running
    return "College Placement Prediction API is running!"


# ---------------------------------------------------------
# 6. Prediction route
# ---------------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():

    try:

        # Get JSON data sent by the frontend
        data = request.get_json()

        # Check whether data was received
        if not data:
            return jsonify({
                "error": "No student data received"
            }), 400


        # -------------------------------------------------
        # Convert frontend field names to dataset names
        # -------------------------------------------------

        student_data = {}

        for frontend_name, dataset_name in column_map.items():

            # Get the value sent by frontend
            student_data[dataset_name] = data.get(frontend_name)


        # Convert student dictionary into DataFrame
        student = pd.DataFrame([student_data])


        # -------------------------------------------------
        # Prepare data for the model
        # -------------------------------------------------

        # Remove columns that were not used for training
        # from the original dataset.
        training_data = dataset.drop(
            columns=["Student_ID", "Placement_Status", "Package_LPA"]
        )


        # Add the new student to the original training data.
        # This is important because it allows pandas to create
        # exactly the same categorical columns.
        combined = pd.concat(
            [training_data, student],
            ignore_index=True
        )


        # -------------------------------------------------
        # Fill missing values
        # -------------------------------------------------

        # These were the columns that contained missing values
        # in the original dataset.
        numeric_columns = [
            "Open_Source_Contributions",
            "LinkedIn_Activity_Score"
        ]

        for column in numeric_columns:

            # Fill missing values using the dataset median
            combined[column] = combined[column].fillna(
                dataset[column].median()
            )


        # -------------------------------------------------
        # Convert categorical columns into numbers
        # -------------------------------------------------

        # This performs the same one-hot encoding used
        # during model training.
        combined = pd.get_dummies(
            combined,
            drop_first=True
        )


        # -------------------------------------------------
        # Select only the new student's row
        # -------------------------------------------------

        # The new student was added at the end,
        # so -1 selects that student's row.
        student_encoded = combined.iloc[[-1]].copy()


        # -------------------------------------------------
        # Make sure feature order matches the trained model
        # -------------------------------------------------

        # The scaler remembers the exact feature names
        # and order used during training.
        expected_features = scaler.feature_names_in_

        # Add any missing columns with value 0
        for feature in expected_features:

            if feature not in student_encoded.columns:
                student_encoded[feature] = 0


        # Keep only the features expected by the model
        # and keep them in exactly the same order.
        student_encoded = student_encoded[
            expected_features
        ]


        # -------------------------------------------------
        # Scale the student's data
        # -------------------------------------------------

        student_scaled = scaler.transform(
            student_encoded
        )


        # -------------------------------------------------
        # Make prediction
        # -------------------------------------------------

        prediction = model.predict(student_scaled)[0]

        # Get probabilities for both classes
        probabilities = model.predict_proba(
            student_scaled
        )[0]


        # Find probability of each class
        class_probabilities = dict(
            zip(model.classes_, probabilities)
        )


        # Convert probabilities into percentages
        placed_probability = (
            class_probabilities.get("Placed", 0) * 100
        )

        not_placed_probability = (
            class_probabilities.get("Not Placed", 0) * 100
        )


        # -------------------------------------------------
        # Send result back to frontend
        # -------------------------------------------------

        return jsonify({
            "prediction": prediction,
            "placed_probability": round(
                placed_probability, 2
            ),
            "not_placed_probability": round(
                not_placed_probability, 2
            )
        })


    except Exception as e:

        # If something goes wrong, send the error
        # back to the frontend.
        return jsonify({
            "error": str(e)
        }), 500


# ---------------------------------------------------------
# 7. Start Flask server
# ---------------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )