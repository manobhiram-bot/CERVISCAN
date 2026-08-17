package com.simats.CerviScan

import android.content.Intent
import android.os.Bundle
import android.text.method.HideReturnsTransformationMethod
import android.text.method.PasswordTransformationMethod
import android.view.MotionEvent
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val tvSignUp: TextView = findViewById(R.id.tvSignUp)
        tvSignUp.setOnClickListener {
            val intent = Intent(this, SignUpActivity::class.java)
            startActivity(intent)
        }

        val tvForgotPassword: TextView = findViewById(R.id.tvForgotPassword)
        tvForgotPassword.setOnClickListener {
            val intent = Intent(this, ForgotPasswordActivity::class.java)
            startActivity(intent)
        }

        val btnLogin: Button = findViewById(R.id.btnLogin)
        val etEmail: EditText = findViewById(R.id.etEmail)
        val etPassword: EditText = findViewById(R.id.etPassword)
        val pbLoading: android.widget.ProgressBar = findViewById(R.id.pbLoading)

        btnLogin.setOnClickListener {
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                android.widget.Toast.makeText(this, "Please enter email and password", android.widget.Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            pbLoading.visibility = android.view.View.VISIBLE
            btnLogin.isEnabled = false

            val request = com.simats.CerviScan.network.LoginRequest(email, password)
            com.simats.CerviScan.network.RetrofitClient.instance.login(request)
                .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.LoginResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.simats.CerviScan.network.LoginResponse>,
                        response: retrofit2.Response<com.simats.CerviScan.network.LoginResponse>
                    ) {
                        pbLoading.visibility = android.view.View.GONE
                        btnLogin.isEnabled = true

                        val loginResponse = response.body()
                        if (response.isSuccessful && loginResponse != null && loginResponse.status == "success") {
                            // Save user data to SharedPreferences
                            val sharedPref = getSharedPreferences("UserProfile", android.app.Activity.MODE_PRIVATE)
                            with(sharedPref.edit()) {
                                putInt("user_id", loginResponse.userId ?: -1)
                                putString("name", loginResponse.name)
                                putString("email", loginResponse.email)
                                putString("age", loginResponse.age)
                                putString("mobile", loginResponse.mobile)
                                putString("gender", loginResponse.gender)
                                putString("location", loginResponse.location)
                                putString("profileImage", loginResponse.profileImage)
                                apply()
                            }

                            val intent = Intent(this@LoginActivity, DashboardActivity::class.java)
                            startActivity(intent)
                            finish()
                        } else {
                            val msg = loginResponse?.message ?: "Invalid email or password"
                            android.widget.Toast.makeText(this@LoginActivity, msg, android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.LoginResponse>, t: Throwable) {
                        pbLoading.visibility = android.view.View.GONE
                        btnLogin.isEnabled = true
                        android.widget.Toast.makeText(this@LoginActivity, "Network Error: ${t.message}", android.widget.Toast.LENGTH_SHORT).show()
                    }
                })
        }

        var isPasswordVisible = false

        etPassword.setOnTouchListener { v, event ->
            if (event.action == MotionEvent.ACTION_UP) {
                if (event.rawX >= (etPassword.right - etPassword.compoundDrawables[2].bounds.width())) {
                    isPasswordVisible = !isPasswordVisible
                    if (isPasswordVisible) {
                        etPassword.transformationMethod = HideReturnsTransformationMethod.getInstance()
                        etPassword.setCompoundDrawablesWithIntrinsicBounds(
                            ContextCompat.getDrawable(this, R.drawable.ic_lock),
                            null,
                            ContextCompat.getDrawable(this, R.drawable.ic_visibility_off),
                            null
                        )
                    } else {
                        etPassword.transformationMethod = PasswordTransformationMethod.getInstance()
                        etPassword.setCompoundDrawablesWithIntrinsicBounds(
                            ContextCompat.getDrawable(this, R.drawable.ic_lock),
                            null,
                            ContextCompat.getDrawable(this, R.drawable.ic_visibility),
                            null
                        )
                    }
                    etPassword.setSelection(etPassword.text.length)
                    v.performClick()
                    return@setOnTouchListener true
                }
            }
            false
        }
    }
}
