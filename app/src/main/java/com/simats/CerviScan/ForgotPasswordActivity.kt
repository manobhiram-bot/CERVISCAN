package com.simats.CerviScan

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class ForgotPasswordActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_forgot_password)

        val btnBack: ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        val tvLoginBackLink: TextView = findViewById(R.id.tvLoginBackLink)
        tvLoginBackLink.setOnClickListener {
            finish()
        }

        val btnSendReset: Button = findViewById(R.id.btnSendReset)
        btnSendReset.setOnClickListener {
            val email = findViewById<android.widget.EditText>(R.id.etResetEmail).text.toString().trim()
            if (email.isNotEmpty()) {
                btnSendReset.isEnabled = false
                btnSendReset.text = "Sending..."

                val request = com.simats.CerviScan.network.SendOtpRequest(email)
                com.simats.CerviScan.network.RetrofitClient.instance.sendOtp(request)
                    .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                        override fun onResponse(
                            call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                            response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                        ) {
                            btnSendReset.isEnabled = true
                            btnSendReset.text = "Send Reset Link"
                            val body = response.body()
                            if (response.isSuccessful && body != null && body.status == "success") {
                                android.widget.Toast.makeText(this@ForgotPasswordActivity, "OTP sent successfully to $email", android.widget.Toast.LENGTH_LONG).show()
                                val intent = Intent(this@ForgotPasswordActivity, VerifyEmailActivity::class.java)
                                intent.putExtra("EMAIL", email)
                                startActivity(intent)
                            } else {
                                val errorMsg = body?.message ?: "Failed to send OTP"
                                android.widget.Toast.makeText(this@ForgotPasswordActivity, errorMsg, android.widget.Toast.LENGTH_LONG).show()
                            }
                        }

                        override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                            btnSendReset.isEnabled = true
                            btnSendReset.text = "Send Reset Link"
                            android.widget.Toast.makeText(this@ForgotPasswordActivity, "Network Error: ${t.message}", android.widget.Toast.LENGTH_LONG).show()
                        }
                    })
            } else {
                android.widget.Toast.makeText(this, "Please enter your email", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
    }
}
