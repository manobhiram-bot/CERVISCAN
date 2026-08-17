package com.simats.CerviScan.network

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.GET
import retrofit2.http.Query

interface ApiService {

    @POST("login.php")
    fun login(@Body request: LoginRequest): Call<LoginResponse>

    @POST("signup.php")
    fun signup(@Body request: SignupRequest): Call<SimpleResponse>

    @POST("save_patient.php")
    fun savePatient(@Body request: PatientRequest): Call<PatientResponse>

    @retrofit2.http.Multipart
    @POST("upload_and_save_scan.php")
    fun uploadAndSaveScan(
        @retrofit2.http.Part("patient_id") patientId: okhttp3.RequestBody,
        @retrofit2.http.Part("label") label: okhttp3.RequestBody,
        @retrofit2.http.Part("confidence") confidence: okhttp3.RequestBody,
        @retrofit2.http.Part xray: okhttp3.MultipartBody.Part
    ): Call<ScanUploadResponse>

    @GET("get_scan_history.php")
    fun getScanHistory(@Query("user_id") userId: Int): Call<ScanHistoryResponse>

    @POST("update_profile.php")
    fun updateProfile(@Body request: ProfileUpdateRequest): Call<SimpleResponse>

    @retrofit2.http.FormUrlEncoded
    @POST("delete_scan.php")
    fun deleteScan(@retrofit2.http.Field("scan_id") scanId: Int): Call<SimpleResponse>

    @POST("delete_account.php")
    fun deleteAccount(@Body request: DeleteAccountRequest): Call<SimpleResponse>

    @retrofit2.http.Multipart
    @POST("upload_image.php")
    fun uploadImage(
        @retrofit2.http.Part image: okhttp3.MultipartBody.Part
    ): Call<ImageUploadResponse>

    @POST("send_otp.php")
    fun sendOtp(@Body request: SendOtpRequest): Call<SimpleResponse>

    @POST("verify_otp.php")
    fun verifyOtp(@Body request: VerifyOtpRequest): Call<SimpleResponse>

    @POST("reset_password.php")
    fun resetPassword(@Body request: ResetPasswordRequest): Call<SimpleResponse>
}

interface AiService {
    @retrofit2.http.Multipart
    @POST("predict")
    fun predictImage(
        @retrofit2.http.Part file: okhttp3.MultipartBody.Part
    ): Call<AiResponse>
}

data class AiResponse(
    val result: String,
    val confidence: String,
    val class_index: Int
)
