package com.simats.CerviScan.network

import com.google.gson.annotations.SerializedName

// Authentication Models
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val status: String,
    val message: String?,
    @SerializedName("user_id") val userId: Int?,
    val name: String?,
    val email: String?,
    val age: String?,
    val mobile: String?,
    val gender: String?,
    val location: String?,
    @SerializedName("profile_image") val profileImage: String?
)

data class SignupRequest(
    val name: String,
    val email: String,
    val password: String
)

data class SimpleResponse(
    val status: String,
    val message: String
)

// Patient Models
data class PatientRequest(
    @SerializedName("user_id") val userId: Int,
    val name: String,
    val age: Int,
    val gender: String,
    @SerializedName("case_id") val caseId: Int
)

data class PatientResponse(
    val status: String,
    @SerializedName("patient_id") val patientId: Int?,
    val message: String?
)

data class ScanUploadResponse(
    val status: String,
    @SerializedName("scan_id") val scanId: Int?,
    @SerializedName("image_url") val imageUrl: String?,
    val message: String?
)

// Scan Models
data class ScanHistoryResponse(
    val status: String,
    val history: List<ScanItem>?
)

data class ScanItem(
    val id: Int,
    @SerializedName("patient_name") val patientName: String,
    val age: Int,
    val gender: String,
    val prediction: String,
    val confidence: String,
    @SerializedName("image_path") val imagePath: String,
    @SerializedName("created_at") val createdAt: String
)

data class ProfileUpdateRequest(
    @SerializedName("user_id") val userId: Int,
    val name: String,
    val age: String,
    val mobile: String,
    val gender: String,
    val location: String,
    @SerializedName("profile_image") val profileImage: String
)

data class DeleteAccountRequest(
    @SerializedName("user_id") val userId: Int
)

data class ImageUploadResponse(
    val status: String,
    @SerializedName("image_name") val imageName: String?,
    @SerializedName("image_url") val imageUrl: String?,
    val message: String?
)

data class SendOtpRequest(
    val email: String
)

data class VerifyOtpRequest(
    val email: String,
    val otp: String
)

data class ResetPasswordRequest(
    val email: String,
    val password: String
)


