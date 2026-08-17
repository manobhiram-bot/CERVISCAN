package com.simats.CerviScan

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.EditText
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class VerifyEmailActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_verify_email)

        val btnBack: ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        val email = intent.getStringExtra("EMAIL") ?: ""
        val tvErrorOtp: android.widget.TextView = findViewById(R.id.tvErrorOtp)

        val etOtp1: EditText = findViewById(R.id.etOtp1)
        val etOtp2: EditText = findViewById(R.id.etOtp2)
        val etOtp3: EditText = findViewById(R.id.etOtp3)
        val etOtp4: EditText = findViewById(R.id.etOtp4)

        setupOtpListeners(etOtp1, etOtp2, etOtp3, etOtp4)

        val btnVerify: android.widget.Button = findViewById(R.id.btnVerify)
        btnVerify.setOnClickListener {
            val enteredOtp = etOtp1.text.toString() + etOtp2.text.toString() + 
                            etOtp3.text.toString() + etOtp4.text.toString()

            if (enteredOtp.length == 4) {
                btnVerify.isEnabled = false
                btnVerify.text = "Verifying..."
                
                val request = com.simats.CerviScan.network.VerifyOtpRequest(email, enteredOtp)
                com.simats.CerviScan.network.RetrofitClient.instance.verifyOtp(request)
                    .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                        override fun onResponse(
                            call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                            response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                        ) {
                            btnVerify.isEnabled = true
                            btnVerify.text = "Verify & Continue"
                            val body = response.body()
                            if (response.isSuccessful && body != null && body.status == "success") {
                                tvErrorOtp.visibility = android.view.View.GONE
                                val intent = android.content.Intent(this@VerifyEmailActivity, CreateNewPasswordActivity::class.java)
                                intent.putExtra("EMAIL", email)
                                startActivity(intent)
                                finish()
                            } else {
                                val errorMsg = body?.message ?: "Wrong OTP. Please try again."
                                tvErrorOtp.text = errorMsg
                                tvErrorOtp.visibility = android.view.View.VISIBLE
                            }
                        }

                        override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                            btnVerify.isEnabled = true
                            btnVerify.text = "Verify & Continue"
                            android.widget.Toast.makeText(this@VerifyEmailActivity, "Network Error: ${t.message}", android.widget.Toast.LENGTH_LONG).show()
                        }
                    })
            } else {
                android.widget.Toast.makeText(this, "Please enter all 4 digits", android.widget.Toast.LENGTH_SHORT).show()
            }
        }

        val tvResendCode: android.widget.TextView = findViewById(R.id.tvResendCode)
        tvResendCode.setOnClickListener {
            if (email.isNotEmpty()) {
                tvResendCode.isEnabled = false
                val request = com.simats.CerviScan.network.SendOtpRequest(email)
                com.simats.CerviScan.network.RetrofitClient.instance.sendOtp(request)
                    .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                        override fun onResponse(
                            call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                            response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                        ) {
                            tvResendCode.isEnabled = true
                            val body = response.body()
                            if (response.isSuccessful && body != null && body.status == "success") {
                                android.widget.Toast.makeText(this@VerifyEmailActivity, "OTP resent successfully", android.widget.Toast.LENGTH_SHORT).show()
                            } else {
                                val errorMsg = body?.message ?: "Failed to resend OTP"
                                android.widget.Toast.makeText(this@VerifyEmailActivity, errorMsg, android.widget.Toast.LENGTH_SHORT).show()
                            }
                        }

                        override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                            tvResendCode.isEnabled = true
                            android.widget.Toast.makeText(this@VerifyEmailActivity, "Error: ${t.message}", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    })
            }
        }
    }

    private fun setupOtpListeners(vararg editTexts: EditText) {
        for (i in editTexts.indices) {
            editTexts[i].addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    if (s?.length == 1 && i < editTexts.size - 1) {
                        editTexts[i + 1].requestFocus()
                    }
                }
                override fun afterTextChanged(s: Editable?) {
                    if (s?.isEmpty() == true && i > 0) {
                        editTexts[i - 1].requestFocus()
                    }
                }
            })
        }
    }
}
