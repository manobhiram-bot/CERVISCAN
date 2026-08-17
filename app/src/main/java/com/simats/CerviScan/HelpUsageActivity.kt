package com.simats.CerviScan

import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class HelpUsageActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_help_usage)

        val btnBack: ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        val btnBackDashboard: Button = findViewById(R.id.btnBackDashboard)
        btnBackDashboard.setOnClickListener {
            finish() // Since it was opened from dashboard
        }
    }
}
