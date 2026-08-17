package com.simats.CerviScan

import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.TextView
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

        val btnRegister: android.widget.Button = findViewById(R.id.btnRegister)
        val etFullName: android.widget.EditText = findViewById(R.id.etFullName)
        val etEmail: android.widget.EditText = findViewById(R.id.etEmail)
        val etPassword: android.widget.EditText = findViewById(R.id.etPassword)
        val pbLoading: android.widget.ProgressBar = findViewById(R.id.pbSignUpLoading)

        btnRegister.setOnClickListener {
            val name = etFullName.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                android.widget.Toast.makeText(this, "Please fill in name, email and password", android.widget.Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            pbLoading.visibility = android.view.View.VISIBLE
            btnRegister.isEnabled = false

            val request = com.simats.CerviScan.network.SignupRequest(name, email, password)
            com.simats.CerviScan.network.RetrofitClient.instance.signup(request)
                .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                        response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                    ) {
                        pbLoading.visibility = android.view.View.GONE
                        btnRegister.isEnabled = true

                        val signUpResponse = response.body()
                        if (response.isSuccessful && signUpResponse != null && signUpResponse.status == "success") {
                            android.widget.Toast.makeText(this@SignUpActivity, "Registered successfully! Please login.", android.widget.Toast.LENGTH_SHORT).show()
                            val intent = Intent(this@SignUpActivity, LoginActivity::class.java)
                            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                            startActivity(intent)
                            finish()
                        } else {
                            val msg = signUpResponse?.message ?: "Signup failed"
                            android.widget.Toast.makeText(this@SignUpActivity, msg, android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                        pbLoading.visibility = android.view.View.GONE
                        btnRegister.isEnabled = true
                        android.widget.Toast.makeText(this@SignUpActivity, "Network Error: ${t.message}", android.widget.Toast.LENGTH_SHORT).show()
                    }
                })
        }
    }
}
