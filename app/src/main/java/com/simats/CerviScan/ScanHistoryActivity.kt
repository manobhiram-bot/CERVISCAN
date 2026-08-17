package com.simats.CerviScan

import android.os.Bundle
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class ScanHistoryActivity : AppCompatActivity() {
    private lateinit var rvScanHistory: androidx.recyclerview.widget.RecyclerView
    private lateinit var pbLoading: android.widget.ProgressBar
    private lateinit var tvEmpty: android.widget.TextView
    private var fullHistoryList: List<com.simats.CerviScan.network.ScanItem> = emptyList()
    private var adapter: ScanHistoryAdapter? = null
    private var currentSortOption = 0 // Default to "Latest First"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scan_history)

        rvScanHistory = findViewById(R.id.rvScanHistory)
        pbLoading = findViewById(R.id.pbHistoryLoading)
        tvEmpty = findViewById(R.id.tvEmptyHistory)

        rvScanHistory.layoutManager = androidx.recyclerview.widget.LinearLayoutManager(this)

        val btnBack: android.widget.ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        fetchHistory()

        val btnRefresh: android.widget.ImageButton = findViewById(R.id.btnRefresh)
        btnRefresh.setOnClickListener {
            fetchHistory()
        }

        val btnSort: android.widget.ImageButton = findViewById(R.id.btnSort)
        btnSort.setOnClickListener {
            showSortDialog()
        }
    }

    private fun showSortDialog() {
        val options = arrayOf(
            "Latest First (Date)",
            "Oldest First (Date)",
            "Patient Name (A-Z)",
            "Patient Name (Z-A)",
            "Highest Confidence",
            "Abnormal Findings First"
        )
        android.app.AlertDialog.Builder(this)
            .setTitle("Sort Reports")
            .setSingleChoiceItems(options, currentSortOption) { dialog, which ->
                currentSortOption = which
                sortHistory(which)
                dialog.dismiss()
            }
            .show()
    }

    private fun sortHistory(option: Int) {
        val sortedList = when (option) {
            0 -> fullHistoryList.sortedByDescending { it.createdAt }
            1 -> fullHistoryList.sortedBy { it.createdAt }
            2 -> fullHistoryList.sortedBy { it.patientName.lowercase() }
            3 -> fullHistoryList.sortedByDescending { it.patientName.lowercase() }
            4 -> fullHistoryList.sortedByDescending { it.confidence.replace("%", "").trim().toDoubleOrNull() ?: 0.0 }
            5 -> fullHistoryList.sortedByDescending { 
                if (it.prediction.contains("Normal", ignoreCase = true)) 0 else 1
            }
            else -> fullHistoryList
        }
        
        if (adapter == null) {
            adapter = ScanHistoryAdapter(sortedList) { item ->
                deleteScan(item)
            }
            rvScanHistory.adapter = adapter
        } else {
            adapter?.updateList(sortedList)
        }
    }

    private fun deleteScan(item: com.simats.CerviScan.network.ScanItem) {
        android.app.AlertDialog.Builder(this)
            .setTitle("Delete Report")
            .setMessage("Are you sure you want to delete this scan report for ${item.patientName}?")
            .setPositiveButton("Delete") { _, _ ->
                performDelete(item.id)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun performDelete(scanId: Int) {
        pbLoading.visibility = android.view.View.VISIBLE
        com.simats.CerviScan.network.RetrofitClient.instance.deleteScan(scanId)
            .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                override fun onResponse(
                    call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                    response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                ) {
                    pbLoading.visibility = android.view.View.GONE
                    if (response.isSuccessful && response.body()?.status == "success") {
                        android.widget.Toast.makeText(this@ScanHistoryActivity, "Deleted successfully", android.widget.Toast.LENGTH_SHORT).show()
                        fetchHistory() // Refresh the list
                    } else {
                        android.widget.Toast.makeText(this@ScanHistoryActivity, "Failed to delete", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                    pbLoading.visibility = android.view.View.GONE
                    android.widget.Toast.makeText(this@ScanHistoryActivity, "Error: ${t.message}", android.widget.Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun fetchHistory() {
        val sharedPref = getSharedPreferences("UserProfile", android.app.Activity.MODE_PRIVATE)
        val userId = sharedPref.getInt("user_id", -1)

        if (userId == -1) {
            tvEmpty.visibility = android.view.View.VISIBLE
            tvEmpty.text = "Please login first"
            return
        }

        pbLoading.visibility = android.view.View.VISIBLE
        tvEmpty.visibility = android.view.View.GONE

        com.simats.CerviScan.network.RetrofitClient.instance.getScanHistory(userId)
            .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.ScanHistoryResponse> {
                override fun onResponse(
                    call: retrofit2.Call<com.simats.CerviScan.network.ScanHistoryResponse>,
                    response: retrofit2.Response<com.simats.CerviScan.network.ScanHistoryResponse>
                ) {
                    pbLoading.visibility = android.view.View.GONE
                    val historyResponse = response.body()
                    
                    if (response.isSuccessful && historyResponse != null && historyResponse.status == "success") {
                        fullHistoryList = historyResponse.history ?: emptyList()
                        if (fullHistoryList.isEmpty()) {
                            tvEmpty.visibility = android.view.View.VISIBLE
                            rvScanHistory.visibility = android.view.View.GONE
                        } else {
                            tvEmpty.visibility = android.view.View.GONE
                            rvScanHistory.visibility = android.view.View.VISIBLE
                            // Apply current sorting option (Latest First by default)
                            sortHistory(currentSortOption)
                        }
                    } else {
                        tvEmpty.visibility = android.view.View.VISIBLE
                        tvEmpty.text = "Failed to load history"
                    }
                }

                override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.ScanHistoryResponse>, t: Throwable) {
                    pbLoading.visibility = android.view.View.GONE
                    tvEmpty.visibility = android.view.View.VISIBLE
                    tvEmpty.text = "Network Error"
                }
            })
    }
}
