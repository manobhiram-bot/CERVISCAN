package com.simats.CerviScan

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ImageButton
import android.widget.Spinner
import androidx.appcompat.app.AppCompatActivity

class PatientDetailsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_patient_details)

        val btnBack: ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        val spinnerGender: Spinner = findViewById(R.id.spinnerGender)
        val genders = arrayOf("Select Gender", "Male", "Female", "Other")
        val adapter = ArrayAdapter(this, R.layout.spinner_item, genders)
        adapter.setDropDownViewResource(R.layout.spinner_dropdown_item)
        spinnerGender.adapter = adapter

        val btnContinueScan: android.widget.Button = findViewById(R.id.btnContinueScan)
        val etPatientName: android.widget.EditText = findViewById(R.id.etPatientName)
        val etAge: android.widget.EditText = findViewById(R.id.etAge)
        val etCaseId: android.widget.EditText = findViewById(R.id.etCaseId)
        val pbLoading: android.widget.ProgressBar = findViewById(R.id.pbPatientLoading)

        btnContinueScan.setOnClickListener {
            val name = etPatientName.text.toString().trim()
            val ageStr = etAge.text.toString().trim()
            val gender = spinnerGender.selectedItem.toString()
            val caseIdStr = etCaseId.text.toString().trim()

            if (name.isEmpty() || ageStr.isEmpty() || caseIdStr.isEmpty() || gender == "Select Gender") {
                android.widget.Toast.makeText(this, "Please fill in all details", android.widget.Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val sharedPref = getSharedPreferences("UserProfile", android.app.Activity.MODE_PRIVATE)
            val userId = sharedPref.getInt("user_id", -1)

            if (userId == -1) {
                android.widget.Toast.makeText(this, "Session expired. Please login again.", android.widget.Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            pbLoading.visibility = android.view.View.VISIBLE
            btnContinueScan.isEnabled = false

            val request = com.simats.CerviScan.network.PatientRequest(
                userId = userId,
                name = name,
                age = ageStr.toInt(),
                gender = gender,
                caseId = caseIdStr.toInt()
            )

            com.simats.CerviScan.network.RetrofitClient.instance.savePatient(request)
                .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.PatientResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.simats.CerviScan.network.PatientResponse>,
                        response: retrofit2.Response<com.simats.CerviScan.network.PatientResponse>
                    ) {
                        pbLoading.visibility = android.view.View.GONE
                        btnContinueScan.isEnabled = true

                        val patientResponse = response.body()
                        if (response.isSuccessful && patientResponse != null && patientResponse.status == "success") {
                            val intent = android.content.Intent(this@PatientDetailsActivity, UploadXRayActivity::class.java)
                            intent.putExtra("patient_id", patientResponse.patientId)
                            intent.putExtra("patient_name", name)
                            intent.putExtra("patient_age", ageStr)
                            intent.putExtra("patient_gender", gender)
                            startActivity(intent)
                        } else {
                            val msg = patientResponse?.message ?: "Failed to save patient"
                            android.widget.Toast.makeText(this@PatientDetailsActivity, msg, android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.PatientResponse>, t: Throwable) {
                        pbLoading.visibility = android.view.View.GONE
                        btnContinueScan.isEnabled = true
                        android.widget.Toast.makeText(this@PatientDetailsActivity, "Network Error: ${t.message}", android.widget.Toast.LENGTH_SHORT).show()
                    }
                })
        }
    }
}
