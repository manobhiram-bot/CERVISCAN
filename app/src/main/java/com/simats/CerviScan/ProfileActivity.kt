package com.simats.CerviScan

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.bumptech.glide.Glide
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody

class ProfileActivity : AppCompatActivity() {

    private lateinit var etName: EditText
    private lateinit var etAge: EditText
    private lateinit var etMobile: EditText
    private lateinit var etGender: EditText
    private lateinit var etLocation: EditText
    private lateinit var btnEdit: Button
    private lateinit var cvEditProfileImage: CardView
    private lateinit var ivProfileImage: ImageView
    private lateinit var tvEmail: TextView
    private var isEditing = false
    private var selectedImageUri: Uri? = null
    private var isImageChanged = false

    private lateinit var imagePickerLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        etName = findViewById(R.id.etName)
        etAge = findViewById(R.id.etAge)
        etMobile = findViewById(R.id.etMobile)
        etGender = findViewById(R.id.etGender)
        etLocation = findViewById(R.id.etLocation)
        tvEmail = findViewById(R.id.tvEmail)
        btnEdit = findViewById(R.id.btnEdit)
        cvEditProfileImage = findViewById(R.id.cvEditProfileImage)
        ivProfileImage = findViewById(R.id.ivProfileImage)

        loadProfileData()
        fetchLatestProfileFromServer()

        val btnBack: ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        btnEdit.setOnClickListener {
            toggleEditMode()
        }

        imagePickerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val data: Intent? = result.data
                val imageUri: Uri? = data?.data
                if (imageUri != null) {
                    val savedUri = saveImageToInternalStorage(imageUri)
                    if (savedUri != null) {
                        selectedImageUri = savedUri
                        isImageChanged = true
                        Glide.with(this)
                            .load(selectedImageUri)
                            .placeholder(R.drawable.ic_person)
                            .error(R.drawable.ic_person)
                            .into(ivProfileImage)
                        Toast.makeText(this, "Profile picture updated", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(this, "Failed to save profile picture", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }

        cvEditProfileImage.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
            imagePickerLauncher.launch(intent)
        }

        val btnPrivacy: Button = findViewById(R.id.btnPrivacy)
        btnPrivacy.setOnClickListener {
            val intent = Intent(this, PrivacyPolicyActivity::class.java)
            startActivity(intent)
        }

        val btnDeleteAccount: Button = findViewById(R.id.btnDeleteAccount)
        btnDeleteAccount.setOnClickListener {
            showDeleteAccountConfirmationDialog1()
        }
    }

    override fun onResume() {
        super.onResume()
        fetchLatestProfileFromServer()
    }

    private fun loadProfileData() {
        isImageChanged = false
        val sharedPref = getSharedPreferences("UserProfile", Activity.MODE_PRIVATE)
        val name = sharedPref.getString("name", "") ?: ""
        val email = sharedPref.getString("email", "") ?: ""
        val age = sharedPref.getString("age", "") ?: ""
        val mobile = sharedPref.getString("mobile", "") ?: ""
        val gender = sharedPref.getString("gender", "") ?: ""
        val location = sharedPref.getString("location", "") ?: ""

        etName.setText(if (name.isNotBlank()) name else "Doctor")
        tvEmail.text = if (email.isNotBlank()) email else "doctor@gmail.com"
        etAge.setText(age)
        etMobile.setText(mobile)
        etGender.setText(gender)
        etLocation.setText(location)
        
        val localFile = java.io.File(filesDir, "profile_image.jpg")
        if (localFile.exists()) {
            selectedImageUri = Uri.fromFile(localFile)
            Glide.with(this)
                .load(localFile)
                .placeholder(R.drawable.ic_person)
                .error(R.drawable.ic_person)
                .into(ivProfileImage)
        } else {
            val uriString = sharedPref.getString("profileImage", null)
            if (!uriString.isNullOrEmpty()) {
                try {
                    selectedImageUri = Uri.parse(uriString)
                    Glide.with(this)
                        .load(selectedImageUri)
                        .placeholder(R.drawable.ic_person)
                        .error(R.drawable.ic_person)
                        .into(ivProfileImage)
                } catch (e: Exception) {
                    e.printStackTrace()
                    ivProfileImage.setImageResource(R.drawable.ic_person)
                }
            } else {
                ivProfileImage.setImageResource(R.drawable.ic_person)
            }
        }
    }

    private fun fetchLatestProfileFromServer() {
        val sharedPref = getSharedPreferences("UserProfile", Activity.MODE_PRIVATE)
        val userId = sharedPref.getInt("user_id", -1)
        if (userId <= 0) return

        com.simats.CerviScan.network.RetrofitClient.instance.getProfile(userId)
            .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.LoginResponse> {
                override fun onResponse(
                    call: retrofit2.Call<com.simats.CerviScan.network.LoginResponse>,
                    response: retrofit2.Response<com.simats.CerviScan.network.LoginResponse>
                ) {
                    if (response.isSuccessful && response.body()?.status == "success") {
                        val profile = response.body() ?: return
                        
                        // Update UI if not actively editing
                        if (!isEditing) {
                            profile.name?.let { if (it.isNotBlank()) etName.setText(it) }
                            profile.email?.let { if (it.isNotBlank()) tvEmail.text = it }
                            profile.age?.let { etAge.setText(it) }
                            profile.mobile?.let { etMobile.setText(it) }
                            profile.gender?.let { etGender.setText(it) }
                            profile.location?.let { etLocation.setText(it) }

                            if (!profile.profileImage.isNullOrBlank()) {
                                Glide.with(this@ProfileActivity)
                                    .load(profile.profileImage)
                                    .placeholder(R.drawable.ic_person)
                                    .error(R.drawable.ic_person)
                                    .into(ivProfileImage)
                            }
                        }

                        // Persist to SharedPreferences
                        with(sharedPref.edit()) {
                            profile.name?.let { putString("name", it) }
                            profile.email?.let { putString("email", it) }
                            profile.age?.let { putString("age", it) }
                            profile.mobile?.let { putString("mobile", it) }
                            profile.gender?.let { putString("gender", it) }
                            profile.location?.let { putString("location", it) }
                            profile.profileImage?.let { putString("profileImage", it) }
                            apply()
                        }
                    }
                }

                override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.LoginResponse>, t: Throwable) {
                    // Ignore background sync errors, fallback to local cache
                }
            })
    }

    private fun saveProfileData() {
        val sharedPref = getSharedPreferences("UserProfile", Activity.MODE_PRIVATE)
        val userId = sharedPref.getInt("user_id", -1)
        
        val name = etName.text.toString()
        val age = etAge.text.toString()
        val mobile = etMobile.text.toString()
        val gender = etGender.text.toString()
        val location = etLocation.text.toString()

        // 1. Save Locally
        with(sharedPref.edit()) {
            putString("name", name)
            putString("age", age)
            putString("mobile", mobile)
            putString("gender", gender)
            putString("location", location)
            selectedImageUri?.let {
                putString("profileImage", it.toString())
            }
            apply()
        }

        // 2. Sync with Server
        if (userId != -1) {
            val imageUri = selectedImageUri
            if (isImageChanged && imageUri != null && (imageUri.scheme == "file" || imageUri.scheme == "content")) {
                uploadProfileImageAndSave(imageUri, name, age, mobile, gender, location)
            } else {
                val serverImageUrl = sharedPref.getString("profileImage", "") ?: ""
                syncProfileWithServer(userId, name, age, mobile, gender, location, serverImageUrl)
            }
        }
    }

    private fun uploadProfileImageAndSave(
        uri: Uri,
        name: String,
        age: String,
        mobile: String,
        gender: String,
        location: String
    ) {
        val sharedPref = getSharedPreferences("UserProfile", MODE_PRIVATE)
        val userId = sharedPref.getInt("user_id", -1)
        if (userId == -1) return

        try {
            val inputStream = if (uri.scheme == "file") {
                java.io.FileInputStream(java.io.File(uri.path ?: ""))
            } else {
                contentResolver.openInputStream(uri)
            } ?: return
            val fileBytes = inputStream.readBytes()
            inputStream.close()

            val mimeType = if (uri.scheme == "file") "image/jpeg" else (contentResolver.getType(uri) ?: "image/jpeg")
            val extension = when (mimeType) {
                "image/png" -> "png"
                else -> "jpg"
            }

            val requestFile = fileBytes.toRequestBody(mimeType.toMediaTypeOrNull())
            val imagePart = okhttp3.MultipartBody.Part.createFormData("image", "profile.$extension", requestFile)

            com.simats.CerviScan.network.RetrofitClient.instance.uploadImage(imagePart)
                .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.ImageUploadResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.simats.CerviScan.network.ImageUploadResponse>,
                        response: retrofit2.Response<com.simats.CerviScan.network.ImageUploadResponse>
                    ) {
                        if (response.isSuccessful && response.body()?.status == "success") {
                            val serverUrl = response.body()?.imageUrl ?: ""
                            
                            // Save server image URL locally in SharedPreferences
                            sharedPref.edit().putString("profileImage", serverUrl).apply()
                            selectedImageUri = Uri.parse(serverUrl)
                            isImageChanged = false
 
                            syncProfileWithServer(userId, name, age, mobile, gender, location, serverUrl)
                        } else {
                            val msg = response.body()?.message ?: "Upload failed"
                            Toast.makeText(this@ProfileActivity, "Image upload failed: $msg", Toast.LENGTH_SHORT).show()
                            syncProfileWithServer(userId, name, age, mobile, gender, location, "")
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.ImageUploadResponse>, t: Throwable) {
                        Toast.makeText(this@ProfileActivity, "Image upload failed: ${t.message}", Toast.LENGTH_SHORT).show()
                        syncProfileWithServer(userId, name, age, mobile, gender, location, "")
                    }
                })
        } catch (e: Exception) {
            e.printStackTrace()
            syncProfileWithServer(userId, name, age, mobile, gender, location, "")
        }
    }

    private fun syncProfileWithServer(
        userId: Int,
        name: String,
        age: String,
        mobile: String,
        gender: String,
        location: String,
        imageUrl: String
    ) {
        val request = com.simats.CerviScan.network.ProfileUpdateRequest(
            userId = userId,
            name = name,
            age = age,
            mobile = mobile,
            gender = gender,
            location = location,
            profileImage = imageUrl
        )
        com.simats.CerviScan.network.RetrofitClient.instance.updateProfile(request)
            .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                override fun onResponse(
                    call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                    response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                ) {
                    if (response.isSuccessful && response.body()?.status == "success") {
                        Toast.makeText(this@ProfileActivity, "Profile synced to cloud", Toast.LENGTH_SHORT).show()
                    } else {
                        val msg = response.body()?.message ?: "Sync failed"
                        Toast.makeText(this@ProfileActivity, "Cloud sync failed: $msg", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                    Toast.makeText(this@ProfileActivity, "Sync failed: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }


    private fun toggleEditMode() {
        isEditing = !isEditing
        val bgResource = R.drawable.bg_input_field
        
        if (isEditing) {
            btnEdit.text = "Save"
            enableFields(true)
            cvEditProfileImage.visibility = View.VISIBLE
            
            // Set background and padding for better edit UX
            setFieldsBackground(bgResource)
            setFieldsPadding(32, 16)
            
            etName.requestFocus()
            Toast.makeText(this, "Editing enabled", Toast.LENGTH_SHORT).show()
        } else {
            btnEdit.text = "Edit"
            enableFields(false)
            cvEditProfileImage.visibility = View.GONE
            
            // Remove background and padding
            setFieldsBackground(null)
            setFieldsPadding(0, 0)
            
            saveProfileData()
            Toast.makeText(this, "Profile updated successfully", Toast.LENGTH_SHORT).show()
        }
    }

    private fun enableFields(enabled: Boolean) {
        etName.isEnabled = enabled
        etAge.isEnabled = enabled
        etMobile.isEnabled = enabled
        etGender.isEnabled = enabled
        etLocation.isEnabled = enabled
    }

    private fun setFieldsBackground(bg: Int?) {
        if (bg != null) {
            etName.setBackgroundResource(bg)
            etAge.setBackgroundResource(bg)
            etMobile.setBackgroundResource(bg)
            etGender.setBackgroundResource(bg)
            etLocation.setBackgroundResource(bg)
        } else {
            etName.background = null
            etAge.background = null
            etMobile.background = null
            etGender.background = null
            etLocation.background = null
        }
    }

    private fun setFieldsPadding(h: Int, v: Int) {
        etName.setPadding(h, v, h, v)
        etAge.setPadding(h, v, h, v)
        etMobile.setPadding(h, v, h, v)
        etGender.setPadding(h, v, h, v)
        etLocation.setPadding(h, v, h, v)
    }

    private fun saveImageToInternalStorage(uri: Uri): Uri? {
        return try {
            val inputStream = contentResolver.openInputStream(uri) ?: return null
            val file = java.io.File(filesDir, "profile_image.jpg")
            val outputStream = java.io.FileOutputStream(file)
            inputStream.use { input ->
                outputStream.use { output ->
                    input.copyTo(output)
                }
            }
            Uri.fromFile(file)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun showDeleteAccountConfirmationDialog1() {
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setTitle("Delete Account")
            .setMessage("Are you sure you want to permanently delete your account? This action cannot be undone.")
            .setPositiveButton("Next") { _, _ ->
                showDeleteAccountConfirmationDialog2()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showDeleteAccountConfirmationDialog2() {
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setTitle("Final Confirmation")
            .setMessage("This will permanently delete your profile, scan history, and account credentials. Do you really want to proceed?")
            .setPositiveButton("Delete Permanently") { _, _ ->
                performDeleteAccount()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun performDeleteAccount() {
        val sharedPref = getSharedPreferences("UserProfile", MODE_PRIVATE)
        val userId = sharedPref.getInt("user_id", -1)
        
        if (userId == -1) {
            Toast.makeText(this, "Error: User ID not found", Toast.LENGTH_SHORT).show()
            return
        }

        val request = com.simats.CerviScan.network.DeleteAccountRequest(userId)
        
        com.simats.CerviScan.network.RetrofitClient.instance.deleteAccount(request)
            .enqueue(object : retrofit2.Callback<com.simats.CerviScan.network.SimpleResponse> {
                override fun onResponse(
                    call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>,
                    response: retrofit2.Response<com.simats.CerviScan.network.SimpleResponse>
                ) {
                    if (response.isSuccessful && response.body()?.status == "success") {
                        // Clear locally saved session
                        sharedPref.edit().clear().apply()
                        
                        // Delete cached profile image if exists
                        val localFile = java.io.File(filesDir, "profile_image.jpg")
                        if (localFile.exists()) {
                            localFile.delete()
                        }
                        
                        Toast.makeText(this@ProfileActivity, "Account deleted successfully", Toast.LENGTH_LONG).show()
                        
                        // Navigate to SignUpActivity and clear activity back stack
                        val intent = Intent(this@ProfileActivity, SignUpActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    } else {
                        val errorMsg = response.body()?.message ?: "Server error"
                        Toast.makeText(this@ProfileActivity, "Failed to delete: $errorMsg", Toast.LENGTH_LONG).show()
                    }
                }

                override fun onFailure(call: retrofit2.Call<com.simats.CerviScan.network.SimpleResponse>, t: Throwable) {
                    Toast.makeText(this@ProfileActivity, "Network error: ${t.message}", Toast.LENGTH_LONG).show()
                }
            })
    }
}
