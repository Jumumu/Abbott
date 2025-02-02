import fs from "node:fs"

import { type AccessToken, RefreshingAuthProvider } from "@twurple/auth"

import { Bot } from "./Bot.js"

async function createAuthProvider(): Promise<RefreshingAuthProvider> {
  const clientId = process.env.CLIENT_ID
  const clientSecret = process.env.CLIENT_SECRET

  if (clientSecret === undefined || clientId === undefined) {
    throw new Error(
      "Missing environment variables. Make sure to copy .env.example to .env and fill out the values.",
    )
  }

  const authProvider: RefreshingAuthProvider = new RefreshingAuthProvider({
    clientId,
    clientSecret,
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tokenData: AccessToken = JSON.parse(
    fs.readFileSync("./tokens.102460608.json", "utf8"),
  )

  try {
    await authProvider.addUserForToken(tokenData, ["chat"])
  } catch {
    // DO NOT PRINT THIS ERROR; it has secrets in it!
    throw new Error(
      "Couldn't call addUserForToken. Probably sent a bad refresh token. Follow https://twurple.js.org/docs/examples/chat/basic-bot.html to fix it.",
    )
  }

  authProvider.onRefresh((userId: string, newTokenData: AccessToken) => {
    fs.writeFileSync(
      `./tokens.${userId}.json`,
      JSON.stringify(newTokenData, null, 4),
      { encoding: "utf8" },
    )
  })

  return authProvider
}

async function createBot(authProvider: RefreshingAuthProvider): Promise<Bot> {
  const bot = new Bot({ authProvider })

  await bot.init()

  return bot
}

export async function init() {
  console.info("Starting the Twitch bot")

  const authProvider = await createAuthProvider()
  await createBot(authProvider)

  console.info("Successfully created the Twitch bot")
}
