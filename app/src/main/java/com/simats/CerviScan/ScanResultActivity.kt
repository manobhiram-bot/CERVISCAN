package com.simats.CerviScan

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide

class ScanResultActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scan_result)

        val prediction = intent.getStringExtra("prediction") ?: "Normal"
        val confidence = intent.getStringExtra("confidence") ?: "0.00%"
        val imageUri = intent.getStringExtra("image_uri")

        val tvPrediction: android.widget.TextView = findViewById(R.id.tvResultValue)
        val tvConfidence: android.widget.TextView = findViewById(R.id.tvConfidence)
        val ivResult: android.widget.ImageView = findViewById(R.id.ivScanResult)

        tvPrediction.text = prediction
        tvConfidence.text = confidence
        if (imageUri != null) {
            Glide.with(this)
                .load(imageUri)
                .into(ivResult)
        }

        val btnBack: android.widget.ImageButton = findViewById(R.id.btnBack)
        btnBack.setOnClickListener {
            finish()
        }

        val btnScanAgain: android.widget.Button = findViewById(R.id.btnScanAgain)
        btnScanAgain.setOnClickListener {
            val intent = android.content.Intent(this, DashboardActivity::class.java)
            intent.flags = android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
            startActivity(intent)
            finish()
        }

        val btnDownloadReport: Button = findViewById(R.id.btnDownloadReport)
        btnDownloadReport.setOnClickListener {
            generatePDF(prediction, confidence)
        }

        val btnViewHistory: Button = findViewById(R.id.btnViewHistory)
        btnViewHistory.setOnClickListener {
            val intent = Intent(this, ScanHistoryActivity::class.java)
            startActivity(intent)
        }

        val btnViewExplanation: Button = findViewById(R.id.btnViewExplanation)
        btnViewExplanation.setOnClickListener {
            showExplanationBottomSheet(prediction)
        }
    }

    private fun showExplanationBottomSheet(prediction: String) {
        val dialog = com.google.android.material.bottomsheet.BottomSheetDialog(this, R.style.BottomSheetDialogTheme)
        val view = layoutInflater.inflate(R.layout.dialog_detailed_explanation, null)
        dialog.setContentView(view)

        val tvCategory: android.widget.TextView = view.findViewById(R.id.tvExplanationCategory)
        val tvOverview: android.widget.TextView = view.findViewById(R.id.tvOverviewText)
        val tvImplications: android.widget.TextView = view.findViewById(R.id.tvImplicationsText)
        val tvRecommendations: android.widget.TextView = view.findViewById(R.id.tvRecommendationsText)
        val btnClose: Button = view.findViewById(R.id.btnCloseExplanation)

        tvCategory.text = prediction.uppercase()

        val (overview, implications, recommendations) = getExplanationContent(prediction)
        tvOverview.text = overview
        tvImplications.text = implications
        tvRecommendations.text = recommendations

        btnClose.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun getExplanationContent(prediction: String): Triple<String, String, String> {
        return when {
            prediction.contains("Normal", ignoreCase = true) -> Triple(
                "No cervical ribs detected. The C7 vertebral structure appears normal, showing transverse processes of typical length with no evidence of osseous overgrowth.",
                "Normal anatomical structure poses no inherent clinical risk of neuromuscular or vascular compression. Symptoms like pain or numbness should be explored for alternative etiologies.",
                "1. Maintain proper ergonomic posture during study/work.\n2. Do stretching exercises to relieve shoulder and neck tension.\n3. Consult a physician if you experience radiating neck/arm discomfort."
            )
            prediction.contains("Left", ignoreCase = true) -> Triple(
                "A supernumerary (extra) rib is identified originating from the left transverse process of the seventh cervical vertebra (C7).",
                "May compress the brachial plexus nerve trunk or subclavian artery/vein on the left side. This compression can lead to symptoms like pain, tingling, numbness, or weakness radiating down the left arm and hand.",
                "1. Consult an orthopedic specialist or a neurologist for physical evaluation.\n2. Avoid carrying heavy shoulder bags or backpacks on the left shoulder.\n3. Engage in posture correction exercises to alleviate left thoracic outlet pressure."
            )
            prediction.contains("Right", ignoreCase = true) -> Triple(
                "A supernumerary (extra) rib is identified originating from the right transverse process of the seventh cervical vertebra (C7).",
                "Can cause mechanical compression of vascular structures or the brachial plexus nerves on the right side. This could lead to sensory deficits, arm fatigue, pain, or muscle weakness in the right upper extremity.",
                "1. Seek clinical evaluation from a vascular specialist or neurologist.\n2. Avoid repetitive overhead reaching or heavy lifting on the right side.\n3. Utilize neck-shoulder physical therapy techniques under professional guidance."
            )
            else -> Triple(
                "Supernumerary (extra) cervical ribs are detected originating bilaterally from both the left and right transverse processes of the C7 vertebra.",
                "Highest risk of bilateral Thoracic Outlet Syndrome (TOS). Compression of nerve trunks and vascular channels may cause symptoms in both upper extremities, including coldness, pain, numbness, and grip weakness.",
                "1. Immediate consult with a vascular or orthopedic surgeon for clinical correlation.\n2. Strict avoidance of overhead workloads and heavy lifting.\n3. Perform ergonomic workstation assessments to limit shoulder compression."
            )
        }
    }

    private fun generatePDF(prediction: String, confidence: String) {
        val pdfDocument = android.graphics.pdf.PdfDocument()
        val paint = android.graphics.Paint()
        val titlePaint = android.graphics.Paint()
        
        // Page info: A4 size is roughly 595 x 842 points
        val pageInfo = android.graphics.pdf.PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas

        // 1. Header Area - Sleek Dark Theme
        paint.color = android.graphics.Color.parseColor("#1A237E") // Deep Blue
        canvas.drawRect(0f, 0f, 595f, 100f, paint)

        // Clinic Name & Logo Placeholder
        titlePaint.color = android.graphics.Color.WHITE
        titlePaint.textSize = 28f
        titlePaint.isFakeBoldText = true
        canvas.drawText("CERVISCAN AI CLINIC", 40f, 55f, titlePaint)
        
        paint.color = android.graphics.Color.WHITE
        paint.textSize = 12f
        canvas.drawText("Advanced Cervical Rib Detection System", 40f, 80f, paint)

        // 2. Report Info
        paint.color = android.graphics.Color.BLACK
        paint.textSize = 10f
        val sdf = java.text.SimpleDateFormat("dd MMM yyyy, hh:mm a", java.util.Locale.getDefault())
        val currentDate = sdf.format(java.util.Date())
        val scanId = "SRN-${System.currentTimeMillis().toString().takeLast(6)}"
        canvas.drawText("Report ID: $scanId", 440f, 120f, paint)
        canvas.drawText("Date: $currentDate", 440f, 135f, paint)

        // 3. Patient Information Section
        paint.color = android.graphics.Color.parseColor("#EEEEEE")
        canvas.drawRect(40f, 150f, 555f, 250f, paint)
        
        paint.color = android.graphics.Color.parseColor("#1A237E")
        paint.textSize = 14f
        paint.isFakeBoldText = true
        canvas.drawText("PATIENT DETAILS", 50f, 175f, paint)
        
        paint.color = android.graphics.Color.BLACK
        paint.isFakeBoldText = false
        paint.textSize = 12f
        val pName = intent.getStringExtra("patient_name") ?: "N/A"
        val pAge = intent.getStringExtra("patient_age") ?: "N/A"
        val pGender = intent.getStringExtra("patient_gender") ?: "N/A"
        
        canvas.drawText("Full Name:    $pName", 60f, 200f, paint)
        canvas.drawText("Age:              $pAge Years", 60f, 220f, paint)
        canvas.drawText("Gender:         $pGender", 300f, 220f, paint)

        // 4. Clinical Findings Section
        paint.color = android.graphics.Color.parseColor("#1A237E")
        paint.textSize = 14f
        paint.isFakeBoldText = true
        canvas.drawText("CLINICAL FINDINGS & AI ANALYSIS", 40f, 285f, paint)
        
        paint.color = android.graphics.Color.LTGRAY
        canvas.drawLine(40f, 295f, 555f, 295f, paint)

        // Result Highlight Box
        val resultColor = if (prediction.contains("Normal", ignoreCase = true)) "#2E7D32" else "#C62828"
        paint.color = android.graphics.Color.parseColor(resultColor)
        paint.alpha = 40 // Light background
        canvas.drawRoundRect(40f, 310f, 555f, 420f, 12f, 12f, paint)
        
        paint.alpha = 255
        paint.textSize = 16f
        paint.isFakeBoldText = true
        canvas.drawText("Primary Diagnosis:", 60f, 350f, paint)
        
        paint.textSize = 24f
        canvas.drawText(prediction.uppercase(), 60f, 385f, paint)
        
        paint.textSize = 14f
        paint.color = android.graphics.Color.BLACK
        paint.isFakeBoldText = false
        canvas.drawText("AI Confidence Level: $confidence", 60f, 410f, paint)

        // 5. Detailed Interpretation
        paint.textSize = 12f
        paint.isFakeBoldText = true
        canvas.drawText("Medical Interpretation:", 40f, 455f, paint)
        
        paint.isFakeBoldText = false
        val interpretation = when {
            prediction.contains("Normal") -> "No cervical ribs detected. Normal anatomical structure observed."
            prediction.contains("Left") -> "Presence of a supernumerary rib arising from the seventh cervical vertebra (C7) on the LEFT side."
            prediction.contains("Right") -> "Presence of a supernumerary rib arising from the seventh cervical vertebra (C7) on the RIGHT side."
            else -> "Bilateral cervical ribs detected. Potential for Thoracic Outlet Syndrome (TOS) should be clinically evaluated."
        }
        
        val staticLayout = android.text.StaticLayout.Builder.obtain(interpretation, 0, interpretation.length, 
            android.text.TextPaint(paint), 515).build()
        canvas.save()
        canvas.translate(40f, 470f)
        staticLayout.draw(canvas)
        canvas.restore()

        // 6. Signature Area
        paint.color = android.graphics.Color.BLACK
        canvas.drawLine(400f, 700f, 550f, 700f, paint)
        paint.textSize = 10f
        canvas.drawText("Authorized Signature", 420f, 715f, paint)
        canvas.drawText("CerviScan AI System", 425f, 730f, paint)

        // 7. Footer - Modern & Clean
        paint.color = android.graphics.Color.parseColor("#F5F5F5")
        canvas.drawRect(0f, 780f, 595f, 842f, paint)
        
        paint.color = android.graphics.Color.GRAY
        paint.textSize = 9f
        val disclaimer = "DISCLAIMER: This report is generated by an Artificial Intelligence system. It is intended for screening purposes only. A clinical correlation by a certified Radiologist is mandatory for a final diagnosis."
        val discLayout = android.text.StaticLayout.Builder.obtain(disclaimer, 0, disclaimer.length, 
            android.text.TextPaint(paint), 515).build()
        canvas.save()
        canvas.translate(40f, 790f)
        discLayout.draw(canvas)
        canvas.restore()

        pdfDocument.finishPage(page)

        // Save file to Downloads
        val fileName = "CerviScan_Report_${pName.replace(" ", "_")}.pdf"
        val contentValues = android.content.ContentValues().apply {
            put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
            put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
        }

        val uri = contentResolver.insert(android.provider.MediaStore.Files.getContentUri("external"), contentValues)
        
        if (uri != null) {
            try {
                contentResolver.openOutputStream(uri)?.use { outputStream ->
                    pdfDocument.writeTo(outputStream)
                }
                android.widget.Toast.makeText(this, "Report saved to Downloads", android.widget.Toast.LENGTH_LONG).show()
                
                // Open the PDF
                val intent = Intent(Intent.ACTION_VIEW)
                intent.setDataAndType(uri, "application/pdf")
                intent.flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                startActivity(Intent.createChooser(intent, "Open Report"))
                
            } catch (e: Exception) {
                android.widget.Toast.makeText(this, "Error saving PDF: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
        
        pdfDocument.close()
    }
}
