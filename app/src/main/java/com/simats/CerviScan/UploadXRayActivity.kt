package com.simats.CerviScan

import android.os.Bundle
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody

class UploadXRayActivity : AppCompatActivity() {

    private lateinit var ivXRay: android.widget.ImageView
    private lateinit var tvPlaceholder: android.widget.TextView
    private var selectedImageUri: android.net.Uri? = null
    private var patientId: Int = -1

    private val galleryLauncher = registerForActivityResult(androidx.activity.result.contract.ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            selectedImageUri = it
            ivXRay.setImageURI(it)
            tvPlaceholder.visibility = android.view.View.GONE
        }
    }

    private val cameraLauncher = registerForActivityResult(androidx.activity.result.contract.ActivityResultContracts.TakePicture()) { success ->
        if (success) {
            selectedImageUri?.let {
                ivXRay.setImageURI(it)
                tvPlaceholder.visibility = android.view.View.GONE
                // Automatically start analysis after taking photo
                showAnalysisDialog()
            }
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(androidx.activity.result.contract.ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) {
            openCamera()
        } else {
            android.widget.Toast.makeText(this, "Camera permission denied", android.widget.Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_upload_xray)

        patientId = intent.getIntExtra("patient_id", -1)
        ivXRay = findViewById(R.id.ivXRay)
        tvPlaceholder = findViewById(R.id.tvPlaceholder)

        val btnBack: android.widget.ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener { finish() }

        findViewById<android.view.View>(R.id.btnGallery).setOnClickListener {
            galleryLauncher.launch("image/*")
        }

        findViewById<android.view.View>(R.id.btnCamera).setOnClickListener {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                openCamera()
            } else {
                requestPermissionLauncher.launch(android.Manifest.permission.CAMERA)
            }
        }

        val btnAnalyze: android.widget.Button = findViewById(R.id.btnAnalyze)
        btnAnalyze.setOnClickListener {
            if (selectedImageUri == null) {
                android.widget.Toast.makeText(this, "Please select an X-ray first", android.widget.Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            showAnalysisDialog()
        }
    }

    private fun openCamera() {
        val photoFile = java.io.File.createTempFile("XRAY_", ".jpg", getExternalFilesDir(android.os.Environment.DIRECTORY_PICTURES))
        val uri = androidx.core.content.FileProvider.getUriForFile(this, "${packageName}.fileprovider", photoFile)
        selectedImageUri = uri
        cameraLauncher.launch(uri)
    }

    private fun showAnalysisDialog() {
        val dialog = android.app.Dialog(this)
        dialog.setContentView(R.layout.dialog_analyzing)
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
        dialog.setCancelable(false)
        dialog.show()

        val uri = selectedImageUri ?: return
        val inputStream = contentResolver.openInputStream(uri)
        val fileBytes = inputStream?.readBytes() ?: return
        inputStream.close()

        val mimeType = contentResolver.getType(uri) ?: "image/jpeg"
        val requestFile = fileBytes.toRequestBody(mimeType.toMediaTypeOrNull())
        val imagePart = okhttp3.MultipartBody.Part.createFormData("file", "scan.jpg", requestFile)

        com.simats.CerviScan.network.RetrofitClient.aiInstance.predictImage(imagePart)
            .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.AiResponse> {
                override fun onResponse(
                    call: retrofit2.Call<com.simats.CerviScan.network.AiResponse>,
                    response: retrofit2.Response<com.simats.CerviScan.network.AiResponse>
                ) {
                    if (response.isSuccessful) {
                        val aiResponse = response.body()
                        if (aiResponse != null) {
                            // Extract confidence as double
                            val confDouble = aiResponse.confidence.replace("%", "").toDoubleOrNull() ?: 90.0
                            uploadScanData(dialog, aiResponse.result, confDouble)
                        } else {
                            dialog.dismiss()
                            android.widget.Toast.makeText(this@UploadXRayActivity, "AI Response Empty", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        dialog.dismiss()
                        val errorBody = response.errorBody()?.string()
                        val errorMsg = try {
                            val json = org.json.JSONObject(errorBody ?: "")
                            json.getString("error")
                        } catch (e: Exception) {
                            "AI Service Error: ${response.code()}"
                        }
                        android.widget.Toast.makeText(this@UploadXRayActivity, errorMsg, android.widget.Toast.LENGTH_LONG).show()
                    }
                }

                override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.AiResponse>, t: Throwable) {
                    dialog.dismiss()
                    android.widget.Toast.makeText(this@UploadXRayActivity, "AI Connection Failed: ${t.message}", android.widget.Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun uploadScanData(dialog: android.app.Dialog, label: String, confidence: Double) {
        val uri = selectedImageUri ?: return
        
        val inputStream = contentResolver.openInputStream(uri)
        val fileBytes = inputStream?.readBytes() ?: return
        inputStream.close()

        val mimeType = contentResolver.getType(uri) ?: "image/jpeg"
        val extension = when (mimeType) {
            "image/png" -> "png"
            else -> "jpg"
        }

        val requestFile = fileBytes.toRequestBody(mimeType.toMediaTypeOrNull())
        val imagePart = okhttp3.MultipartBody.Part.createFormData("xray", "scan.$extension", requestFile)

        val pIdBody = patientId.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val labelBody = label.toRequestBody("text/plain".toMediaTypeOrNull())
        val confBody = String.format("%.2f", confidence).toRequestBody("text/plain".toMediaTypeOrNull())

        com.simats.CerviScan.network.RetrofitClient.instance.uploadAndSaveScan(pIdBody, labelBody, confBody, imagePart)
            .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.ScanUploadResponse> {
                override fun onResponse(

                    call: retrofit2.Call<com.simats.CerviScan.network.ScanUploadResponse>,
                    response: retrofit2.Response<com.simats.CerviScan.network.ScanUploadResponse>
                ) {
                    dialog.dismiss()
                    val uploadResponse = response.body()
                    if (response.isSuccessful && uploadResponse?.status == "success") {
                        val intent = android.content.Intent(this@UploadXRayActivity, ScanResultActivity::class.java)
                        intent.putExtra("prediction", label)
                        intent.putExtra("confidence", String.format("%.2f%%", confidence))
                        intent.putExtra("image_uri", selectedImageUri.toString())
                        // Pass patient details for the report
                        intent.putExtra("patient_name", this@UploadXRayActivity.intent.getStringExtra("patient_name"))
                        intent.putExtra("patient_age", this@UploadXRayActivity.intent.getStringExtra("patient_age"))
                        intent.putExtra("patient_gender", this@UploadXRayActivity.intent.getStringExtra("patient_gender"))
                        startActivity(intent)
                        finish()
                    } else {
                        android.widget.Toast.makeText(this@UploadXRayActivity, "Upload failed: ${uploadResponse?.message}", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.ScanUploadResponse>, t: Throwable) {
                    dialog.dismiss()
                    android.widget.Toast.makeText(this@UploadXRayActivity, "Network Error: ${t.message}", android.widget.Toast.LENGTH_SHORT).show()
                }
            })
    }
}
