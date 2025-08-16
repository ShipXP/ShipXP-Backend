"use client"

/**
 * @file Routes for AI-related operations.
 */
import { Router } from "express"
import { initDb } from "../lib/db"
import geminiClient from "../lib/geminiClient"

const router = Router()

/**
 * @api {post} /api/ai/generate-missions Generate 5 new missions
 * @apiName GenerateMissions
 * @apiGroup AI
 */
router.post("/generate-missions", async (req, res) => {
  console.log("Received request to generate 5 new missions...")
  try {
    const db = initDb()
    const missionPromises = []
    const difficulties: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Easy", "Medium", "Medium", "Hard"]
    const supportedLanguages = ['javascript', 'rust', 'python', 'anchor-solana', 'go', 'typescript'];

    for (let i = 0; i < 5; i++) {
      const difficulty = difficulties[i]
      const language = supportedLanguages[Math.floor(Math.random() * supportedLanguages.length)];
      missionPromises.push(geminiClient.generateMission(difficulty, language))
    }

    const generatedMissions = await Promise.all(missionPromises)
    const createdMissionIds: string[] = []

    for (const mission of generatedMissions) {
      const newMission = {
        ...mission,
        type: 'ShipQuest', // Identify as an AI-generated ShipQuest
        tags: [mission.difficulty, mission.language],
        status: "eligible",
        createdBy: "ShipXP-AI",
        createdAt: new Date(),
      }
      const docRef = await db.collection("missions").add(newMission)
      createdMissionIds.push(docRef.id)
    }

    console.log(`Successfully created 5 new missions: ${createdMissionIds.join(", ")}`)
    res.status(201).json({ message: "Successfully created 5 new missions", missionIds: createdMissionIds })
  } catch (error) {
    console.error("Failed to generate missions:", error)
    res.status(500).json({ error: "Failed to generate missions" })
  }
})

export default router
