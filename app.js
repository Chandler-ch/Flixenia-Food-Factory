import "dotenv/config";
import express from "express";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from "discord-interactions";
import { getRandomEmoji } from "./utils.js";
import { AttachmentBuilder, Client, GatewayIntentBits } from "discord.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

const imgSrcStart = "./assets/essen/img_";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.login(process.env.DISCORD_TOKEN);

if (process.env.CHANNEL_ID) {
  client.on("ready", (client) => {
    imageComfortableSender(client, imgSrcStart);
    setInterval(
      async () => imageComfortableSender(client, imgSrcStart),
      3 * 60 * 60 * 1000,
    );
  });
}
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

        imageSender(channel, imgSrcStart);

        setInterval(
          async () => imageSender(channel, imgSrcStart),
          3 * 60 * 60 * 1000,
        );
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                // Fetches a random emoji to send from a helper function
                content:
                  "Flixenia's Food Factory started to work!" + channel_id,
              },
            ],
          },
        });
      }

      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: "unknown command" });
    }

    console.error("unknown interaction type", type);
    return res.status(400).json({ error: "unknown interaction type" });
  },
);

async function imageSender(channel, imgSrcStart) {
  const imgNum = Math.floor(Math.random() * 238);
  const attachment = new AttachmentBuilder(imgSrcStart + imgNum + ".jpeg");
  await channel.send({
    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
    files: [attachment],
    components: [
      {
        type: MessageComponentTypes.MEDIA_GALLERY,
        items: [
          {
            media: {
              url: `attachment://img_${imgNum}.jpeg`,
            },
          },
        ],
      },
    ],
  });
}

async function imageComfortableSender(client, imgSrcStart) {
  const imgNum = Math.floor(Math.random() * 238);
  const attachment = new AttachmentBuilder(imgSrcStart + imgNum + ".jpeg");

  client.channels.cache.get(process.env.CHANNEL_ID).send({
    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
    files: [attachment],
    components: [
      {
        type: MessageComponentTypes.MEDIA_GALLERY,
        items: [
          {
            media: {
              url: `attachment://img_${imgNum}.jpeg`,
            },
          },
        ],
      },
    ],
  });
}

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
