import "dotenv/config";
import express from "express";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from "discord-interactions";
import fs from "fs";
import path from "path";
import { getRandomEmoji } from "./utils.js";
import { AttachmentBuilder, Client, GatewayIntentBits } from "discord.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.login(process.env.DISCORD_TOKEN);

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    // Interaction id, type and data
    const { type, data, channel_id } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;

      // "test" command
      if (name === "test") {
        // Send a message into the channel where command was triggered from
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                // Fetches a random emoji to send from a helper function
                content: `hello world ${getRandomEmoji()}`,
              },
            ],
          },
        });
      }

      // 'image' command
      if (name === "image") {
        const channel = await client.channels.fetch(channel_id);

        const imageFolder = "./assets/essen";
        const images = fs
          .readdirSync(imageFolder)
          .map((file) => path.join(imageFolder, file));

        setInterval(
          async () => {
            const image = images[Math.floor(Math.random * images.length)];
            const attachment = new AttachmentBuilder(image);
            await channel.send({
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              files: [attachment],
              components: [
                {
                  type: MessageComponentTypes.MEDIA_GALLERY,
                  items: [
                    {
                      media: {
                        url: `attachment://${image}`,
                      },
                    },
                  ],
                },
              ],
            });
          },
          10 * 60 * 1000,
        );
      }

      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: "unknown command" });
    }

    console.error("unknown interaction type", type);
    return res.status(400).json({ error: "unknown interaction type" });
  },
);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
