package com.simats.CerviScan

import android.content.Intent
import android.os.Bundle
import android.text.method.HideReturnsTransformationMethod
import android.text.method.PasswordTransformationMethod
import android.view.MotionEvent
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class CreateNewPasswordActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_new_password)

        val btnBack: ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        val tvBackToLogin: TextView = findViewById(R.id.tvBackToLogin)
        tvBackToLogin.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
            finish()
        }

        val email = intent.getStringExtra("EMAIL") ?: ""

        val etNewPassword: EditText = findViewById(R.id.etNewPassword)
        val etConfirmPassword: EditText = findViewById(R.id.etConfirmPassword)

        val btnResetPassword: android.widget.Button = findViewById(R.id.btnResetPassword)
        btnResetPassword.setOnClickListener {
            val newPassword = etNewPassword.text.toString().trim()
            val confirmPassword = etConfirmPassword.text.toString().trim()

            if (newPassword.isEmpty()) {
                android.widget.Toast.makeText(this, "Please enter new password", android.widget.Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (newPassword != confirmPassword) {
                android.widget.Toast.makeText(this, "Passwords do not match", android.widget.Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnResetPassword.isEnabled = false
            btnResetPassword.text = "Resetting..."

            val request = com.simats.CerviScan.network.ResetPasswordRequest(email, newPassword)
            com.simats.CerviScan.network.RetrofitClient.instance.resetPassword(request)
                .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                        response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                    ) {
                        btnResetPassword.isEnabled = true
                        btnResetPassword.text = "Reset Password"
                        val body = response.body()
                        if (response.isSuccessful && body != null && body.status == "success") {
                            val intent = Intent(this@CreateNewPasswordActivity, ResetSuccessActivity::class.java)
                            startActivity(intent)
                            finish()
                        } else {
                            val errorMsg = body?.message ?: "Failed to reset password"
                            android.widget.Toast.makeText(this@CreateNewPasswordActivity, errorMsg, android.widget.Toast.LENGTH_LONG).show()
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                        btnResetPassword.isEnabled = true
                        btnResetPassword.text = "Reset Password"
                        android.widget.Toast.makeText(this@CreateNewPasswordActivity, "Network Error: ${t.message}", android.widget.Toast.LENGTH_LONG).show()
                    }
                })
        }

        setupPasswordToggle(etNewPassword)
        setupPasswordToggle(etConfirmPassword)
    }

    private fun setupPasswordToggle(editText: EditText) {
        var isVisible = false
        editText.setOnTouchListener { v, event ->
            if (event.action == MotionEvent.ACTION_UP) {
                val drawableEnd = editText.compoundDrawables[2]
                if (drawableEnd != null && event.x >= (editText.width - editText.paddingEnd - drawableEnd.intrinsicWidth)) {
                    isVisible = !isVisible
                    if (isVisible) {
                        editText.transformationMethod = HideReturnsTransformationMethod.getInstance()
                        editText.setCompoundDrawablesWithIntrinsicBounds(
                            null,
                            null,
                            ContextCompat.getDrawable(this, R.drawable.ic_visibility_off),
                            null
                        )
                    } else {
                        editText.transformationMethod = PasswordTransformationMethod.getInstance()
                        editText.setCompoundDrawablesWithIntrinsicBounds(
                            null,
                            null,
                            ContextCompat.getDrawable(this, R.drawable.ic_visibility),
                            null
                        )
                    }
                    editText.setSelection(editText.text.length)
                    v.performClick()
                    return@setOnTouchListener true
                }
            }
            false
        }
    }
}
