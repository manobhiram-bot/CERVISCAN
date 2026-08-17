package com.simats.CerviScan

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.AnimationUtils
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Find the logo container for animation
        val logoContainer = findViewById<LinearLayout>(R.id.llLogoContainer)
        
        // Load and start fade-in animation
        val fadeIn = AnimationUtils.loadAnimation(this, android.R.anim.fade_in)
        fadeIn.duration = 1500
        logoContainer.startAnimation(fadeIn)

        // Delay for 3 seconds and then move to next screen
        Handler(Looper.getMainLooper()).postDelayed({
            val sharedPref = getSharedPreferences("UserProfile", MODE_PRIVATE)
            val userId = sharedPref.getInt("user_id", -1)
            
            val intent = if (userId != -1) {
                Intent(this, DashboardActivity::class.java)
            } else {
                Intent(this, LoginActivity::class.java)
            }
            
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, 3000)
    }
}
