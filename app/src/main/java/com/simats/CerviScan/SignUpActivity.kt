package com.simats.CerviScan

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class SignUpActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_signup)

        val spinnerGender: Spinner = findViewById(R.id.spinnerGender)
        val genders = arrayOf("Select Gender", "Male", "Female", "Other")
        val adapter = ArrayAdapter(this, R.layout.spinner_item, genders)
        adapter.setDropDownViewResource(R.layout.spinner_dropdown_item)
        spinnerGender.adapter = adapter

        val tvLoginLink: TextView = findViewById(R.id.tvLoginLink)
        tvLoginLink.setOnClickListener {
            finish()
        }

        val btnRegister: Button = findViewById(R.id.btnRegister)
        val etFullName: EditText = findViewById(R.id.etFullName)
        val etEmail: EditText = findViewById(R.id.etEmail)
        val etContactNumber: EditText = findViewById(R.id.etContactNumber)
        val etAge: EditText = findViewById(R.id.etAge)
        val etLocation: EditText = findViewById(R.id.etLocation)
        val etPassword: EditText = findViewById(R.id.etPassword)
        val pbLoading: ProgressBar = findViewById(R.id.pbSignUpLoading)

        btnRegister.setOnClickListener {
            val name = etFullName.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val mobile = etContactNumber.text.toString().trim()
            val age = etAge.text.toString().trim()
            val selectedGender = spinnerGender.selectedItem?.toString() ?: ""
            val gender = if (selectedGender == "Select Gender") "" else selectedGender
            val location = etLocation.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in name, email and password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!email.endsWith("@gmail.com")) {
                Toast.makeText(this, "Only @gmail.com email addresses are allowed", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            pbLoading.visibility = View.VISIBLE
            btnRegister.isEnabled = false

            val request = com.simats.CerviScan.network.SignupRequest(
                name = name,
                email = email,
                password = password,
                mobile = mobile,
                age = age,
                gender = gender,
                location = location
            )

            com.simats.CerviScan.network.RetrofitClient.instance.signup(request)
                .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                        response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                    ) {
                        pbLoading.visibility = View.GONE
                        btnRegister.isEnabled = true

                        val signUpResponse = response.body()
                        if (response.isSuccessful && signUpResponse != null && signUpResponse.status == "success") {
                            Toast.makeText(this@SignUpActivity, "Registered successfully! Please login.", Toast.LENGTH_SHORT).show()
                            val intent = Intent(this@SignUpActivity, LoginActivity::class.java)
                            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                            startActivity(intent)
                            finish()
                        } else {
                            val msg = signUpResponse?.message ?: "Signup failed"
                            Toast.makeText(this@SignUpActivity, msg, Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                        pbLoading.visibility = View.GONE
                        btnRegister.isEnabled = true
                        Toast.makeText(this@SignUpActivity, "Network Error: ${t.message}", Toast.LENGTH_SHORT).show()
                    }
                })
        }
    }
}
