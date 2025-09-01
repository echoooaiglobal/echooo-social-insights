// contents/dashboard.ts
import type { PlasmoCSConfig } from "plasmo"
import type { PlasmoMessaging } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: ["http://localhost:3000/*"],
  run_at: "document_end"
}

console.log("🔍 Dashboard content script loaded")

// Plasmo messaging handler
export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("📨 Dashboard message received:", req.name)
  
  if (req.name === "get-dashboard-auth") {
    try {
      const accessToken = localStorage.getItem('accessToken')
      const user = localStorage.getItem('user') 
      const company = localStorage.getItem('company')
      
      if (accessToken && user) {
        res.send({ 
          success: true, 
          data: { accessToken, user, company }
        })
      } else {
        res.send({ success: false, error: "No auth data found" })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      res.send({ success: false, error: errorMessage })
    }
  } else {
    res.send({ success: false, error: "Unknown message" })
  }
}
