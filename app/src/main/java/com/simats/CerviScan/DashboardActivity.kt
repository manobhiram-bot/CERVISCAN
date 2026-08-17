package com.simats.CerviScan

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView

import com.bumptech.glide.Glide

class DashboardActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        loadUserData()

        val btnLogout: Button = findViewById(R.id.btnLogout)
        btnLogout.setOnClickListener {
            val sharedPref = getSharedPreferences("UserProfile", android.app.Activity.MODE_PRIVATE)
            sharedPref.edit().clear().apply()
            
            // Delete local cached profile picture on logout to prevent state leakage
            val localFile = java.io.File(filesDir, "profile_image.jpg")
            if (localFile.exists()) {
                localFile.delete()
            }
            
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }

        val cardUpload: android.view.View = findViewById(R.id.cardUpload)
        cardUpload.setOnClickListener {
            val intent = Intent(this, PatientDetailsActivity::class.java)
            startActivity(intent)
        }

        val cardHistory: android.view.View = findViewById(R.id.cardHistory)
        cardHistory.setOnClickListener {
            val intent = Intent(this, ScanHistoryActivity::class.java)
            startActivity(intent)
        }

        val cardProfile: android.view.View = findViewById(R.id.cardProfile)
        cardProfile.setOnClickListener {
            val intent = Intent(this, ProfileActivity::class.java)
            startActivity(intent)
        }

        val cardHelp: android.view.View = findViewById(R.id.cardHelp)
        cardHelp.setOnClickListener {
            val intent = Intent(this, HelpUsageActivity::class.java)
            startActivity(intent)
        }

        val cardAbout: android.view.View = findViewById(R.id.cardAbout)
        cardAbout.setOnClickListener {
            val intent = Intent(this, AboutActivity::class.java)
            startActivity(intent)
        }


        val cvProfileThumb: CardView = findViewById(R.id.cvProfileThumb)
        cvProfileThumb.setOnClickListener {
            val intent = Intent(this, ProfileActivity::class.java)
            startActivity(intent)
        }
    }

    private fun loadUserData() {
        val sharedPref = getSharedPreferences("UserProfile", Activity.MODE_PRIVATE)
        val tvUserName: TextView = findViewById(R.id.tvUserName)
        val ivProfileThumb: ImageView = findViewById(R.id.ivProfileThumb)
        val userId = sharedPref.getInt("user_id", -1)

        val name = sharedPref.getString("name", "") ?: ""
        tvUserName.text = name
        
        val localFile = java.io.File(filesDir, "profile_image.jpg")
        if (localFile.exists()) {
            Glide.with(this)
                .load(localFile)
                .placeholder(R.drawable.ic_person)
                .error(R.drawable.ic_person)
                .into(ivProfileThumb)
        } else {
            val uriString = sharedPref.getString("profileImage", null)
            if (!uriString.isNullOrEmpty()) {
                try {
                    Glide.with(this)
                        .load(Uri.parse(uriString))
                        .placeholder(R.drawable.ic_person)
                        .error(R.drawable.ic_person)
                        .into(ivProfileThumb)
                } catch (e: Exception) {
                    e.printStackTrace()
                    ivProfileThumb.setImageResource(R.drawable.ic_person)
                }
            } else {
                ivProfileThumb.setImageResource(R.drawable.ic_person)
            }
        }

        // Live cloud sync
        if (userId > 0) {
            com.simats.CerviScan.network.RetrofitClient.instance.getProfile(userId)
                .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.LoginResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.simats.CerviScan.network.LoginResponse>,
                        response: retrofit2.Response<com.simats.CerviScan.network.LoginResponse>
                    ) {
                        if (response.isSuccessful && response.body()?.status == "success") {
                            val profile = response.body() ?: return
                            profile.name?.let {
                                tvUserName.text = it
                                sharedPref.edit().putString("name", it).apply()
                            }
                            if (!profile.profileImage.isNullOrBlank()) {
                                sharedPref.edit().putString("profileImage", profile.profileImage).apply()
                                Glide.with(this@DashboardActivity)
                                    .load(profile.profileImage)
                                    .placeholder(R.drawable.ic_person)
                                    .error(R.drawable.ic_person)
                                    .into(ivProfileThumb)
                            }
                        }
                    }
                    override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.LoginResponse>, t: Throwable) {}
                })
        }
    }

    override fun onResume() {
        super.onResume()
        loadUserData() // Refresh data if updated in Profile
    }
}
