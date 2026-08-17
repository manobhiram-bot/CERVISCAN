package com.simats.CerviScan

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.simats.CerviScan.network.ScanItem
import com.bumptech.glide.Glide

class ScanHistoryAdapter(
    private var history: List<ScanItem>,
    private val onDeleteClick: (ScanItem) -> Unit
) : RecyclerView.Adapter<ScanHistoryAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvName: TextView = view.findViewById(R.id.tvName)
        val tvDetails: TextView = view.findViewById(R.id.tvDetails)
        val tvPrediction: TextView = view.findViewById(R.id.tvPrediction)
        val tvConfidence: TextView = view.findViewById(R.id.tvConfidence)
        val ivThumb: ImageView = view.findViewById(R.id.ivThumb)
        val ivDelete: ImageView = view.findViewById(R.id.ivDelete)
    }

    fun updateList(newList: List<ScanItem>) {
        history = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_scan_history, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = history[position]
        holder.tvName.text = item.patientName
        
        // Format the date/time nicely
        val displayDate = item.createdAt.split(".")[0] // Remove milliseconds if any
        holder.tvDetails.text = "Age: ${item.age} • ${item.gender}\nDate: $displayDate"
        
        holder.tvPrediction.text = "Prediction: ${item.prediction}"
        holder.tvConfidence.text = "Confidence: ${item.confidence}"
        
        Glide.with(holder.itemView.context)
            .load(item.imagePath)
            .placeholder(android.R.color.darker_gray)
            .into(holder.ivThumb)

        holder.ivDelete.setOnClickListener {
            onDeleteClick(item)
        }

        holder.itemView.setOnClickListener {
            val context = holder.itemView.context
            val intent = android.content.Intent(context, ScanResultActivity::class.java)
            intent.putExtra("prediction", item.prediction)
            intent.putExtra("confidence", item.confidence)
            intent.putExtra("image_uri", item.imagePath)
            context.startActivity(intent)
        }
    }

    override fun getItemCount() = history.size
}
